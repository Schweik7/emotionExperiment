// src/components/ui/VideoPlayer.tsx
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowRight, SkipForward } from 'lucide-react';

const skipVideo = true;

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
  isHealing?: boolean;
}

export function VideoPlayer({ videoUrl, onComplete, isHealing = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimer = useRef<NodeJS.Timeout>();

  // 处理视频播放和暂停
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(error => {
        console.error('视频播放失败:', error);
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // 处理进度更新
  useEffect(() => {
    if (!isPlaying || progress >= 100) return;

    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(progressTimer.current);
          setIsPlaying(false);
          return 100;
        }
        return newProgress;
      });
    }, 40);

    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, [isPlaying, progress]);

  // 监听进度到达100%
  useEffect(() => {
    if (progress >= 100) {
      setIsPlaying(false);
      const timer = setTimeout(() => {
        onComplete();
      }, 3000); // 给用户一秒钟看完成状态
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const handlePauseClick = () => {
    setIsPlaying(false);
  };

  return (
    <div className="relative bg-black w-full aspect-video rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full">
        <span className="text-white text-sm">
          {isHealing ? '放松训练' : '实验视频'}
        </span>
      </div>

      {/* 实际视频元素 */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={videoUrl}
        playsInline
        onEnded={() => setProgress(100)}
      />

      {!isPlaying && progress < 100 && (
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          onClick={handlePlayClick}
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/40 transition-colors">
            <Play className="h-10 w-10 text-white" />
          </div>
        </button>
      )}

      {isPlaying && progress < 100 && (
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
            onClick={handlePauseClick}
          >
            <Pause className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* 开发环境的跳过按钮 */}
      {import.meta.env.DEV && skipVideo && progress < 100 && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="ghost"
            className="bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setProgress(100)}
          >
            <SkipForward className="mr-2 h-4 w-4" />
            跳过视频
          </Button>
        </div>
      )}

      {progress >= 100 && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">观看完成</h2>
            <Button 
              size="lg"
              className="bg-white text-black hover:bg-white/90"
              onClick={onComplete}
            >
              {isHealing ? '结束实验' : '去评分'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}