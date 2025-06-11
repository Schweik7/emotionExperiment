import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowRight } from 'lucide-react';

// 在开发环境允许跳过视频（通过空格键，不显示按钮）
const skipVideo = true;

interface VideoPlayerProps {
  videoUrl?: string;
  onComplete: () => void;
  isHealing?: boolean;
  onStartWatching?: () => void;
  onEndWatching?: () => void;
}

export function VideoPlayer({ 
  videoUrl, 
  onComplete, 
  isHealing = false,
  onStartWatching,
  onEndWatching
}: VideoPlayerProps) {
  // 简化状态管理，只使用少量必要状态
  const [playerState, setPlayerState] = useState({
    playing: false,      // 是否正在播放
    completed: false,    // 是否已完成播放
    loading: true,       // 是否正在加载
    error: null as string | null, // 错误信息
    started: false       // 是否已开始播放（用于记录开始时间）
  });
  
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const completionTimerRef = useRef<number | null>(null);
  
  // 重置组件状态
  const resetState = useCallback(() => {
    setPlayerState({
      playing: false,
      completed: false,
      loading: true,
      error: null,
      started: false
    });
    
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);
  
  // 视频URL变化时重置状态
  useEffect(() => {
    resetState();
    
    // 3秒后无论如何都隐藏加载指示器
    const timer = setTimeout(() => {
      setPlayerState(prev => ({ ...prev, loading: false }));
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      // 清理全屏
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen();
        } catch (err) {
          console.warn('退出全屏失败:', err);
        }
      }
    };
  }, [videoUrl, resetState]);
  
  // 处理播放控制
  const handlePlayPause = useCallback(() => {
    // 如果是第一次开始播放，触发开始观看回调
    if (!playerState.started && !playerState.playing) {
      setPlayerState(prev => ({ ...prev, started: true }));
      onStartWatching?.();
    }
    
    setPlayerState(prev => ({ 
      ...prev, 
      playing: !prev.playing,
      // 确保不会在点击播放/暂停时显示加载中
      loading: false 
    }));
  }, [onStartWatching, playerState.playing, playerState.started]);
  
  // 处理视频就绪
  const handleReady = () => {
    console.log('视频已就绪');
    setPlayerState(prev => ({ ...prev, loading: false }));
  };
  
  // 处理视频播放开始
  const handlePlay = () => {
    // 如果是第一次开始播放，触发开始观看回调
    if (!playerState.started) {
      setPlayerState(prev => ({ ...prev, started: true, loading: false }));
      onStartWatching?.();
    } else {
      setPlayerState(prev => ({ ...prev, loading: false }));
    }
  };
  
  // 处理视频进度
  const handleProgress = (state: { played: number }) => {
    // 当有播放进度时，不再是加载状态
    if (state.played > 0) {
      setPlayerState(prev => {
        if (prev.loading) return { ...prev, loading: false };
        return prev;
      });
    }
    
    // 检测视频是否播放完成
    if (state.played >= 0.99) {
      handleComplete();
    }
  };
  
  // 处理视频播放完成
  const handleComplete = useCallback(() => {
    if (playerState.completed) return;
    
    setPlayerState(prev => ({ 
      ...prev,
      playing: false, 
      completed: true,
      loading: false
    }));
    
    // 触发结束观看回调
    onEndWatching?.();
    
    // 10秒后执行完成回调
    if (!completionTimerRef.current) {
      completionTimerRef.current = window.setTimeout(() => {
        onComplete();
        completionTimerRef.current = null;
      }, 10000) as unknown as number;
    }
  }, [playerState.completed, onComplete, onEndWatching]);
  
  // 视频错误处理
  const handleError = (error: any) => {
    console.error('视频播放错误:', error);
    setPlayerState(prev => ({ 
      ...prev,
      playing: false, 
      loading: false,
      error: '视频播放失败，请检查网络连接或刷新页面'
    }));
  };
  
  // 跳过视频（仅开发环境）
  const handleSkipVideo = useCallback(() => {
    // 如果尚未触发开始观看，触发它
    if (!playerState.started) {
      onStartWatching?.();
    }
    
    // 触发结束观看
    onEndWatching?.();
    
    setPlayerState({
      playing: false,
      completed: true,
      loading: false,
      error: null,
      started: true
    });
    
    setTimeout(() => {
      onComplete();
    }, 100);
  }, [onComplete, onStartWatching, onEndWatching, playerState.started]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 阻止ESC键退出全屏
      if (e.key === 'Escape' || e.key === 'F11' || e.keyCode === 27) {
        e.preventDefault();
        return false;
      }
      
      // 添加空格键跳过功能（仅在开发环境且skipVideo为true时启用）
      if (import.meta.env.DEV && skipVideo && e.code === 'Backslash' && !playerState.completed) {
        e.preventDefault();
        handleSkipVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [playerState.completed, handleSkipVideo]);

  return (
    <div 
      ref={containerRef}
      className="relative bg-black w-full overflow-hidden flex justify-center items-center"
      style={{ width: '100%', height: '100vh' }}
    >
      {/* 页面顶部标签 */}
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full z-20">
        <span className="text-white text-sm">
          {isHealing ? '放松训练' : '实验视频'}
        </span>
      </div>
      
      {/* 加载指示器 */}
      {playerState.loading && !playerState.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-center mt-4">视频加载中...</p>
        </div>
      )}
      
      {/* 错误提示 */}
      {playerState.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p className="text-white text-center mb-4">{playerState.error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            刷新页面
          </Button>
        </div>
      )}
      
      {/* ReactPlayer组件 - 设置为屏幕的2/3大小 */}
      <div className="player-wrapper relative" style={{ width: '66.7%', height: '66.7vh' }}>
        {videoUrl && (
          <ReactPlayer
            ref={playerRef}
            className="react-player"
            url={videoUrl}
            width="100%"
            height="100%"
            playing={playerState.playing}
            controls={false}
            playsinline
            pip={false}
            stopOnUnmount={true}
            onReady={handleReady}
            onPlay={handlePlay}
            onProgress={handleProgress}
            onEnded={handleComplete}
            onError={handleError}
            progressInterval={500}
            playbackRate={1.0}
            volume={1}
            muted={false}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload noplaybackrate nofullscreen',
                  disablePictureInPicture: true,
                  preload: 'auto',
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault()
                },
                forceVideo: true,
                forceAudio: false,
                fastSeek: true
              }
            }}
            style={{
              pointerEvents: 'none',
              objectFit: 'contain',
              backgroundColor: 'black'
            }}
          />
        )}
      </div>
      
      {/* 播放/暂停控制 - 不在加载时和完成后显示 */}
      {!playerState.loading && !playerState.completed && !playerState.error && videoUrl && (
        <>
          {/* 播放按钮 - 仅在暂停时显示 */}
          {!playerState.playing && (
            <button
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors z-10"
              onClick={handlePlayPause}
            >
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/40 transition-colors">
                <Play className="h-10 w-10 text-white" />
              </div>
            </button>
          )}

          {/* 暂停按钮 - 仅在播放时显示，位于右上角 */}
          {playerState.playing && (
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                onClick={handlePlayPause}
              >
                <Pause className="h-6 w-6" />
              </Button>
            </div>
          )}
        </>
      )}
      
      {/* 视频完成界面 */}
      {playerState.completed && (
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