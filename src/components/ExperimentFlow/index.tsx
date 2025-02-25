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

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Phase = 'intro' | 'watching' | 'rating' | 'healing' | 'end';

interface RatingData {
  excited: { intensity: number; frequency: number };
  alert: { intensity: number; frequency: number };
  tense: { intensity: number; frequency: number };
  anxious: { intensity: number; frequency: number };
  terrified: { intensity: number; frequency: number };
  desperate: { intensity: number; frequency: number };
  physical: number;
  psychological: number;
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

export function ExperimentFlow() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [nameError, setNameError] = useState('');
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  // 开发环境调试面板
  const [debugInfo, setDebugInfo] = useState({});
  useEffect(() => {
    if (import.meta.env.DEV) {
      setDebugInfo({
        phase,
        participantId,
        currentVideo,
      });
    }
  }, [phase, participantId, currentVideo]);

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

      if (!response.ok) throw new Error('创建参与者失败');

      const data = await response.json();
      setParticipantId(data.participant.id);
      setCurrentVideo(data.currentVideo);
      setShowNameDialog(false);
      setPhase('watching');
    } catch (error) {
      console.error('Failed to start experiment:', error);
      setNameError('创建参与者失败，请重试');
    }
  };

  const handleSubmitRatings = async (ratings: RatingData) => {
    if (!participantId || !currentVideo) return;

    try {
      const response = await fetch(`${API_URL}/api/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          videoFileName: currentVideo,
          excitedIntensity: ratings.excited.intensity,
          excitedFrequency: ratings.excited.frequency,
          alertIntensity: ratings.alert.intensity,
          alertFrequency: ratings.alert.frequency,
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
        setPhase('watching');
      }
    } catch (error) {
      console.error('Failed to submit ratings:', error);
      alert('提交评分失败，请重试');
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setPhase('intro');
        setParticipantId(null);
        setShowNameDialog(false);
        setParticipantName('');
        setNameError('');
        setCurrentVideo(null);
      }}
    >
      <div className="min-h-screen w-full">
        {phase === 'intro' && (
          <IntroPhase onStart={handleStartExperiment} />
        )}
        {phase === 'watching' && participantId && currentVideo && (
          <WatchingPhase 
            participantId={participantId}
            videoFileName={currentVideo}
            onComplete={() => setPhase('rating')}
          />
        )}
        {phase === 'rating' && participantId && currentVideo && (
          <RatingPhase 
            participantId={participantId}
            videoFileName={currentVideo}
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
          }} />
        )}

        {/* 调试面板 */}
        {/* {import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-sm">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )} */}
      </div>

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
    </ErrorBoundary>
  );
}