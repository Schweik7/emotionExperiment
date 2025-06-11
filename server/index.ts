import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import { promises as fs, createReadStream, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

// 创建Fastify实例
const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const VIDEOS_DIR = path.join(__dirname, 'videos');

// 资源监控变量
let activeStreams = 0;
const MAX_CONCURRENT_STREAMS = 10; // 可调整的最大并发流数量
let lastMemoryCheck = Date.now();
const MEMORY_CHECK_INTERVAL = 60000; // 每分钟检查内存使用情况

// 启用 CORS
await fastify.register(cors, {
  origin: true  // 开发环境允许所有来源
});

// 添加健康检查端点
fastify.get('/health', async () => {
  const memoryUsage = process.memoryUsage();

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
      systemFreeMem: Math.round(os.freemem() / 1024 / 1024) + 'MB',
    },
    resources: {
      activeStreams
    }
  };
});

// 内存使用监控函数
function checkMemoryUsage() {
  const now = Date.now();
  if (now - lastMemoryCheck < MEMORY_CHECK_INTERVAL) return;

  lastMemoryCheck = now;
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const rssMemoryMB = Math.round(memoryUsage.rss / 1024 / 1024);

  console.log(`[Memory] Heap: ${heapUsedMB}MB, RSS: ${rssMemoryMB}MB, Active Streams: ${activeStreams}`);

  // 如果内存使用过高，尝试释放
  if (heapUsedMB > 500 || rssMemoryMB > 800) {
    console.warn(`[Memory Alert] High memory usage detected.`);
    if (global.gc) {
      global.gc(); // 强制垃圾回收
      console.log(`[Memory] Garbage collection triggered.`);
    }
  }
}

