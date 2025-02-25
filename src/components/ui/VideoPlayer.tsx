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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement !== null ||
        document.webkitFullscreenElement !== null ||
        document.mozFullScreenElement !== null ||
        document.msFullscreenElement !== null
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 自动进入全屏
  const enterFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).mozRequestFullScreen) { // Firefox
        (container as any).mozRequestFullScreen();
      } else if ((container as any).webkitRequestFullscreen) { // Chrome and Safari
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).msRequestFullscreen) { // IE/Edge
        (container as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('全屏请求失败:', error);
    }
  };

  // 当视频开始播放时进入全屏
  useEffect(() => {
    if (isPlaying && !isFullscreen) {
      enterFullScreen();
    }
  }, [isPlaying, isFullscreen]);

  // 处理进度更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        setIsPlaying(false);
      }
    };

    if (isPlaying) {
      const interval = setInterval(updateProgress, 100); // 每100ms更新一次进度
      return () => clearInterval(interval);
    }

    return () => {};
  }, [isPlaying]);

  // 监听进度到达100%
  useEffect(() => {
    if (progress >= 100) {
      setIsPlaying(false);
      const timer = setTimeout(() => {
        onComplete();
      }, 10000);  // 10秒后去评分阶段
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  // 禁止退出全屏的键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 阻止F11, ESC和其他可能退出全屏的按键
      if (e.key === 'F11' || e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handlePlayClick = () => {
    setIsPlaying(true);
    // 确保进入全屏
    if (!isFullscreen) {
      enterFullScreen();
    }
  };

  const handlePauseClick = () => {
    setIsPlaying(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-black w-full aspect-video rounded-lg overflow-hidden"
      style={{ width: '100%', height: '100vh' }}
    >
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full z-10">
        <span className="text-white text-sm">
          {isHealing ? '放松训练' : '实验视频'}
        </span>
      </div>

      {/* 视频元素 - 移除controls属性，添加disablePictureInPicture和controlsList */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={videoUrl}
        playsInline
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()} // 禁止右键菜单
        controlsList="nodownload noplaybackrate nofullscreen" // 禁止下载、播放速率控制和全屏按钮
        onEnded={() => setProgress(100)}
      />

      {/* 播放按钮 */}
      {!isPlaying && progress < 100 && (
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors z-10"
          onClick={handlePlayClick}
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/40 transition-colors">
            <Play className="h-10 w-10 text-white" />
          </div>
        </button>
      )}

      {/* 暂停按钮 */}
      {isPlaying && progress < 100 && (
        <div className="absolute top-4 right-4 z-10">
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
        <div className="absolute bottom-4 right-4 z-10">
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
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
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