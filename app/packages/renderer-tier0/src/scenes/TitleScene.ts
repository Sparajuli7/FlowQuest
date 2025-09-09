import { Scene } from './Scene';

/**
 * Title scene for company introductions and title cards
 */
export class TitleScene extends Scene {
  getDuration(): number {
    return 8.0; // Default title scene duration
  }

  async render(ctx: any, timeSeconds: number, progress: number): Promise<void> {
    const companyName = this.getValue('company_name', this.getValue('company', 'Client'));
    const presenterName = this.getValue('presenter_name', 'FlowQuest Solutions');
    
    // Main title animation
    const titleOpacity = this.calculateTitleOpacity(progress);
    this.renderTitle(ctx, companyName, titleOpacity);
    
    // Subtitle animation (delayed)
    const subtitleOpacity = this.calculateSubtitleOpacity(progress);
    this.renderSubtitle(ctx, presenterName, subtitleOpacity);
    
    // Animated accent elements
    this.renderAccentElements(ctx, timeSeconds, progress);
  }

  private calculateTitleOpacity(progress: number): number {
    // Fade in from 0 to 0.3, stay visible until 0.8, then fade out
    if (progress < 0.2) {
      return this.easeOut(progress / 0.2);
    } else if (progress > 0.8) {
      return this.easeIn((1 - progress) / 0.2);
    }
    return 1;
  }

  private calculateSubtitleOpacity(progress: number): number {
    // Delayed fade in from 0.3 to 0.5
    if (progress < 0.3) {
      return 0;
    } else if (progress < 0.5) {
      return this.easeOut((progress - 0.3) / 0.2);
    } else if (progress > 0.8) {
      return this.easeIn((1 - progress) / 0.2);
    }
    return 1;
  }

  private renderTitle(ctx: any, companyName: string, opacity: number): void {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Set up title text styling
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add glow effect
    ctx.shadowColor = '#7EA6FF';
    ctx.shadowBlur = 20 * opacity;
    
    const title = `${companyName} Partnership`;
    const x = ctx.canvas.width / 2;
    const y = ctx.canvas.height * 0.4;
    
    ctx.fillText(title, x, y);
    
    // Add underline accent
    const textWidth = ctx.measureText(title).width;
    ctx.strokeStyle = '#7EA6FF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - textWidth / 2, y + 40);
    ctx.lineTo(x + textWidth / 2, y + 40);
    ctx.stroke();
    
    ctx.restore();
  }

  private renderSubtitle(ctx: any, presenterName: string, opacity: number): void {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    ctx.fillStyle = '#E5E7EB';
    ctx.font = '32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const subtitle = `Prepared by ${presenterName}`;
    const x = ctx.canvas.width / 2;
    const y = ctx.canvas.height * 0.6;
    
    ctx.fillText(subtitle, x, y);
    
    ctx.restore();
  }

  private renderAccentElements(ctx: any, timeSeconds: number, progress: number): void {
    // Animated geometric accent elements
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Rotating rings
    const rotation = timeSeconds * 0.5;
    const ringRadius = 300;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    
    // Outer ring
    ctx.strokeStyle = `rgba(126, 166, 255, ${0.3 * progress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ring (counter-rotating)
    ctx.rotate(-rotation * 2);
    ctx.strokeStyle = `rgba(33, 212, 253, ${0.2 * progress})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    // Accent dots
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + rotation * 0.5;
      const x = Math.cos(angle) * ringRadius * 1.1;
      const y = Math.sin(angle) * ringRadius * 1.1;
      
      ctx.fillStyle = `rgba(155, 255, 206, ${0.8 * progress})`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}