// 优化的视频流处理
fastify.get('/videos/:filename', async (request, reply) => {
  // 检查内存使用
  checkMemoryUsage();

  const { filename } = request.params as { filename: string };
  const videoPath = path.join(VIDEOS_DIR, filename);

  try {
    // 检查是否超过最大并发流数量
    if (activeStreams >= MAX_CONCURRENT_STREAMS) {
      return reply.code(503).send({
        error: 'Server is busy. Please try again later.',
        retryAfter: 5 // 建议客户端5秒后重试
      });
    }

    // 增加活跃流计数
    activeStreams++;

    // 检查文件是否存在
    await fs.access(videoPath);
  } catch (error) {
    if (activeStreams > 0) activeStreams--;
    return reply.code(404).send({ error: '视频文件不存在' });
  }

  try {
    // 获取文件状态
    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.range;

    // 设置内容类型
    let contentType = 'video/mp4';
    if (filename.endsWith('.webm')) {
      contentType = 'video/webm';
    }

    // 如果没有Range请求头或是小文件，返回整个文件
    if (!range) {
      reply.header('Content-Length', fileSize);
      reply.header('Content-Type', contentType);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Cache-Control', 'public, max-age=86400'); // 24小时缓存
      reply.code(200);

      // 创建可读流
      const stream = createReadStream(videoPath, {
        highWaterMark: 64 * 1024, // 64KB缓冲区
        autoClose: true // 确保流结束后自动关闭
      });

      // 处理流错误，防止服务器崩溃
      stream.on('error', (err) => {
        console.error(`Stream error for ${filename}:`, err);
        if (!reply.sent) {
          reply.code(500).send({ error: 'Error streaming file' });
        }
        if (activeStreams > 0) activeStreams--;
      });

      // 处理流关闭，确保计数器正确
      stream.on('close', () => {
        if (activeStreams > 0) activeStreams--;
      });

      return reply.send(stream);
    }

    // 处理Range请求
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // 限制块大小，防止内存过载
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    if (end - start >= CHUNK_SIZE) {
      end = start + CHUNK_SIZE - 1;
    }

    // 确保范围有效
    if (start < 0 || start >= fileSize || end >= fileSize) {
      reply.code(416).send({ error: 'Range Not Satisfiable' });
      if (activeStreams > 0) activeStreams--;
      return;
    }

    // 计算内容长度
    const contentLength = end - start + 1;

    // 设置响应头
    reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Content-Length', contentLength);
    reply.header('Content-Type', contentType);
    reply.header('Cache-Control', 'public, max-age=86400'); // 24小时缓存
    reply.code(206); // Partial Content

    // 创建限制范围的流
    const stream = createReadStream(videoPath, {
      start,
      end,
      highWaterMark: 64 * 1024, // 64KB缓冲区
      autoClose: true // 确保流结束后自动关闭
    });

    // 处理流错误，防止服务器崩溃
    stream.on('error', (err) => {
      console.error(`Stream error for ${filename}:`, err);
      if (!reply.sent) {
        reply.code(500).send({ error: 'Error streaming file' });
      }
      if (activeStreams > 0) activeStreams--;
    });

    // 处理流关闭，确保计数器正确
    stream.on('close', () => {
      if (activeStreams > 0) activeStreams--;
    });

    return reply.send(stream);
  } catch (error) {
    console.error(`Error serving video ${filename}:`, error);
    if (activeStreams > 0) activeStreams--;
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// 添加钩子以确保请求完成后减少计数
fastify.addHook('onResponse', (request, reply, done) => {
  if (request.url.startsWith('/videos/')) {
    // 安全检查，确保计数器不会变为负数
    if (activeStreams > 0) activeStreams--;
  }
  done();
});

// ---------- 以下为原始代码，保持不变 ----------

// 获取视频文件列表
async function getVideoFiles(): Promise<string[]> {
  try {
    const videosDir = path.join(__dirname, 'videos');
    const files = await fs.readdir(videosDir);
    const videoFiles = files.filter(file =>
    (['.mp4', '.webm'].includes(path.extname(file).toLowerCase()) && // 文件扩展名是 .mp4 或 .webm
      path.basename(file) !== '放松视频.mp4' && path.basename(file) !== '放松视频') // 文件名不为 "放松视频.mp4"
    );
    console.log(videoFiles);
    return videoFiles;
  } catch (error) {
    console.error('Error reading video directory:', error);
    return [];
  }
}

// 路由定义
fastify.post<{ Body: { name: string } }>('/api/participants', async (request, reply) => {
  const { name } = request.body;

  if (!name) {
    return reply.code(400).send({ error: 'Name is required' });
  }

  try {
    // 先查找是否已存在该编号的参与者
    const existingParticipant = await prisma.participant.findFirst({
      where: { name }
    });

    // 如果已存在，返回该参与者信息和当前进度
    if (existingParticipant) {
      const videos = existingParticipant.videoSequence.split(',');
      const currentVideoIndex = existingParticipant.currentVideo;

      // 检查是否已完成所有视频
      if (currentVideoIndex >= videos.length) {
        return {
          participant: existingParticipant,
          completed: true
        };
      }

      // 返回当前视频
      return {
        participant: existingParticipant,
        currentVideo: videos[currentVideoIndex],
        resuming: true // 标记为恢复会话
      };
    }

    // 如果不存在，创建新参与者
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
      currentVideo: firstVideo,
      resuming: false // 标记为新会话
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
  startWatchingTime?: string; // ISO 日期字符串
  endWatchingTime?: string;   // ISO 日期字符串
  excitedIntensity: number;
  excitedFrequency: number;
  // alertIntensity 和 alertFrequency 已删除
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
        startWatchingTime,
        endWatchingTime,
        excitedIntensity,
        excitedFrequency,
        // alertIntensity 和 alertFrequency 已删除
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
      // 处理开始和结束时间
      const startTime = startWatchingTime ? new Date(startWatchingTime) : undefined;
      const endTime = endWatchingTime ? new Date(endWatchingTime) : undefined;

      const response = await prisma.videoResponse.create({
        data: {
          participantId,
          videoFileName,
          startWatchingTime: startTime,
          endWatchingTime: endTime,
          excitedIntensity,
          excitedFrequency,
          // alertIntensity 和 alertFrequency 已删除
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

// 设置优雅关闭
function gracefulShutdown() {
  console.log('Shutting down gracefully...');

  // 设置超时确保最终会关闭
  const forceExit = setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  // 先关闭服务器停止接收新请求
  fastify.close(async () => {
    console.log('Fastify server closed');

    // 断开Prisma连接
    await prisma.$disconnect();
    console.log('Database connections closed');

    // 清除强制退出计时器
    clearTimeout(forceExit);

    process.exit(0);
  });
}

// 设置关闭信号处理
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 定期进行内存清理和检查
setInterval(() => {
  checkMemoryUsage();

  // 如果有gc函数（需要使用--expose-gc参数启动Node），则尝试定期手动触发垃圾回收
  if (global.gc) {
    global.gc();
  }
}, 300000); // 每5分钟

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 5000, host: '0.0.0.0' });
    console.log(`服务器运行在 http://localhost:5000`);
    console.log(`内存管理已启用，当前内存使用: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);

    if (!global.gc) {
      console.log('提示: 使用 "node --expose-gc server.js" 启动服务器以启用手动垃圾回收');
    }
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();