import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// 先安装需要的依赖：
// pnpm add fastify @fastify/cors @fastify/static

// 启用 CORS
await fastify.register(cors, {
  origin: true  // 开发环境允许所有来源
});



// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 其他代码保持不变
await fastify.register(staticFiles, {
  root: path.join(__dirname, 'videos'),
  prefix: '/videos/',
});

// 类型定义
interface ParticipantRequest {
  name: string;
}

// 获取视频文件列表
async function getVideoFiles(): Promise<string[]> {
  try {
    const videosDir = path.join(__dirname, 'videos');
    const files = await fs.readdir(videosDir);
    return files.filter(file =>
      ['.mp4', '.webm'].includes(path.extname(file).toLowerCase())
    );
  } catch (error) { 
    console.error('Error reading video directory:', error);
    return [];
  }
}

// 路由定义
fastify.post<{ Body: ParticipantRequest }>('/api/participants', async (request, reply) => {
  const { name } = request.body;

  if (!name) {
    return reply.code(400).send({ error: 'Name is required' });
  }

  try {
    const videos = await getVideoFiles();
    const videoSequence = videos
      .sort(() => Math.random() - 0.5)
      .join(',');

    const participant = await prisma.participant.create({
      data: {
        name,
        videoSequence,
        currentVideo: 0
      }
    });

    const firstVideo = videoSequence.split(',')[0];
    return {
      participant,
      currentVideo: firstVideo
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to create participant' });
  }
});

fastify.get<{ Params: { id: string } }>('/api/participants/:id/next-video', async (request, reply) => {
  const participantId = parseInt(request.params.id);

  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return reply.code(404).send({ error: 'Participant not found' });
    }

    const videos = participant.videoSequence.split(',');
    const currentIndex = participant.currentVideo;

    if (currentIndex >= videos.length) {
      return { completed: true };
    }

    return {
      videoFileName: videos[currentIndex],
      currentIndex: currentIndex,
      totalVideos: videos.length
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to get next video' });
  }
});

// 首先定义精确的评分类型
interface VideoResponseData {
  participantId: number;
  videoFileName: string;
  excitedIntensity: number;
  excitedFrequency: number;
  alertIntensity: number;
  alertFrequency: number;
  tenseIntensity: number;
  tenseFrequency: number;
  anxiousIntensity: number;
  anxiousFrequency: number;
  terrifiedIntensity: number;
  terrifiedFrequency: number;
  desperateIntensity: number;
  desperateFrequency: number;
  physicalDiscomfort: number;
  psychologicalDiscomfort: number;
}

// 修改路由处理
fastify.post<{ Body: VideoResponseData }>(
  '/api/responses',
  async (request, reply) => {
    try {
      const {
        participantId,
        videoFileName,
        excitedIntensity,
        excitedFrequency,
        alertIntensity,
        alertFrequency,
        tenseIntensity,
        tenseFrequency,
        anxiousIntensity,
        anxiousFrequency,
        terrifiedIntensity,
        terrifiedFrequency,
        desperateIntensity,
        desperateFrequency,
        physicalDiscomfort,
        psychologicalDiscomfort
      } = request.body;

      const response = await prisma.videoResponse.create({
        data: {
          participantId,
          videoFileName,
          excitedIntensity,
          excitedFrequency,
          alertIntensity,
          alertFrequency,
          tenseIntensity,
          tenseFrequency,
          anxiousIntensity,
          anxiousFrequency,
          terrifiedIntensity,
          terrifiedFrequency,
          desperateIntensity,
          desperateFrequency,
          physicalDiscomfort,
          psychologicalDiscomfort
        }
      });

      await prisma.participant.update({
        where: { id: participantId },
        data: {
          currentVideo: {
            increment: 1
          }
        }
      });

      return response;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to save response' });
    }
  });

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log(`Server is running on port 5000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();