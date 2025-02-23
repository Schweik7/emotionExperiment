# 环境搭建
- git clone https://github.com/Schweik7/emotionExperiment
- cd emotionExperiment
- pnpm install
- pnpm dlx prisma db push
- pnpm dev
- 如需要删除跳过视频功能，将src\components\ui\VideoPlayer.tsx中第6行的skipVideo改为false