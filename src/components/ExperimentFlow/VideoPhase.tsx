import { VideoPlayer } from "../ui/VideoPlayer";

interface VideoPhaseProps {
  onComplete: () => void;
}

export function VideoPhase({ onComplete }: VideoPhaseProps) {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-5xl px-6">
        <VideoPlayer onComplete={onComplete} />
      </div>
    </div>
  );
}