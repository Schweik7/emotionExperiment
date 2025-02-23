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

  // 用于调试
  useEffect(() => {
    console.log('WatchingPhase mounted');
    return () => console.log('WatchingPhase unmounted');
  }, []);

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto"> {/* 调整最大宽度并居中 */}
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">

          {/* 视频标题 */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/50 px-4 py-2 rounded-full">
              <span className="text-white text-sm">实验视频</span>
            </div>
          </div>

          {/* 视频内容 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg mb-2">实验视频内容</p>
              <p className="text-sm text-gray-400">（此处将显示实际视频）</p>
            </div>
          </div>

          {/* 播放按钮 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button 
              variant="ghost" 
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white rounded-full w-20 h-20"
              onClick={() => {
                // 模拟2秒后视频播放完成
                setTimeout(() => {
                  setHasWatched(true);
                  onComplete();
                }, 2000);
              }}
            >
              <svg 
                className="w-8 h-8" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-white/10 rounded text-white">
            <p>调试信息：</p>
            <p>hasWatched: {hasWatched.toString()}</p>
            <p>showInstructions: {showInstructions.toString()}</p>
          </div>
        )}
      </div>

      {/* 开发环境跳过按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          className="absolute bottom-4 right-4 bg-white/10"
          onClick={onComplete}
        >
          跳过视频
          <ArrowRight className="ml-2" />
        </Button>
      )}
    </div>
  );
}