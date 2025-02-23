import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VASScale } from "../ui/VASScale";
import { VideoPlayer } from "../ui/VideoPlayer";
import { RatingData } from "../../types/experiment";  // 导入 RatingData 类型
interface RatingPhaseProps {
  onComplete: (ratings: RatingData) => void;  // 修改类型定义
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
        <div className="w-4/5 mx-auto"> {/* 调整宽度 */}
          <Card>
            <CardHeader>
              <CardTitle>情绪评分</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 表头 */}
              <div className="grid grid-cols-[100px_1fr_1fr] gap-6 mb-2 px-4">
                <div className="font-medium text-gray-600 mx-auto">情绪类型</div>
                <div className="font-medium text-gray-600 mx-auto">情绪强度</div>
                <div className="font-medium text-gray-600 mx-auto">出现频次</div>
              </div>

              {/* 情绪评分行 */}
              <div className="space-y-6 ">
                {Object.entries(emotions).map(([key, emotion]) => (
                  <div key={key} className="grid grid-cols-[100px_1fr_1fr] gap-10 px-4 py-2 hover:bg-gray-50 ">
                    <div className="font-medium flex items-center mx-auto">{emotion}</div>
                    <VASScale
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

                {/* 不适感评估行 */}
                <div className="grid grid-cols-[100px_1fr_1fr] gap-10 px-4 py-2 border-t border-gray-200 mt-6 pt-6">
                  <div className="font-medium flex items-center mx-auto">不适感评估</div>
                  <VASScale
                    value={ratings.physical}
                    onChange={(value) => {
                      setRatings(prev => ({ ...prev, physical: value }));
                    }}
                    leftLabel="完全没有"
                    rightLabel="非常强烈"
                    label="生理不适"
                  />
                  <VASScale
                    value={ratings.psychological}
                    onChange={(value) => {
                      setRatings(prev => ({ ...prev, psychological: value }));
                    }}
                    leftLabel="完全没有"
                    rightLabel="非常强烈"
                    label="心理不适"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-center mt-8">
                <Button
                  size="lg"
                  onClick={() => onComplete(ratings)}
                  className="px-12"
                >
                  提交评分
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}