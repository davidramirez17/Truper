import { z } from 'zod';
export const createProjectSchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000).default('') });
export const recordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const parsed = new Date(`${value}T12:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value && value >= '1900-01-01' && value <= '2200-12-31'; }),
  client: z.string().trim().min(1).max(300), region: z.string().trim().min(1).max(150), amountCents: z.number().int().min(-100000000000).max(100000000000),
});
export const importSchema = z.object({ projectId: z.uuid(), requestId: z.uuid(), filename: z.string().trim().min(1).max(255), records: z.array(recordSchema).min(1).max(10000) });
export const manageUserSchema = z.object({ id: z.uuid(), role: z.enum(['superadmin','admin','analyst','viewer']), status: z.enum(['pending','active','suspended']) });
export const memberSchema = z.object({ projectId: z.uuid(), userId: z.uuid(), permission: z.enum(['viewer','editor','none']) });
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
