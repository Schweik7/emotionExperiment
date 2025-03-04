import { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { useFileSystem } from './FileSystemContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface WatchingPhaseProps {
  participantId: number;
  videoFileName: string;
  onComplete: () => void;
}

export function WatchingPhase({ participantId, videoFileName, onComplete }: WatchingPhaseProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getVideoUrl, selectDirectory, directoryHandle } = useFileSystem();

  useEffect(() => {
    async function loadVideo() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 如果还没有选择目录，先提示用户选择
        if (!directoryHandle) {
          // 选择目录的逻辑放在其他地方处理
          return;
        }
        
        // 获取视频URL
        const url = await getVideoUrl(videoFileName);
        
        if (!url) {
          setError(`无法加载视频文件: ${videoFileName}`);
          return;
        }
        
        setVideoUrl(url);
      } catch (err) {
        console.error('加载视频出错:', err);
        setError('加载视频时出错，请刷新页面重试');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVideo();
  }, [videoFileName, getVideoUrl, directoryHandle]);
  
  const handleRetry = async () => {
    const success = await selectDirectory();
    if (success) {
      setError(null);
      setIsLoading(true);
      
      // 重新获取视频URL
      const url = await getVideoUrl(videoFileName);
      if (url) {
        setVideoUrl(url);
        setError(null);
      } else {
        setError(`无法找到视频文件: ${videoFileName}`);
      }
      
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-gray-700">正在加载视频，请稍候...</p>
      </div>
    );
  }
  
  if (error || !videoUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">视频加载失败</h2>
          <p className="text-gray-700 mb-6">{error || '无法加载视频文件，请选择包含实验视频的文件夹'}</p>
          <Button onClick={handleRetry} className="w-full">
            选择视频文件夹
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full">
      <VideoPlayer 
        videoUrl={videoUrl} 
        onComplete={onComplete} 
      />
    </div>
  );
}