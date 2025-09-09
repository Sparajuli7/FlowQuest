import { Shot, Overlay } from '@flowquest/common-schemas';
import { Scene } from '../scenes/Scene';
import { TitleScene } from '../scenes/TitleScene';
import { ChartScene } from '../scenes/ChartScene';
import { TimelineScene } from '../scenes/TimelineScene';

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  quality: 'preview' | 'high';
}

export interface RenderResult {
  frames: Buffer[];
  duration: number;
  metadata: {
    shotId: string;
    seed: number;
    bindingsHash: string;
    frameCount: number;
  };
}

export class CanvasCompositor {
  private canvas: any; // Canvas instance
  private ctx: any;    // 2D context
  
  constructor(options: RenderOptions) {
    // In Node.js environment, we'd use node-canvas
    // For now, we'll simulate the Canvas API
    this.canvas = {
      width: options.width,
      height: options.height,
      getContext: () => this.createMockContext()
    };
    this.ctx = this.canvas.getContext('2d');
  }

  async renderShot(shot: Shot, options: RenderOptions): Promise<RenderResult> {
    console.log(`Rendering shot ${shot.id} with Canvas compositor`);
    
    const scene = this.createScene(shot);
    const frameCount = Math.ceil(shot.duration * options.fps);
    const frames: Buffer[] = [];
    
    // Render each frame
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const progress = frameIndex / (frameCount - 1);
      const timeSeconds = progress * shot.duration;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Render background
      this.renderBackground(shot, timeSeconds);
      
      // Render scene content
      await scene.render(this.ctx, timeSeconds, progress);
      
      // Render overlays
      await this.renderOverlays(shot.overlays, timeSeconds, progress);
      
      // Convert canvas to buffer (mock implementation)
      const frameBuffer = this.canvasToBuffer();
      frames.push(frameBuffer);
    }
    
