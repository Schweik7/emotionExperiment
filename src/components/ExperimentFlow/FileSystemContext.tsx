import React, { createContext, useState, useContext, useEffect } from 'react';

interface FileSystemContextType {
  directoryHandle: FileSystemDirectoryHandle | null;
  videoCache: Map<string, string>;
  selectDirectory: () => Promise<boolean>;
  getVideoUrl: (fileName: string) => Promise<string | null>;
  isReady: boolean;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [videoCache] = useState<Map<string, string>>(new Map());
  const [isReady, setIsReady] = useState(false);

  // 尝试从localStorage恢复权限
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // 检查是否支持File System Access API
        if (!('showDirectoryPicker' in window)) {
          console.warn('File System Access API is not supported in this browser');
          return;
        }

        // 从localStorage中获取保存的目录句柄（如果有）
        const savedDirHandle = localStorage.getItem('videoDirHandle');
        if (savedDirHandle) {
          try {
            const handle = await self.indexedDB.databases();
            // 获取目录访问权限
            // 注意：这里有安全限制，需要用户交互
            console.log('尝试恢复之前选择的目录权限...');
            setIsReady(true);
          } catch (err) {
            console.warn('无法恢复目录访问权限:', err);
            localStorage.removeItem('videoDirHandle');
            setDirectoryHandle(null);
          }
        } else {
          setIsReady(true);
        }
      } catch (err) {
        console.error('初始化文件系统访问时出错:', err);
        setIsReady(true);
      }
    };

    checkPermission();
  }, []);

  // 选择视频目录
  const selectDirectory = async (): Promise<boolean> => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('您的浏览器不支持直接访问本地文件系统，请使用最新版Chrome或Edge浏览器。');
        return false;
      }

      // 打开目录选择器
      const dirHandle = await window.showDirectoryPicker({
        id: 'videoDirectory',
        mode: 'read',
        startIn: 'documents'
      });

      setDirectoryHandle(dirHandle);

      // 在开发环境中记录目录名称以便调试
      if (import.meta.env.DEV) {
        console.log('已选择目录:', dirHandle.name);
      }

      // 清除缓存
      videoCache.clear();

      // 测试目录是否可访问
      try {
        // 读取目录中的一个文件以测试权限
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && 
              (entry.name.endsWith('.mp4') || 
               entry.name.endsWith('.webm'))) {
            console.log('找到视频文件:', entry.name);
            break;
          }
        }
      } catch (err) {
        console.error('读取目录失败:', err);
        return false;
      }

      try {
        // 尝试将目录句柄持久化
        localStorage.setItem('videoDirHandle', '1');
      } catch (err) {
        console.warn('无法持久化目录句柄:', err);
      }

      return true;
    } catch (err) {
      console.error('选择目录失败:', err);
      return false;
    }
  };

  // 获取视频URL
  const getVideoUrl = async (fileName: string): Promise<string | null> => {
    if (!directoryHandle) {
      console.error('没有选择视频目录');
      return null;
    }

    // 检查缓存
    if (videoCache.has(fileName)) {
      return videoCache.get(fileName) || null;
    }

    try {
      // 获取文件句柄
      const fileHandle = await directoryHandle.getFileHandle(fileName);
      
      // 获取文件内容
      const file = await fileHandle.getFile();
      
      // 创建URL
      const url = URL.createObjectURL(file);
      
      // 保存到缓存
      videoCache.set(fileName, url);
      
      return url;
    } catch (err) {
      console.error(`获取视频文件 ${fileName} 失败:`, err);
      return null;
    }
  };

  const value = {
    directoryHandle,
    videoCache,
    selectDirectory,
    getVideoUrl,
    isReady
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};