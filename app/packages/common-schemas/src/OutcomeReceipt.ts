import { z } from 'zod';

// Step taken during the quest
export const StepTakenSchema = z.object({
  id: z.string(),
  value: z.any(),
});

export type StepTaken = z.infer<typeof StepTakenSchema>;

// Artifact URLs/content
export const ArtifactsSchema = z.object({
  pdf: z.string().optional(),
  ics: z.string().optional(),
  md: z.string().optional(),
  csv: z.string().optional(),
});

export type Artifacts = z.infer<typeof ArtifactsSchema>;

// Version information
export const VersionsSchema = z.object({
  planner: z.string(),
  renderer: z.string(),
  exporter: z.string(),
  template: z.string(),
});

export type Versions = z.infer<typeof VersionsSchema>;

// OutcomeReceipt schema
export const OutcomeReceiptSchema = z.object({
  quest_id: z.string(),
  template: z.string().describe('Template key with version, e.g., sales_quote_v1@1.0.0'),
  shotgraph_hash: z.string().describe('SHA256 hash of the final shot graph'),
  steps_taken: z.array(StepTakenSchema),
  checks: z.array(z.string()).describe('Verification checks that passed'),
  artifacts: ArtifactsSchema,
  versions: VersionsSchema,
  signature: z.string().optional().describe('Future signing capability'),
  timestamp: z.string().datetime(),
});

export type OutcomeReceipt = z.infer<typeof OutcomeReceiptSchema>;

// Verification status
export const VerificationResultSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()),
  fixes: z.array(z.string()),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;
