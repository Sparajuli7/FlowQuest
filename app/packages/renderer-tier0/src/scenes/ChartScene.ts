import { Scene } from './Scene';

interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Chart scene for budget breakdowns and data visualization
 */
export class ChartScene extends Scene {
  private chartSegments: ChartSegment[] = [
    { label: 'Implementation', value: 60, color: '#7EA6FF' },
    { label: 'Training', value: 20, color: '#21D4FD' },
    { label: 'Support', value: 15, color: '#9BFFCE' },
    { label: 'Contingency', value: 5, color: '#FFC857' }
  ];

  getDuration(): number {
    return 12.0; // Chart scenes need more time to show data
  }

  async render(ctx: any, timeSeconds: number, progress: number): Promise<void> {
    const budget = this.getValue('total_budget', this.getValue('budget', 15000));
    
    // Title
    this.renderTitle(ctx, budget, progress);
    
    // Main chart
    this.renderPieChart(ctx, timeSeconds, progress);
    
    // Legend
    this.renderLegend(ctx, progress);
    
    // Budget details
    this.renderBudgetDetails(ctx, budget, progress);
  }

  private renderTitle(ctx: any, budget: number, progress: number): void {
    const titleOpacity = Math.min(progress * 2, 1);
    
    ctx.save();
    ctx.globalAlpha = titleOpacity;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const title = 'Investment Breakdown';
    const x = ctx.canvas.width / 2;
    const y = 50;
    
    // Add subtle glow
    ctx.shadowColor = '#7EA6FF';
    ctx.shadowBlur = 10;
    ctx.fillText(title, x, y);
    
    // Budget subtitle
    ctx.font = '32px Inter, sans-serif';
    ctx.fillStyle = '#E5E7EB';
    ctx.shadowBlur = 0;
    
    const subtitle = `Total: ${this.formatCurrency(budget)}`;
    ctx.fillText(subtitle, x, y + 70);
    
    ctx.restore();
  }

  private renderPieChart(ctx: any, timeSeconds: number, progress: number): void {
    const centerX = ctx.canvas.width * 0.3;
    const centerY = ctx.canvas.height * 0.6;
    const radius = 180;
    
    // Chart animation progress (delayed)
    const chartProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.6));
    const animationEase = this.easeOut(chartProgress);
    
    let currentAngle = -Math.PI / 2; // Start at top
    
    this.chartSegments.forEach((segment, index) => {
      const segmentAngle = (segment.value / 100) * 2 * Math.PI;
      const displayAngle = segmentAngle * animationEase;
      
      // Segment arc
      ctx.fillStyle = segment.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + displayAngle);
      ctx.closePath();
      ctx.fill();
      
      // Segment border
      ctx.strokeStyle = '#0B0F14';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Value label (only if segment is large enough and animation is far enough)
      if (segment.value >= 10 && chartProgress > 0.5) {
        const labelAngle = currentAngle + displayAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        
        ctx.fillText(`${segment.value}%`, labelX, labelY);
        ctx.shadowBlur = 0;
      }
      
      currentAngle += displayAngle;
    });
    
    // Center circle for donut effect
    ctx.fillStyle = '#0B0F14';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Center label
    if (chartProgress > 0.3) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Budget', centerX, centerY);
    }
  }

  private renderLegend(ctx: any, progress: number): void {
    const legendOpacity = Math.max(0, Math.min(1, (progress - 0.4) / 0.4));
    
    if (legendOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = legendOpacity;
    
    const startX = ctx.canvas.width * 0.65;
    const startY = ctx.canvas.height * 0.35;
    const itemHeight = 50;
    
    this.chartSegments.forEach((segment, index) => {
      const y = startY + index * itemHeight;
      
      // Color indicator
      ctx.fillStyle = segment.color;
      ctx.fillRect(startX, y - 8, 30, 16);
      
      // Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(segment.label, startX + 45, y);
      
      // Percentage
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '20px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${segment.value}%`, startX + 200, y);
    });
    
    ctx.restore();
  }

  private renderBudgetDetails(ctx: any, budget: number, progress: number): void {
    const detailsOpacity = Math.max(0, Math.min(1, (progress - 0.6) / 0.3));
    
    if (detailsOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = detailsOpacity;
    
    const startX = ctx.canvas.width * 0.65;
    const startY = ctx.canvas.height * 0.7;
    
    // Calculate actual amounts
    const amounts = this.chartSegments.map(segment => ({
      ...segment,
      amount: Math.round(budget * segment.value / 100)
    }));
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Investment Details:', startX, startY);
    
    amounts.forEach((segment, index) => {
      const y = startY + 35 + index * 30;
      
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '18px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${segment.label}:`, startX + 20, y);
      
      ctx.fillStyle = segment.color;
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatCurrency(segment.amount), startX + 200, y);
    });
    
    ctx.restore();
  }
}
