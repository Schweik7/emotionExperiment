import { useState } from 'react';
import { experimentApi } from '../../services/api';
import { IntroPhase } from './IntroPhase';
import { VideoPhase } from './VideoPhase';
import { RatingPhase } from './RatingPhase';
import { HealingPhase } from './HealingPhase';
import { EndPhase } from './EndPhase';

type Phase = 'intro' | 'watching' | 'rating' | 'healing' | 'end';

export function ExperimentFlow() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [participantId, setParticipantId] = useState<number | null>(null);

  const handleStart = async (name: string) => {
    try {
      const participant = await experimentApi.createParticipant(name);
      setParticipantId(participant.id);
      setPhase('watching');
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  const handleSubmitRatings = async (ratings: any) => {
    if (!participantId) return;

    try {
      await experimentApi.submitResponse(participantId, ratings);
      setPhase('healing');
    } catch (error) {
      console.error('Failed to submit ratings:', error);
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'intro':
        return <IntroPhase onStart={handleStart} />;
      case 'watching':
        return <VideoPhase onComplete={() => setPhase('rating')} />;
      case 'rating':
        return <RatingPhase onComplete={handleSubmitRatings} />;
      case 'healing':
        return <HealingPhase onComplete={() => setPhase('end')} />;
      case 'end':
        return <EndPhase onRestart={() => setPhase('intro')} />;
      default:
        return <IntroPhase onStart={handleStart} />;
    }
  };

  return <div className="min-h-screen">{renderPhase()}</div>;
}