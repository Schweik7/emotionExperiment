import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EndPhaseProps {
  onRestart: () => void;
}

export function EndPhase({ onRestart }: EndPhaseProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">实验已完成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg">感谢您的参与！</p>
            <p className="text-gray-500">您的反馈对我们的研究非常重要</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <p className="font-medium mb-2">温馨提示：</p>
            <p className="text-sm text-gray-600">
              如果您在实验后仍感到不适，建议：
              <br />- 进行深呼吸练习
              <br />- 适当休息
              <br />- 联系实验人员获取帮助
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={onRestart}>
            完成实验
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}