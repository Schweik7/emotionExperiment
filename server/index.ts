import express, { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app: Express = express();
const prisma = new PrismaClient();

// 正确的类型声明
app.use(cors());
app.use(express.json());

// 带类型的路由处理
app.post('/api/participants', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const participant = await prisma.participant.create({
      data: { name }
    });
    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

app.post('/api/responses', async (req: Request, res: Response) => {
  try {
    const response = await prisma.videoResponse.create({
      data: req.body
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save response' });
  }
});

app.get('/api/data', async (_req: Request, res: Response) => {
  try {
    const data = await prisma.participant.findMany({
      include: {
        videoResponses: true
      }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;