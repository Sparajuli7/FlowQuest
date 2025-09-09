import { Scene } from './Scene';

interface TimelinePhase {
  name: string;
  duration: number; // in weeks
  color: string;
  description?: string;
}

/**
 * Timeline scene for project schedules and deliverables
 */
export class TimelineScene extends Scene {
  private phases: TimelinePhase[] = [
    { name: 'Discovery', duration: 2, color: '#7EA6FF', description: 'Requirements & Assessment' },
    { name: 'Implementation', duration: 8, color: '#21D4FD', description: 'Core Development' },
    { name: 'Testing', duration: 2, color: '#9BFFCE', description: 'Quality Assurance' },
    { name: 'Go-Live', duration: 1, color: '#3FE081', description: 'Deployment & Launch' }
  ];

  getDuration(): number {
    return 10.0; // Timeline scenes need time to show progression
  }

  async render(ctx: any, timeSeconds: number, progress: number): Promise<void> {
    const completionDate = this.getValue('completion_date', this.getValue('timeline', '2024-Q2'));
    const deliverables = this.getValue('deliverables_list', this.getValue('deliverables', []));
    
    // Title
    this.renderTitle(ctx, completionDate, progress);
    
    // Main timeline
    this.renderGanttChart(ctx, timeSeconds, progress);
    
    // Deliverables list
    this.renderDeliverables(ctx, deliverables, progress);
    
    // Progress indicator
    this.renderProgressIndicator(ctx, timeSeconds, progress);
  }

  private renderTitle(ctx: any, completionDate: string, progress: number): void {
    const titleOpacity = Math.min(progress * 2, 1);
    
    ctx.save();
    ctx.globalAlpha = titleOpacity;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const title = 'Implementation Timeline';
    const x = ctx.canvas.width / 2;
    const y = 50;
    
    // Add glow effect
    ctx.shadowColor = '#21D4FD';
    ctx.shadowBlur = 15;
    ctx.fillText(title, x, y);
    
    // Completion date subtitle
    ctx.font = '28px Inter, sans-serif';
    ctx.fillStyle = '#E5E7EB';
    ctx.shadowBlur = 0;
    
    const subtitle = `Target Completion: ${completionDate}`;
    ctx.fillText(subtitle, x, y + 70);
    
    ctx.restore();
  }

  private renderGanttChart(ctx: any, timeSeconds: number, progress: number): void {
    const chartStartX = ctx.canvas.width * 0.15;
    const chartWidth = ctx.canvas.width * 0.7;
    const chartStartY = ctx.canvas.height * 0.3;
    const barHeight = 40;
    const barSpacing = 60;
    
    const totalDuration = this.phases.reduce((sum, phase) => sum + phase.duration, 0);
    const chartProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.6));
    
    // Timeline background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(chartStartX - 10, chartStartY - 20, chartWidth + 20, this.phases.length * barSpacing + 40);
    
    // Timeline grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let week = 0; week <= totalDuration; week += 2) {
      const x = chartStartX + (week / totalDuration) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, chartStartY - 10);
      ctx.lineTo(x, chartStartY + this.phases.length * barSpacing + 10);
      ctx.stroke();
    }
    
    let currentWeek = 0;
    
    this.phases.forEach((phase, index) => {
      const y = chartStartY + index * barSpacing;
      const phaseStartX = chartStartX + (currentWeek / totalDuration) * chartWidth;
      const phaseWidth = (phase.duration / totalDuration) * chartWidth;
      
      // Phase progress animation
      const phaseProgress = Math.max(0, Math.min(1, chartProgress - index * 0.1));
      const animatedWidth = phaseWidth * this.easeOut(phaseProgress);
      
      // Phase bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(phaseStartX, y, phaseWidth, barHeight);
      
      // Phase bar fill (animated)
      ctx.fillStyle = phase.color;
      ctx.fillRect(phaseStartX, y, animatedWidth, barHeight);
      
      // Phase bar border
      ctx.strokeStyle = phase.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(phaseStartX, y, phaseWidth, barHeight);
      
      // Phase label
      if (phaseProgress > 0.3) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Add text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        
        const labelText = `${phase.name} (${phase.duration}w)`;
        ctx.fillText(labelText, phaseStartX + 10, y + barHeight / 2);
        
        ctx.shadowBlur = 0;
      }
      
      // Phase description (right side)
      if (phaseProgress > 0.5 && phase.description) {
        ctx.fillStyle = '#E5E7EB';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(phase.description, chartStartX + chartWidth + 20, y + barHeight / 2);
      }
      
      currentWeek += phase.duration;
    });
    
    // Week labels on top
    if (chartProgress > 0.8) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      for (let week = 0; week <= totalDuration; week += 2) {
        const x = chartStartX + (week / totalDuration) * chartWidth;
        ctx.fillText(`Week ${week}`, x, chartStartY - 25);
      }
    }
  }

  private renderDeliverables(ctx: any, deliverables: string[], progress: number): void {
    if (!deliverables || deliverables.length === 0) return;
    
    const deliverablesOpacity = Math.max(0, Math.min(1, (progress - 0.6) / 0.3));
    if (deliverablesOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = deliverablesOpacity;
    
    const startX = ctx.canvas.width * 0.15;
    const startY = ctx.canvas.height * 0.75;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Key Deliverables:', startX, startY);
    
    const itemsPerColumn = Math.ceil(deliverables.length / 2);
    
    deliverables.forEach((deliverable, index) => {
      const column = Math.floor(index / itemsPerColumn);
      const row = index % itemsPerColumn;
      
      const x = startX + column * (ctx.canvas.width * 0.35);
      const y = startY + 40 + row * 35;
      
      // Bullet point
      ctx.fillStyle = '#9BFFCE';
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Deliverable text
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(deliverable, x + 25, y);
    });
    
    ctx.restore();
  }

  private renderProgressIndicator(ctx: any, timeSeconds: number, progress: number): void {
    if (progress < 0.8) return;
    
    const indicatorOpacity = (progress - 0.8) / 0.2;
    
    ctx.save();
    ctx.globalAlpha = indicatorOpacity;
    
    // Progress circle in top right
    const centerX = ctx.canvas.width * 0.9;
    const centerY = ctx.canvas.height * 0.15;
    const radius = 30;
    
    // Background circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Progress arc
    const progressAngle = progress * Math.PI * 2;
    ctx.strokeStyle = '#3FE081';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progressAngle);
    ctx.stroke();
    
    // Progress percentage
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(progress * 100)}%`, centerX, centerY);
    
    ctx.restore();
  }
}
