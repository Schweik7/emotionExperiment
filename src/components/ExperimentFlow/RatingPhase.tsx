import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VASScale } from "../ui/VASScale";
import { VideoPlayer } from "../ui/VideoPlayer";

interface RatingPhaseProps {
  onComplete: () => void;
}

export function RatingPhase({ onComplete }: RatingPhaseProps) {
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

  const emotions = {
    excited: '兴奋',
    alert: '警觉',
    tense: '紧张',
    anxious: '焦虑',
    terrified: '惊恐',
    desperate: '绝望'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧视频回放 */}
          <div className="sticky top-6 h-fit">
            <Card>
              <CardContent className="p-6">
                <VideoPlayer />
              </CardContent>
            </Card>
          </div>

          {/* 右侧评分区域 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>情绪评分</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(emotions).map(([key, emotion]) => (
                  <div key={key} className="space-y-4">
                    <h3 className="font-medium">{emotion}</h3>
                    <VASScale
                      label="情绪强度"
                      value={ratings[key].intensity}
                      onChange={(value) => {
                        setRatings(prev => ({
                          ...prev,
                          [key]: { ...prev[key], intensity: value }
                        }));
                      }}
                      leftLabel="非常弱"
                      rightLabel="非常强"
                    />
                    <VASScale
                      label="出现频次"
                      value={ratings[key].frequency}
                      onChange={(value) => {
                        setRatings(prev => ({
                          ...prev,
                          [key]: { ...prev[key], frequency: value }
                        }));
                      }}
                      leftLabel="非常少"
                      rightLabel="非常多"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>不适感评估</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <VASScale
                  label="生理不适程度（头晕、恶心等）"
                  value={ratings.physical}
                  onChange={(value) => {
                    setRatings(prev => ({...prev, physical: value}));
                  }}
                  leftLabel="完全没有"
                  rightLabel="非常强烈"
                />
                <VASScale
                  label="心理不适程度"
                  value={ratings.psychological}
                  onChange={(value) => {
                    setRatings(prev => ({...prev, psychological: value}));
                  }}
                  leftLabel="完全没有"
                  rightLabel="非常强烈"
                />
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={onComplete}
            >
              提交评分
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}