// ShotGraph exports
export * from './ShotGraph';

// OutcomeReceipt exports
export * from './OutcomeReceipt';

// API exports
export * from './API';

// Utility function to generate JSON Schema from Zod schemas
export function zodToJsonSchema(schema: any): any {
  // Simple implementation - in production would use zod-to-json-schema
  return {
    type: 'object',
    description: 'Generated from Zod schema'
  };
}

// Common constants
export const TEMPLATE_VERSIONS = {
  SALES_QUOTE_V1: 'sales_quote_v1@1.0.0',
} as const;

export const EXPORT_FORMATS = ['pdf', 'ics', 'md', 'csv'] as const;

export const CHECKPOINT_TYPES = ['number', 'text', 'select', 'multiselect', 'date', 'currency', 'url'] as const;

export const OVERLAY_TYPES = ['title', 'figure', 'caption', 'map'] as const;
