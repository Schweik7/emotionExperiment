import { promises as fs, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置目录
const SOURCE_DIR = path.join(__dirname, 'videos-original');
const TARGET_DIR = path.join(__dirname, 'videos');
const LOGS_DIR = path.join(__dirname, 'logs');

// 确保目录存在
if (!existsSync(SOURCE_DIR)) {
  mkdirSync(SOURCE_DIR);
}

if (!existsSync(TARGET_DIR)) {
  mkdirSync(TARGET_DIR);
}

if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR);
}

// 配置项
const config = {
  // 视频处理选项
  video: {
    // 1080p -> 720p
    resolution: '1280x720',
    // 使用H.264编码（兼容性好）
    codec: 'libx264',
    // 设置合理的码率，平衡质量和性能
    bitrate: '1500k',
    // 压缩质量（0-51，越低质量越好，23是很好的平衡点）
    crf: 23,
    // 编码预设（ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow）
    preset: 'medium'
  },
  // 音频处理选项
  audio: {
    codec: 'aac',
    bitrate: '128k',
    sampleRate: 44100
  }
};

// 日志函数
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  const logFile = path.join(LOGS_DIR, `process-${new Date().toISOString().split('T')[0]}.log`);
  await fs.appendFile(logFile, logMessage);
}

// 执行命令并返回Promise
function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// 检查ffmpeg是否安装
async function checkFFmpeg() {
  try {
    await executeCommand('ffmpeg', ['-version']);
    return true;
  } catch (error) {
    console.error('FFmpeg未安装或不在PATH中。请先安装FFmpeg: https://ffmpeg.org/download.html');
    return false;
  }
}

// 获取视频信息
async function getVideoInfo(filePath) {
  try {
    const { stdout } = await executeCommand('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);
    
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`无法获取视频信息: ${error.message}`);
  }
}

// 处理单个视频
async function processVideo(sourceFile) {
  const filename = path.basename(sourceFile);
  const targetFile = path.join(TARGET_DIR, filename);
  
  // 如果目标文件已存在且不是刚处理完成的，跳过
  if (existsSync(targetFile)) {
    const sourceStats = await fs.stat(sourceFile);
    const targetStats = await fs.stat(targetFile);
    
    // 如果源文件比处理后的文件更新，重新处理
    if (sourceStats.mtime <= targetStats.mtime) {
      await log(`跳过 ${filename} - 已处理且未修改`);
      return { success: true, skipped: true, filename };
    }
  }

  await log(`开始处理: ${filename}`);
  
  try {
    // 获取视频信息
    const info = await getVideoInfo(sourceFile);
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    
    // 如果分辨率已经小于等于目标分辨率，不进行缩放
    let resolutionArg = `-vf scale=${config.video.resolution}`;
    if (videoStream) {
      const currentWidth = videoStream.width;
      const currentHeight = videoStream.height;
      const targetWidth = parseInt(config.video.resolution.split('x')[0]);
      
      if (currentWidth <= targetWidth) {
        resolutionArg = ''; // 不缩放
        await log(`${filename} 分辨率已经小于或等于目标分辨率，保持原始尺寸`);
      }
    }
    
    // 构建FFmpeg命令
    const args = [
      '-i', sourceFile,
      '-c:v', config.video.codec,
      '-b:v', config.video.bitrate,
      '-crf', config.video.crf.toString(),
      '-preset', config.video.preset,
      '-c:a', config.audio.codec,
      '-b:a', config.audio.bitrate,
      '-ar', config.audio.sampleRate.toString(),
      '-movflags', '+faststart', // 优化网络播放
    ];
    
    // 添加分辨率参数（如果需要）
    if (resolutionArg) {
      args.push(...resolutionArg.split(' '));
    }
    
    // 添加输出文件
    args.push(targetFile);
    
    // 执行FFmpeg命令
    await executeCommand('ffmpeg', args);
    
    await log(`处理完成: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    await log(`处理 ${filename} 时出错: ${error.message}`);
    return { success: false, error: error.message, filename };
  }
}

// 主处理函数
async function processAllVideos() {
  await log('开始批量处理视频...');
  
  try {
    // 检查ffmpeg
    const ffmpegInstalled = await checkFFmpeg();
    if (!ffmpegInstalled) {
      return;
    }
    
    // 获取源目录中的所有视频文件
    const files = await fs.readdir(SOURCE_DIR);
    const videoFiles = files.filter(file => 
      ['.mp4', '.webm', '.mov', '.mkv', '.avi'].includes(path.extname(file).toLowerCase())
    );
    
    if (videoFiles.length === 0) {
      await log('没有找到视频文件。请将视频放入 videos-original 目录');
      return;
    }
    
    await log(`找到 ${videoFiles.length} 个视频文件`);
    
    // 依次处理每个视频
    const results = [];
    for (const file of videoFiles) {
      const result = await processVideo(path.join(SOURCE_DIR, file));
      results.push(result);
    }
    
    // 处理结果统计
    const successful = results.filter(r => r.success).length;
    const skipped = results.filter(r => r.success && r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    
    await log('处理完成!');
    await log(`总计: ${results.length}, 成功: ${successful}, 跳过: ${skipped}, 失败: ${failed}`);
    
    if (failed > 0) {
      await log('以下文件处理失败:');
      results.filter(r => !r.success).forEach(r => {
        log(`- ${r.filename}: ${r.error}`);
      });
    }
  } catch (error) {
    await log(`批处理出错: ${error.message}`);
  }
}

// 执行处理
processAllVideos().catch(console.error);
