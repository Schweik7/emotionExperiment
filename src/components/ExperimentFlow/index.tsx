import { useState } from 'react';
import { experimentApi } from '../../services/api';
import { IntroPhase } from './IntroPhase';
import { WatchingPhase } from './WatchingPhase';  // 使用 WatchingPhase
import { RatingPhase } from './RatingPhase';
import { HealingPhase } from './HealingPhase';
import { EndPhase } from './EndPhase';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,  // 添加 DialogDescription
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary"; // 添加错误边界
import { RatingData } from '../../types/experiment';
// 错误回退组件
function ErrorFallback({ error, resetErrorBoundary }) {
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

  const handleStartExperiment = () => {
    setShowNameDialog(true);
  };

  const handleSubmitName = async () => {
    if (!participantName.trim()) {
      setNameError('请输入姓名');
      return;
    }

    try {
      const participant = await experimentApi.createParticipant(participantName);
      setParticipantId(participant.id);
      setShowNameDialog(false);
      setPhase('watching');
    } catch (error) {
      console.error('Failed to start experiment:', error);
      setNameError('创建参与者失败，请重试');
    }
  };
  const handleSubmitRatings = async (ratings: RatingData) => {
    if (!participantId) return;

    try {
      // 转换数据格式以匹配 API 期望的结构
      const apiData = {
        participantId,
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
      };

      await experimentApi.submitResponse(participantId, apiData);
      setPhase('healing');
    } catch (error) {
      console.error('Failed to submit ratings:', error);
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
      }}
    >
      <div className="min-h-screen w-full">
        {phase === 'intro' && <IntroPhase onStart={handleStartExperiment} />}
        {phase === 'watching' && <WatchingPhase onComplete={() => setPhase('rating')} />}
        {phase === 'rating' && <RatingPhase onComplete={handleSubmitRatings} />}
        {phase === 'healing' && <HealingPhase onComplete={() => setPhase('end')} />}
        {phase === 'end' && <EndPhase onRestart={() => setPhase('intro')} />}
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请输入您的姓名</DialogTitle>
            <DialogDescription>
              您的姓名信息将被安全保存，仅用于实验数据记录。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={participantName}
              onChange={(e) => {
                setParticipantName(e.target.value);
                setNameError('');
              }}
              placeholder="请输入姓名"
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