    return {
      frames,
      duration: shot.duration,
      metadata: {
        shotId: shot.id,
        seed: shot.seed,
        bindingsHash: this.computeBindingsHash(shot.bindings),
        frameCount
      }
    };
  }

  private createScene(shot: Shot): Scene {
    // Determine scene type from shot bindings or overlays
    const hasChart = shot.overlays.some(o => o.type === 'figure');
    const hasTimeline = shot.bindings.completion_date || shot.bindings.deliverables_list;
    
    if (hasChart) {
      return new ChartScene(shot.bindings);
    } else if (hasTimeline) {
      return new TimelineScene(shot.bindings);
    } else {
      return new TitleScene(shot.bindings);
    }
  }

  private renderBackground(shot: Shot, timeSeconds: number): void {
    // FlowQuest aurora gradient background
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width * 0.5, this.canvas.height * 0.3, 0,
      this.canvas.width * 0.5, this.canvas.height * 0.3, this.canvas.width * 0.8
    );
    
    gradient.addColorStop(0, '#142033');
    gradient.addColorStop(1, '#0B0F14');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add subtle aurora blobs
    this.renderAuroraBlobs(timeSeconds);
  }

  private renderAuroraBlobs(timeSeconds: number): void {
    // Animated aurora blobs for visual interest
    const blob1X = this.canvas.width * (0.2 + 0.1 * Math.sin(timeSeconds * 0.5));
    const blob1Y = this.canvas.height * (0.3 + 0.05 * Math.cos(timeSeconds * 0.3));
    
    const blob1Gradient = this.ctx.createRadialGradient(
      blob1X, blob1Y, 0,
      blob1X, blob1Y, 200
    );
    blob1Gradient.addColorStop(0, 'rgba(126, 166, 255, 0.2)');
    blob1Gradient.addColorStop(1, 'rgba(126, 166, 255, 0)');
    
    this.ctx.fillStyle = blob1Gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Second blob
    const blob2X = this.canvas.width * (0.8 - 0.1 * Math.sin(timeSeconds * 0.4));
    const blob2Y = this.canvas.height * (0.7 - 0.05 * Math.cos(timeSeconds * 0.6));
    
    const blob2Gradient = this.ctx.createRadialGradient(
      blob2X, blob2Y, 0,
      blob2X, blob2Y, 150
    );
    blob2Gradient.addColorStop(0, 'rgba(33, 212, 253, 0.15)');
    blob2Gradient.addColorStop(1, 'rgba(33, 212, 253, 0)');
    
    this.ctx.fillStyle = blob2Gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async renderOverlays(overlays: Overlay[], timeSeconds: number, progress: number): Promise<void> {
    for (const overlay of overlays) {
      await this.renderOverlay(overlay, timeSeconds, progress);
    }
  }

  private async renderOverlay(overlay: Overlay, timeSeconds: number, progress: number): Promise<void> {
    switch (overlay.type) {
      case 'title':
        this.renderTitleOverlay(overlay, progress);
        break;
      case 'caption':
        this.renderCaptionOverlay(overlay, progress);
        break;
      case 'figure':
        await this.renderFigureOverlay(overlay, timeSeconds, progress);
        break;
      case 'map':
        this.renderMapOverlay(overlay, progress);
        break;
    }
  }

  private renderTitleOverlay(overlay: any, progress: number): void {
    const opacity = this.fadeInOutOpacity(progress, 0.1, 0.9);
    
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const text = overlay.text || 'FlowQuest';
    const x = this.canvas.width / 2;
    const y = this.canvas.height / 2;
    
    // Add text shadow for better contrast
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(text, x, y);
    
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  private renderCaptionOverlay(overlay: any, progress: number): void {
    const opacity = this.fadeInOutOpacity(progress, 0.2, 0.8);
    
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#E5E7EB';
    this.ctx.font = '24px Inter';
    this.ctx.textAlign = 'center';
    
    const text = overlay.text || '';
    const x = this.canvas.width / 2;
    const y = this.canvas.height * 0.85;
    
    this.ctx.fillText(text, x, y);
    this.ctx.globalAlpha = 1;
  }

  private async renderFigureOverlay(overlay: any, timeSeconds: number, progress: number): Promise<void> {
    // Render charts and figures
    const opacity = this.fadeInOutOpacity(progress, 0.1, 0.9);
    this.ctx.globalAlpha = opacity;
    
    if (overlay.chart_type === 'budget_breakdown') {
      this.renderBudgetChart(overlay, progress);
    } else if (overlay.chart_type === 'gantt_timeline') {
      this.renderTimelineChart(overlay, progress);
    }
    
    this.ctx.globalAlpha = 1;
  }

  private renderMapOverlay(overlay: any, progress: number): void {
    // Placeholder for map rendering
    const opacity = this.fadeInOutOpacity(progress, 0.1, 0.9);
    
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = 'rgba(126, 166, 255, 0.3)';
    this.ctx.fillRect(
      this.canvas.width * 0.1,
      this.canvas.height * 0.1,
      this.canvas.width * 0.8,
      this.canvas.height * 0.8
    );
    
    this.ctx.strokeStyle = '#7EA6FF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.canvas.width * 0.1,
      this.canvas.height * 0.1,
      this.canvas.width * 0.8,
      this.canvas.height * 0.8
    );
    
    this.ctx.globalAlpha = 1;
  }

  private renderBudgetChart(overlay: any, progress: number): void {
    // Simple budget breakdown pie chart
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 150;
    
    const segments = [
      { label: 'Implementation', value: 60, color: '#7EA6FF' },
      { label: 'Training', value: 20, color: '#21D4FD' },
      { label: 'Support', value: 15, color: '#9BFFCE' },
      { label: 'Contingency', value: 5, color: '#FFC857' }
    ];
    
    let startAngle = -Math.PI / 2;
    
    segments.forEach((segment) => {
      const sliceAngle = (segment.value / 100) * 2 * Math.PI * progress;
      
      this.ctx.fillStyle = segment.color;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      this.ctx.closePath();
      this.ctx.fill();
      
      startAngle += sliceAngle;
    });
  }

  private renderTimelineChart(overlay: any, progress: number): void {
    // Simple Gantt-style timeline
    const barHeight = 40;
    const barSpacing = 60;
    const startX = this.canvas.width * 0.2;
    const startY = this.canvas.height * 0.3;
    
    const phases = [
      { name: 'Discovery', duration: 2, color: '#7EA6FF' },
      { name: 'Implementation', duration: 8, color: '#21D4FD' },
      { name: 'Testing', duration: 2, color: '#9BFFCE' },
      { name: 'Go-Live', duration: 1, color: '#3FE081' }
    ];
    
    phases.forEach((phase, index) => {
      const y = startY + index * barSpacing;
      const barWidth = (phase.duration / 13) * this.canvas.width * 0.6 * progress;
      
      this.ctx.fillStyle = phase.color;
      this.ctx.fillRect(startX, y, barWidth, barHeight);
      
      // Phase label
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '18px Inter';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(phase.name, startX, y - 10);
    });
  }

  private fadeInOutOpacity(progress: number, fadeInEnd: number, fadeOutStart: number): number {
    if (progress < fadeInEnd) {
      return progress / fadeInEnd;
    } else if (progress > fadeOutStart) {
      return (1 - progress) / (1 - fadeOutStart);
    }
    return 1;
  }

  private canvasToBuffer(): Buffer {
    // Mock implementation - in real version would use canvas.toBuffer()
    return Buffer.from(`frame-data-${Date.now()}`, 'utf8');
  }

  private computeBindingsHash(bindings: any): string {
    return require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(bindings, Object.keys(bindings).sort()))
      .digest('hex')
      .substring(0, 8);
  }

  private createMockContext() {
    // Mock 2D context for development
    return {
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {}
      }),
      beginPath: () => {},
      moveTo: () => {},
      arc: () => {},
      closePath: () => {},
      fill: () => {},
      globalAlpha: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      font: '16px Arial',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      lineWidth: 1,
      shadowColor: 'rgba(0,0,0,0)',
      shadowBlur: 0
    };
  }
}
