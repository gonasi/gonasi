// ============================================================
// tier-limits-updated
// ============================================================
// Called by Postgres triggers when a tier_limit is inserted
// or updated. Used to sync pricing, cache, Paystack plans,
// or notify internal systems.
// ============================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[tier-limits-updated]');

// ============================================================
// ENV
// ============================================================
const PROJECT_URL = Deno.env.get('PROJECT_URL');
const INTERNAL_SECRET = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

// ============================================================
// Zod schema for trigger payload
// ============================================================
const PayloadSchema = z.object({
  table: z.string(),
  event: z.enum(['INSERT', 'UPDATE']),
  row: z.object({
    tier: z.string(),
    price_monthly_usd: z.number().nullable().optional(),
    price_yearly_usd: z.number().nullable().optional(),
    paystack_plan_id: z.string().nullable().optional(),
    paystack_plan_code: z.string().nullable().optional(),
    plan_currency: z.string().nullable().optional(),
    plan_interval: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  }),
});

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const parsed = PayloadSchema.safeParse(body);

    if (!parsed.success) {
      console.error('[Validation failed]', parsed.error);
      return new Response(JSON.stringify({ error: 'Invalid trigger payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!INTERNAL_SECRET) {
      return new Response(JSON.stringify({ error: 'INTERNAL_WEBHOOK_SECRET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { event, row } = parsed.data;

    console.log('[tier-limits-updated] Trigger received:', {
      event,
      tier: row.tier,
      time: new Date().toISOString(),
    });

    // ============================================================
    // INSERT LOGIC
    // ============================================================
    if (event === 'INSERT') {
      console.log(`[tier-limits-updated] New tier created: ${row.tier}`);

      // Example: sync pricing, create Paystack plan, etc.
      // await createOrSyncPaystackPlan(row);
    }

    // ============================================================
    // UPDATE LOGIC
    // ============================================================
    if (event === 'UPDATE') {
      console.log(`[tier-limits-updated] Tier updated: ${row.tier}`);

      // Example: update caches, pricing, plan details, etc.
      // await updateTierInCache(row);
    }

    // ============================================================
    // OK RESPONSE
    // ============================================================
    return new Response(JSON.stringify({ ok: true, event, tier: row.tier }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[tier-limits-updated] Internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
