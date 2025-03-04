# 环境搭建

- 下载安装nodejs V20以上，https://nodejs.org/en/download
- git clone https://github.com/Schweik7/emotionExperiment
- cd emotionExperiment
- npm install -g pnpm
- pnpm install
- pnpm dlx prisma db push
- pnpm dev
- 如需要删除跳过视频功能，将src\components\ui\VideoPlayer.tsx中第6行的skipVideo改为false
- 把视频都放在server/videos文件夹中，其中用于放松的视频应该名为“放松视频.mp4”，其他所有视频每个用户都将打乱顺序随机播放
