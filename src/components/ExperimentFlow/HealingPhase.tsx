import { useEffect, useState } from 'react';
import { VideoPlayer } from "../ui/VideoPlayer";
import { Button } from "@/components/ui/button";
import { useFileSystem } from './FileSystemContext';
import { Loader2 } from 'lucide-react';

interface HealingPhaseProps {
  onComplete: () => void;
}

export function HealingPhase({ onComplete }: HealingPhaseProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 视频文件名固定为"放松视频.mp4"
  const videoFileName = "放松视频.mp4";
  const { getVideoUrl, selectDirectory, directoryHandle } = useFileSystem();

  useEffect(() => {
    async function loadVideo() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 如果还没有选择目录，先提示用户选择
        if (!directoryHandle) {
          // 错误提示会在渲染部分显示
          setIsLoading(false);
          return;
        }
        
        // 获取视频URL
        const url = await getVideoUrl(videoFileName);
        
        if (!url) {
          setError(`无法加载放松视频文件: ${videoFileName}`);
          setIsLoading(false);
          return;
        }
        
        setVideoUrl(url);
        setIsLoading(false);
      } catch (err) {
        console.error('加载放松视频出错:', err);
        setError('加载放松视频时出错，请刷新页面重试');
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
        setError(`无法找到放松视频文件: ${videoFileName}`);
      }
      
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-gray-300">正在加载放松视频，请稍候...</p>
      </div>
    );
  }
  
  if (error || !videoUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-4">放松视频加载失败</h2>
          <p className="text-gray-300 mb-6">{error || '无法加载放松视频文件，请选择包含"放松视频.mp4"的文件夹'}</p>
          <Button onClick={handleRetry} className="w-full bg-blue-600 hover:bg-blue-700">
            选择视频文件夹
          </Button>
          
          {/* 开发环境跳过按钮 */}
          {import.meta.env.DEV && (
            <Button
              variant="ghost"
              className="mt-4 text-gray-400 hover:text-white hover:bg-gray-700 w-full"
              onClick={onComplete}
            >
              跳过放松视频
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full">
        <VideoPlayer
          videoUrl={videoUrl}
          onComplete={onComplete}
          isHealing={true}
        />
        
        {/* 开发环境调试信息 */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-xs">
            <div className="text-sm">当前视频: 放松视频.mp4</div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-white hover:bg-white/10 w-full"
              onClick={onComplete}
            >
              跳过放松视频
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}