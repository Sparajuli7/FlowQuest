import { z } from 'zod';
import { ShotGraphSchema, CheckpointSchema, StepValueSchema } from './ShotGraph';
import { OutcomeReceiptSchema, VerificationResultSchema, ArtifactsSchema } from './OutcomeReceipt';

// Generate VideoQuest Request
export const GenerateRequestSchema = z.object({
  template_key: z.string(),
  inputs: z.record(z.any()),
  constraints: z.record(z.any()).optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// Generate VideoQuest Response
export const GenerateResponseSchema = z.object({
  quest_id: z.string(),
  checkpoints: z.array(CheckpointSchema),
  shotgraph_preview_url: z.string().url(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

// Answer Step Request
export const AnswerStepRequestSchema = z.object({
  quest_id: z.string(),
  step_id: z.string(),
  value: StepValueSchema,
});

export type AnswerStepRequest = z.infer<typeof AnswerStepRequestSchema>;

// Delta shot info
export const DeltaShotSchema = z.object({
  id: z.string(),
  url: z.string().url(),
});

export type DeltaShot = z.infer<typeof DeltaShotSchema>;

// Answer Step Response
export const AnswerStepResponseSchema = z.object({
  delta_shots: z.array(DeltaShotSchema),
  new_preview_url: z.string().url(),
  render_time_ms: z.number().optional(),
});

export type AnswerStepResponse = z.infer<typeof AnswerStepResponseSchema>;

// Verify Request
export const VerifyRequestSchema = z.object({
  quest_id: z.string(),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

// Export Request
export const ExportRequestSchema = z.object({
  quest_id: z.string(),
  formats: z.array(z.enum(['pdf', 'ics', 'md', 'csv'])),
  include_receipt: z.boolean().default(true),
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;

// Export Response
export const ExportResponseSchema = z.object({
  artifacts: ArtifactsSchema,
  receipt: OutcomeReceiptSchema.optional(),
});

export type ExportResponse = z.infer<typeof ExportResponseSchema>;

// Error Response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
