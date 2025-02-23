// src/components/ExperimentFlow/WatchingPhase.tsx
import { useEffect, useState } from 'react';
import { VideoPlayer } from "../ui/VideoPlayer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

interface WatchingPhaseProps {
  onComplete: () => void;
}

export function WatchingPhase({ onComplete }: WatchingPhaseProps) {
  const [hasWatched, setHasWatched] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // 3秒后自动隐藏指导语
  useEffect(() => {
    if (showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showInstructions]);

  return (
    <div className="relative h-screen bg-black flex items-center justify-center">
      {/* 指导语遮罩 */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
          <div className="text-center text-white space-y-4 max-w-lg p-6">
            <h2 className="text-2xl font-semibold">请专注观看视频</h2>
            <p className="text-gray-300">
              观看结束后，您将需要对视频引发的情绪进行评分。
            </p>
          </div>
        </div>
      )}

      {/* 视频区域 */}
      <div className="w-full max-w-5xl px-6">
        <div className="relative">
          {/* 进度提示 */}
          <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full z-10">
            <span className="text-white text-sm">实验视频</span>
          </div>
          
          <VideoPlayer 
            onComplete={() => {
              setHasWatched(true);
              // 给用户一点时间查看完成状态
              setTimeout(onComplete, 1500);
            }} 
          />
        </div>

        {/* 可选：跳过按钮（仅用于开发测试） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-4 right-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={onComplete}
            >
              跳过视频
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}