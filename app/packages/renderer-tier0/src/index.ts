/**
 * FlowQuest Renderer Tier-0
 * Canvas/WebGL compositor for interactive video generation
 */

export { CanvasCompositor, type RenderOptions, type RenderResult } from './compositor/CanvasCompositor';
export { RealCanvasCompositor } from './compositor/RealCanvasCompositor';
export { Scene } from './scenes/Scene';
export { TitleScene } from './scenes/TitleScene';
export { ChartScene } from './scenes/ChartScene';
export { TimelineScene } from './scenes/TimelineScene';

// Utility functions
export * from './utils/VideoEncoder';
export * from './utils/HLSGenerator';
