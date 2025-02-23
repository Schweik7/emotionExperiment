import { useState } from 'react';
import { experimentApi } from './services/api';
import { VASScale } from './components/ui/VASScale';
import { ExperimentFlow } from './components/ExperimentFlow';
function App() {
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [ratings, setRatings] = useState({
    excited: { intensity: 0, frequency: 0 },
    alert: { intensity: 0, frequency: 0 },
    tense: { intensity: 0, frequency: 0 },
    anxious: { intensity: 0, frequency: 0 },
    terrified: { intensity: 0, frequency: 0 },
    desperate: { intensity: 0, frequency: 0 },
    physical: 0,
    psychological: 0
  });

  // 开始实验，创建参与者
  const startExperiment = async (name: string) => {
    try {
      const participant = await experimentApi.createParticipant(name);
      setParticipantId(participant.id);
    } catch (error) {
      console.error('Failed to create participant:', error);
    }
  };

  // 提交评分
  const submitRatings = async () => {
    if (!participantId) return;

    try {
      await experimentApi.submitResponse(participantId, {
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
      });
      
      // 进入下一阶段
      // setPhase('healing');
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <ExperimentFlow />
    </div>
  );
}

export default App;