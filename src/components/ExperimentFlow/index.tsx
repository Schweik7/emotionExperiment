import { useState, useEffect } from 'react';
import { IntroPhase } from './IntroPhase';
import { WatchingPhase } from './WatchingPhase';
import { RatingPhase } from './RatingPhase';
import { HealingPhase } from './HealingPhase';
import { EndPhase } from './EndPhase';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { FileSystemProvider, useFileSystem } from './FileSystemContext';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Phase = 'intro' | 'watching' | 'rating' | 'healing' | 'end' | 'select-directory';
interface RatingData {
  excited: { intensity: number; frequency: number };
  // alert 部分已删除
  tense: { intensity: number; frequency: number };
  anxious: { intensity: number; frequency: number };
  terrified: { intensity: number; frequency: number };
  desperate: { intensity: number; frequency: number };
  physical: number;
  psychological: number;
}

interface WatchTimeData {
  startTime: string;
  endTime: string;
}

function ErrorFallback({ resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6 space-y-4">
        <h2 className="text-xl font-semibold text-red-600">出现了一些问题</h2>
        <p className="text-gray-600">抱歉，实验程序遇到了错误。</p>
        <Button onClick={resetErrorBoundary}>重新开始</Button>
      </div>
    </div>
  );
}

function ExperimentFlowContent() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [nameError, setNameError] = useState('');
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const { selectDirectory, directoryHandle, isReady } = useFileSystem();
  
  // 添加视频观看时间记录
  const [watchTimeData, setWatchTimeData] = useState<WatchTimeData | null>(null);

  // 开发环境调试面板
  const [debugInfo, setDebugInfo] = useState({});
  useEffect(() => {
    if (import.meta.env.DEV) {
      setDebugInfo({
        phase,
        participantId,
        currentVideo,
        hasDirectoryAccess: !!directoryHandle,
        watchTimeData
      });
    }
  }, [phase, participantId, currentVideo, directoryHandle, watchTimeData]);

  // 检查是否已经选择了目录
  useEffect(() => {
    if (isReady && phase === 'watching' && !directoryHandle) {
      setPhase('select-directory');
    }
  }, [phase, directoryHandle, isReady]);

  const handleStartExperiment = () => {
    setShowNameDialog(true);
  };

  const handleSubmitName = async () => {
    if (!participantName.trim()) {
      setNameError('请输入编号');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: participantName }),
      });
      
      if (!response.ok) throw new Error('创建或查找参与者失败');
      
      const data = await response.json();
      
      // 设置参与者ID
      setParticipantId(data.participant.id);
      
      // 检查是否已完成所有视频
      if (data.completed) {
        // 如果已完成所有视频，直接进入结束页面
        setPhase('end');
        setShowNameDialog(false);
        return;
      }
      
      // 设置当前视频
      setCurrentVideo(data.currentVideo);
      
      // 显示恢复会话提示
      if (data.resuming) {
        // 可以添加一个提示或通知，告知用户正在恢复之前的实验进度
        console.log('正在恢复实验进度');
      }
      
      setShowNameDialog(false);
      
      // 检查是否已选择目录
      if (directoryHandle) {
        setPhase('watching');
      } else {
        setPhase('select-directory');
      }
    } catch (error) {
      console.error('Failed to start experiment:', error);
      setNameError('创建或查找参与者失败，请重试');
    }
  };

  const handleSelectDirectory = async () => {
    const success = await selectDirectory();
    if (success) {
      // 如果选择成功且有当前视频，进入观看阶段
      if (currentVideo) {
        setPhase('watching');
      }
    }
  };

  // 视频观看完成回调，接收开始和结束时间
  const handleWatchingComplete = (timeData: WatchTimeData) => {
    setWatchTimeData(timeData);
    setPhase('rating');
  };

  const handleSubmitRatings = async (ratings: RatingData) => {
    if (!participantId || !currentVideo || !watchTimeData) return;

    try {
      const response = await fetch(`${API_URL}/api/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          videoFileName: currentVideo,
          startWatchingTime: watchTimeData.startTime,
          endWatchingTime: watchTimeData.endTime,
          excitedIntensity: ratings.excited.intensity,
          excitedFrequency: ratings.excited.frequency,
          // alertIntensity 和 alertFrequency 已删除
          tenseIntensity: ratings.tense.intensity,
          tenseFrequency: ratings.tense.frequency,
          anxiousIntensity: ratings.anxious.intensity,
          anxiousFrequency: ratings.anxious.frequency,
          terrifiedIntensity: ratings.terrified.intensity,
          terrifiedFrequency: ratings.terrified.frequency,
          desperateIntensity: ratings.desperate.intensity,
          desperateFrequency: ratings.desperate.frequency,
          physicalDiscomfort: ratings.physical,
          psychologicalDiscomfort: ratings.psychological
        }),
      });

      if (!response.ok) throw new Error('提交评分失败');

      // 获取下一个视频
      const nextVideoResponse = await fetch(`${API_URL}/api/participants/${participantId}/next-video`);
      const nextVideoData = await nextVideoResponse.json();

      if (nextVideoData.completed) {
        setPhase('healing');
      } else {
        setCurrentVideo(nextVideoData.videoFileName);
        // 重置观看时间数据
        setWatchTimeData(null);
        setPhase('watching');
      }
    } catch (error) {
      console.error('Failed to submit ratings:', error);
      alert('提交评分失败，请重试');
    }
  };

  return (
    <div className="min-h-screen w-full">
      {phase === 'intro' && (
        <IntroPhase onStart={handleStartExperiment} />
      )}
      {phase === 'select-directory' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h2 className="text-xl font-semibold mb-4">选择视频文件夹</h2>
            <p className="text-gray-700 mb-6">
              请选择包含实验视频的文件夹
            </p>
            <Button onClick={handleSelectDirectory} className="w-full">
              选择文件夹
            </Button>
          </div>
        </div>
      )}
      {phase === 'watching' && participantId && currentVideo && (
        <WatchingPhase 
          participantId={participantId}
          videoFileName={currentVideo}
          onComplete={handleWatchingComplete}
        />
      )}
      {phase === 'rating' && participantId && currentVideo && watchTimeData && (
        <RatingPhase 
          participantId={participantId}
          videoFileName={currentVideo}
          startWatchingTime={watchTimeData.startTime}
          endWatchingTime={watchTimeData.endTime}
          onComplete={handleSubmitRatings}
        />
      )}
      {phase === 'healing' && (
        <HealingPhase onComplete={() => setPhase('end')} />
      )}
      {phase === 'end' && (
        <EndPhase onRestart={() => {
          setPhase('intro');
          setParticipantId(null);
          setCurrentVideo(null);
          setWatchTimeData(null);
        }} />
      )}

      {/* 调试面板 */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-sm">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请输入您的编号</DialogTitle>
            <DialogDescription>
              您的相关信息将被安全保存，仅用于实验数据记录。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={participantName}
              onChange={(e) => {
                setParticipantName(e.target.value);
                setNameError('');
              }}
              placeholder="请输入编号"
              className="w-full"
            />
            {nameError && (
              <p className="text-sm text-red-500 mt-1">{nameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNameDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleSubmitName}>
              确认开始
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 包装主组件
export function ExperimentFlow() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <FileSystemProvider>
        <ExperimentFlowContent />
      </FileSystemProvider>
    </ErrorBoundary>
  );
}