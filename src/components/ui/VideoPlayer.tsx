import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, SkipForward } from 'lucide-react';

// 在开发环境允许跳过视频
const skipVideo = true;

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
  isHealing?: boolean;
}

export function VideoPlayer({ videoUrl, onComplete, isHealing = false }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const completionTimerRef = useRef<number | null>(null);
  
  // 清理资源的函数
  const cleanupResources = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    
    // 如果正在全屏模式，尝试退出
    if (document.fullscreenElement && !playing) {
      try {
        document.exitFullscreen();
      } catch (err) {
        console.warn('退出全屏失败:', err);
      }
    }
  }, [playing]);
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);
  
  // 视频URL变化时重置状态
  useEffect(() => {
    setPlaying(false);
    setCompleted(false);
    setReady(false);
    setProgress(0);
    cleanupResources();
  }, [videoUrl, cleanupResources]);
  
  // 处理全屏
  const enterFullScreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        containerRef.current.requestFullscreen().catch(err => {
          console.warn('无法进入全屏:', err);
        });
      } catch (err) {
        console.warn('请求全屏发生错误:', err);
      }
    }
  }, []);
  
  // 播放时自动进入全屏
  useEffect(() => {
    if (playing && !document.fullscreenElement) {
      enterFullScreen();
    }
  }, [playing, enterFullScreen]);
  
  // 禁用ESC键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F11' || e.keyCode === 27) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
  
  // 视频准备就绪的处理函数
  const handleReady = () => {
    console.log('视频已准备就绪');
    setReady(true);
  };
  
  // 视频进度更新处理函数
  const handleProgress = (state: { played: number; loaded: number; playedSeconds: number }) => {
    setProgress(state.played * 100);
    
    // 如果播放完成
    if (state.played >= 0.999) {
      handleVideoEnded();
    }
  };
  
  // 视频结束处理函数
  const handleVideoEnded = () => {
    if (completed) return;
    
    setPlaying(false);
    setCompleted(true);
    
    // 10秒后执行完成回调
    if (completionTimerRef.current === null) {
      completionTimerRef.current = window.setTimeout(() => {
        onComplete();
        completionTimerRef.current = null;
      }, 10000) as unknown as number;
    }
  };
  
  // 开始播放
  const handlePlayClick = () => {
    setPlaying(true);
    if (!document.fullscreenElement) {
      enterFullScreen();
    }
  };
  
  // 暂停播放
  const handlePauseClick = () => {
    setPlaying(false);
  };
  
  // 跳过视频
  const handleSkipVideo = () => {
    setPlaying(false);
    setCompleted(true);
    
    // 立即执行完成回调
    setTimeout(() => {
      onComplete();
    }, 100);
  };
  
  // 视频错误处理
  const handleError = (error: any) => {
    console.error('视频播放错误:', error);
    // 如果出错，尝试重新加载
    if (playerRef.current && !completed) {
      setPlaying(false);
      setTimeout(() => {
        setPlaying(true);
      }, 1000);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-black w-full h-full overflow-hidden"
      style={{ width: '100%', height: '100vh' }}
    >
      {/* 页面顶部标签 */}
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full z-20">
        <span className="text-white text-sm">
          {isHealing ? '放松训练' : '实验视频'}
        </span>
      </div>
      
      {/* ReactPlayer组件 */}
      <div className="player-wrapper w-full h-full">
        <ReactPlayer
          ref={playerRef}
          className="react-player"
          url={videoUrl}
          width="100%"
          height="100%"
          playing={playing}
          controls={false}
          playsinline
          pip={false}
          stopOnUnmount={true}
          onReady={handleReady}
          onProgress={handleProgress}
          onEnded={handleVideoEnded}
          onError={handleError}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload noplaybackrate nofullscreen',
                disablePictureInPicture: true,
                onContextMenu: (e: React.MouseEvent) => e.preventDefault()
              },
              forceVideo: true,
              forceAudio: false
            }
          }}
          style={{
            pointerEvents: 'none', // 禁止点击视频元素
            objectFit: 'contain'
          }}
        />
      </div>
      
      {/* 播放按钮 - 仅在视频准备就绪且未播放时显示 */}
      {ready && !playing && !completed && (
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors z-10"
          onClick={handlePlayClick}
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/40 transition-colors">
            <Play className="h-10 w-10 text-white" />
          </div>
        </button>
      )}
      
      {/* 暂停按钮 - 仅在播放中显示 */}
      {playing && !completed && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
            onClick={handlePauseClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </Button>
        </div>
      )}
      
      {/* 开发环境跳过按钮 */}
      {import.meta.env.DEV && skipVideo && !completed && (
        <div className="absolute bottom-4 right-4 z-20">
          <Button
            variant="ghost"
            className="bg-black/50 hover:bg-black/70 text-white"
            onClick={handleSkipVideo}
          >
            <SkipForward className="mr-2 h-4 w-4" />
            跳过视频
          </Button>
        </div>
      )}
      
      {/* 视频完成界面 */}
      {completed && (
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