/**
 * Base Scene class for rendering different types of shot content
 */
export abstract class Scene {
  protected bindings: Record<string, any>;
  
  constructor(bindings: Record<string, any>) {
    this.bindings = bindings;
  }

  /**
   * Render the scene content at a specific time
   * @param ctx Canvas 2D context
   * @param timeSeconds Current time in the shot
   * @param progress Progress from 0 to 1
   */
  abstract render(ctx: any, timeSeconds: number, progress: number): Promise<void>;
  
  /**
   * Get the scene duration in seconds
   */
  abstract getDuration(): number;
  
  /**
   * Ease in/out function for smooth animations
   */
  protected easeInOut(t: number): number {
    return t * t * (3.0 - 2.0 * t);
  }
  
  /**
   * Ease in function
   */
  protected easeIn(t: number): number {
    return t * t;
  }
  
  /**
   * Ease out function
   */
  protected easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
  
  /**
   * Interpolate between two values
   */
  protected lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  /**
   * Get a value from bindings with fallback
   */
  protected getValue(key: string, fallback: any = null): any {
    return this.bindings[key] ?? fallback;
  }
  
  /**
   * Format currency values
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
