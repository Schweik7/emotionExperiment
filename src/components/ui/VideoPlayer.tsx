import  { useState, useEffect } from 'react';
import { Button } from "./button";
import { Play, Pause, ArrowRight } from 'lucide-react';

interface VideoPlayerProps {
  isHealing?: boolean;
  onComplete?: () => void;
}

export function VideoPlayer({ isHealing = false, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && progress < 100) {
      timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            clearInterval(timer);
            setIsPlaying(false);
            if (onComplete) onComplete();
          }
          return Math.min(newProgress, 100);
        });
      }, 40); // 2秒完成
    }
    return () => clearInterval(timer);
  }, [isPlaying, progress, onComplete]);

  return (
    <div className="relative bg-black w-full aspect-video rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full">
        <span className="text-white text-sm">
          {isHealing ? '放松训练' : '实验视频'}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-white text-lg">
          {isHealing ? '正念放松视频内容' : '实验视频内容'}
        </p>
      </div>

      {!isPlaying && progress < 100 && (
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          onClick={() => setIsPlaying(true)}
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
            onClick={() => setIsPlaying(false)}
          >
            <Pause className="h-6 w-6" />
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