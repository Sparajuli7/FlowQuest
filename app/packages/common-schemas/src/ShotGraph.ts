import { z } from 'zod';

// Overlay types for shots
export const OverlaySchema = z.object({
  type: z.enum(['title', 'figure', 'caption', 'map']),
}).catchall(z.any()); // Allow additional properties

export type Overlay = z.infer<typeof OverlaySchema>;

// Shot schema
export const ShotSchema = z.object({
  id: z.string(),
  step_ids: z.array(z.string()).describe('Steps that can invalidate this shot'),
  seed: z.number(),
  bindings: z.record(z.any()),
  duration: z.number().describe('Duration in seconds'),
  overlays: z.array(OverlaySchema),
});

export type Shot = z.infer<typeof ShotSchema>;

// ShotGraph schema
export const ShotGraphSchema = z.object({
  version: z.string(),
  shots: z.array(ShotSchema),
  edges: z.array(z.tuple([z.string(), z.string()])).describe('Shot dependency edges'),
});

export type ShotGraph = z.infer<typeof ShotGraphSchema>;

// Step value types for checkpoints
export const StepValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.record(z.any()),
]);

export type StepValue = z.infer<typeof StepValueSchema>;

// Checkpoint types
export const CheckpointSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['number', 'text', 'select', 'multiselect', 'date', 'currency', 'url']),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
