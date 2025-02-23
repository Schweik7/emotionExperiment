// src/components/ExperimentFlow/WatchingPhase.tsx
import { useEffect, useState } from 'react';
import { VideoPlayer } from "../ui/VideoPlayer";
import { Button } from "@/components/ui/button";

interface WatchingPhaseProps {
  participantId: number;
  videoFileName: string;
  onComplete: () => void;
}

export function WatchingPhase({ participantId, videoFileName, onComplete }: WatchingPhaseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const videoUrl = `${API_URL}/videos/${videoFileName}`;

  useEffect(() => {
    // 检查视频是否可访问
    const checkVideo = async () => {
      try {
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error('视频加载失败');
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading video:', err);
        setError('视频加载失败，请刷新页面重试');
      }
    };

    checkVideo();
  }, [videoUrl]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-5xl px-6">
        <VideoPlayer
          videoUrl={videoUrl}
          onComplete={onComplete}
          isHealing={false}
        />

        {/* 开发环境调试信息 */}
        {/* {import.meta.env.DEV && (
          <div className="mt-4 bg-white/10 p-4 rounded text-white text-sm">
            <div>参与者ID: {participantId}</div>
            <div>当前视频: {videoFileName}</div>
          </div>
        )} */}

        {/* 开发环境跳过按钮 */}
        {/* {import.meta.env.DEV && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={onComplete}
            >
              跳过视频
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
}