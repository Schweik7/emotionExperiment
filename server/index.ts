import express, { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// 定义类型
interface ParticipantRequest {
  name: string;
}

// 使用 RequestHandler 类型
const createParticipant: RequestHandler<{}, {}, { name: string }> = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

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
    res.json({
      participant,
      currentVideo: firstVideo
    });
  } catch (error) {
    console.error('Error creating participant:', error);
    res.status(500).json({ error: 'Failed to create participant' });
  }
};

const getNextVideo: RequestHandler = async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const videos = participant.videoSequence.split(',');
    const currentIndex = participant.currentVideo;

    if (currentIndex >= videos.length) {
      return res.json({ completed: true });
    }

    res.json({
      videoFileName: videos[currentIndex],
      currentIndex: currentIndex,
      totalVideos: videos.length
    });
  } catch (error) {
    console.error('Error getting next video:', error);
    res.status(500).json({ error: 'Failed to get next video' });
  }
};

const submitResponse: RequestHandler = async (req, res) => {
  try {
    const { participantId, videoFileName, ...ratings } = req.body;

    const response = await prisma.videoResponse.create({
      data: {
        participantId,
        videoFileName,
        ...ratings
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

    res.json(response);
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
};

// 辅助函数
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

// 路由
app.post('/api/participants', createParticipant);
app.get('/api/participants/:id/next-video', getNextVideo);
app.post('/api/responses', submitResponse);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});