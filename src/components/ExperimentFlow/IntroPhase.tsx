import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
// import { ArrowRight } from 'lucide-react';

export function IntroPhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-2xl mx-auto"> {/* 添加居中容器 */}
        <Card className="w-full">     
          <CardHeader>
            <CardTitle className="text-2xl text-center">情绪体验实验</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-medium text-blue-600">欢迎参与本次实验！</h2>
              <div className="text-gray-600 space-y-2">
                <p>本实验旨在研究不同情境下的情绪体验，您的参与对于深入理解人类情绪反应具有重要意义。</p>
                <p>在实验中，您将观看一段简短视频，并对自己的情绪体验进行评分。最后，我们会为您播放一段放松视频，帮助您平静心情。</p>
                <p className="text-sm text-gray-500">实验预计总时长：5-10分钟</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-center">实验流程</h3>
              <div className="flex justify-between items-center text-sm">
                {['观看视频', '情绪评分', '放松疗愈'].map((step, index) => (
                  <div key={index} className="flex-1 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      {index + 1}
                    </div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="font-medium">注意事项：</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>请在安静的环境中进行实验</li>
                <li>视频观看过程中请保持专注</li>
                <li>根据真实感受进行评分</li>
                <li>如感到不适可随时终止实验</li>
              </ul>
            </div>

            <Button className="w-full" size="lg" onClick={onStart}>
              开始实验
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}