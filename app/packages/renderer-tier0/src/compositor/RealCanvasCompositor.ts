import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import { Shot } from '@flowquest/common-schemas';
import fs from 'fs';
import path from 'path';

export class RealCanvasCompositor {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private tempDir: string;

  constructor(width: number = 1920, height: number = 1080) {
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
    this.tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
    fs.mkdirSync(this.tempDir, { recursive: true });
  }

  async renderShot(shot: Shot, fps: number = 24): Promise<string> {
    const frameCount = Math.ceil(shot.duration * fps);
    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount;
      
      // Clear and render frame
      this.ctx.fillStyle = '#0B0F14';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Render actual content based on shot type
      await this.renderFrame(shot, progress);
      
      // Save frame
      const framePath = path.join(this.tempDir, `frame_${i.toString().padStart(5, '0')}.png`);
      const buffer = this.canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      frames.push(framePath);
    }

    // Convert frames to video using ffmpeg
    const outputPath = path.join(this.tempDir, `${shot.id}.mp4`);
    await this.framesToVideo(frames, outputPath, fps);
    
    return outputPath;
  }

  private async renderFrame(shot: Shot, progress: number) {
    // Add aurora background
    const gradient = this.ctx.createRadialGradient(
      960, 540, 0,
      960, 540, 800
    );
    gradient.addColorStop(0, 'rgba(126, 166, 255, 0.2)');
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, 1920, 1080);

    // Render overlays
    for (const overlay of shot.overlays) {
      if (overlay.type === 'title') {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(overlay.text || '', 960, 540);
      }
      // Add more overlay types as needed
    }
  }

  private framesToVideo(frames: string[], outputPath: string, fps: number): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(this.tempDir, 'frame_%05d.png'))
        .inputFPS(fps)
        .output(outputPath)
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-preset fast'
        ])
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  cleanup() {
    fs.rmSync(this.tempDir, { recursive: true, force: true });
  }
}
