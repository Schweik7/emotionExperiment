import { VideoPlayer } from "../ui/VideoPlayer";

interface HealingPhaseProps {
  onComplete: () => void;
}

export function HealingPhase({ onComplete }: HealingPhaseProps) {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-5xl px-6">
        <VideoPlayer isHealing={true} onComplete={onComplete} />
      </div>
    </div>
  );
}