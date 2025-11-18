// ============================================================
// tier-limits-updated
// ============================================================
// Called by Postgres triggers when a tier_limit is inserted
// or updated. Used to sync pricing, cache, Paystack plans,
// or notify internal systems.
// ============================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[tier-limits-updated]');

// ============================================================
// ENV
// ============================================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

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

// ============================================================
// Paystack API helpers
// ============================================================

/**
 * Fetch all plans with pagination support
 * Paystack returns plans with status fields to indicate if active
 */
async function getAllPaystackPlans(): Promise<any[]> {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return [];
  }

  const allPlans: any[] = [];
  let page = 1;
  const perPage = 100; // Maximum allowed by Paystack
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await fetch(`https://api.paystack.co/plan?page=${page}&perPage=${perPage}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[Paystack] Failed to fetch plans (page ${page}):`, data);
        break;
      }

      // Filter for active plans only (exclude archived/deleted)
      const activePlans =
        data.data?.filter((plan: any) => plan.is_deleted === false && plan.is_archived === false) ||
        [];

      allPlans.push(...activePlans);

      // Check if there are more pages
      const meta = data.meta;
      if (meta && meta.page && meta.pageCount) {
        hasMore = meta.page < meta.pageCount;
        page++;
      } else {
        // Fallback: check if we got fewer results than perPage
        hasMore = data.data?.length === perPage;
        if (hasMore) page++;
      }

      console.log(
        `[Paystack] Fetched page ${page - 1}: ${activePlans.length} active plans (${allPlans.length} total so far)`,
      );
    }

    console.log(`[Paystack] Total active plans fetched: ${allPlans.length}`);
    return allPlans;
  } catch (error) {
    console.error('[Paystack] Error fetching all plans:', error);
    return allPlans; // Return what we have so far
  }
}

/**
 * Get a specific plan by plan_code from Paystack
 */
async function getPaystackPlan(planCode: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return null;
  }

  try {
    const response = await fetch(`https://api.paystack.co/plan/${planCode}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Paystack] Failed to get plan:', data);
      return null;
    }

    // Check if plan is active
    if (data.data?.is_deleted || data.data?.is_archived) {
      console.warn('[Paystack] Plan is deleted or archived:', planCode);
      return null;
    }

    console.log('[Paystack] Retrieved plan:', data.data);
    return data.data;
  } catch (error) {
    console.error('[Paystack] Error getting plan:', error);
    return null;
  }
}

/**
 * List all plans and find matches by tier and interval
 */
async function findExistingPlansByTierAndInterval(tier: string, interval: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return [];
  }

  try {
    const allPlans = await getAllPaystackPlans();

    // Find all active plans that match this tier and interval
    const tierCapitalized = tier.charAt(0).toUpperCase() + tier.slice(1);
    const matchingPlans = allPlans.filter((plan: any) => {
      const nameMatches = plan.name?.includes(tierCapitalized) && plan.name?.includes(interval);
      const intervalMatches = plan.interval === interval;
      return nameMatches && intervalMatches;
    });

    if (matchingPlans.length > 0) {
      console.log(
        `[Paystack] Found ${matchingPlans.length} existing active plan(s) for ${tier}-${interval}:`,
        matchingPlans.map((p: any) => ({ name: p.name, code: p.plan_code, id: p.id })),
      );
    }

    return matchingPlans;
  } catch (error) {
    console.error('[Paystack] Error listing plans:', error);
    return [];
  }
}

/**
 * Check if a plan with the same price, currency, and interval already exists
 * Returns the matching plan or null
 */
async function findPlanByPricing(amount: number, currency: string, interval: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return null;
  }

  try {
    const allPlans = await getAllPaystackPlans();

    // Convert amount to subunit for comparison
    const amountInSubunit = Math.round(amount * 100);

    // Find any active plan with matching price, currency, and interval
    const matchingPlan = allPlans.find((plan: any) => {
      const priceMatches = plan.amount === amountInSubunit;
      const currencyMatches = plan.currency === currency.toUpperCase();
      const intervalMatches = plan.interval === interval;
      return priceMatches && currencyMatches && intervalMatches;
    });

    if (matchingPlan) {
      console.log(
        `[Paystack] Found existing plan with matching pricing: "${matchingPlan.name}" (${matchingPlan.plan_code}) - ${currency} ${amount}/${interval}`,
      );
      return matchingPlan;
    }

    console.log(`[Paystack] No plan found with pricing ${currency} ${amount}/${interval}`);
    return null;
  } catch (error) {
    console.error('[Paystack] Error searching for plan by pricing:', error);
    return null;
  }
}

/**
 * Create a new plan in Paystack
 */
async function createPaystackPlan(row: any) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return null;
  }

  // Determine the billing amount (monthly or yearly only)
  const amount = row.plan_interval === 'monthly' ? row.price_monthly_usd : row.price_yearly_usd; // default to yearly if not monthly

  if (!amount || amount <= 0) {
    console.log('[Paystack] No valid amount for plan, skipping creation');
    return null;
  }

  // Convert USD to cents/kobo (Paystack expects amount in subunit)
  const amountInSubunit = Math.round(amount * 100);

  const planName = `${row.tier.charAt(0).toUpperCase() + row.tier.slice(1)} - ${row.plan_interval}`;

  const payload = {
    name: planName,
    interval: row.plan_interval || 'monthly',
    amount: amountInSubunit,
    currency: row.plan_currency || 'USD',
    description: `${row.tier} tier subscription`,
    send_invoices: true,
    send_sms: false,
  };

  console.log('[Paystack] Creating plan:', payload);

  try {
    const response = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Paystack] Plan creation failed:', data);
      return null;
    }

    console.log('[Paystack] Plan created successfully:', data.data);
    return {
      plan_id: data.data.id,
      plan_code: data.data.plan_code,
    };
  } catch (error) {
    console.error('[Paystack] Error creating plan:', error);
    return null;
  }
}

/**
 * Update an existing plan in Paystack
 */
async function updatePaystackPlan(planCode: string, row: any) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return null;
  }

  // Determine amount based on interval
  const amount = row.plan_interval === 'monthly' ? row.price_monthly_usd : row.price_yearly_usd;

  if (!amount || amount <= 0) {
    console.log('[Paystack] No valid amount for plan update');
    return null;
  }

  // Convert USD to cents/kobo
  const amountInSubunit = Math.round(amount * 100);

  const payload = {
    name: `${row.tier.charAt(0).toUpperCase() + row.tier.slice(1)} - ${row.plan_interval}`,
    amount: amountInSubunit,
    interval: row.plan_interval || 'monthly',
    currency: row.plan_currency || 'USD',
    description: `${row.tier} tier subscription`,
    send_invoices: true,
    send_sms: false,
  };

  console.log('[Paystack] Updating plan:', planCode);

  try {
    const response = await fetch(`https://api.paystack.co/plan/${planCode}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Paystack] Plan update failed:', data);
      return null;
    }

    if (!data.data || !data.data.id) {
      console.error('[Paystack] Invalid response structure:', data);
      return null;
    }

    console.log('[Paystack] Plan updated successfully:', data.data);
    return {
      plan_id: data.data.id,
      plan_code: data.data.plan_code,
    };
  } catch (error) {
    console.error('[Paystack] Error updating plan:', error);
    return null;
  }
}

/**
 * Update tier_limits table with Paystack plan details
 */
async function updateTierLimitsWithPaystackData(tier: string, planId: number, planCode: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[DB] Missing Supabase configuration');
    return false;
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(
      `[DB] Updating tier_limits for tier: ${tier} with plan_id: ${planId}, plan_code: ${planCode}`,
    );

    const { data, error } = await supabase
      .from('tier_limits')
      .update({
        paystack_plan_id: planId.toString(),
        paystack_plan_code: planCode,
      })
      .eq('tier', tier)
      .select();

    if (error) {
      console.error('[DB] Failed to update tier_limits:', error);
      console.error('[DB] Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    if (!data || data.length === 0) {
      console.error('[DB] No rows were updated. Tier might not exist:', tier);
      return false;
    }

    console.log('[DB] Successfully updated tier_limits with Paystack data:', data);
    return true;
  } catch (error) {
    console.error('[DB] Error updating tier_limits:', error);
    return false;
  }
}

// ============================================================
// Main handler
// ============================================================

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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
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

      // Determine amount and currency
      const amount = row.plan_interval === 'monthly' ? row.price_monthly_usd : row.price_yearly_usd;
      const currency = row.plan_currency || 'USD';
      const interval = row.plan_interval || 'monthly';

      // Handle free tiers (price = 0)
      if (!amount || amount <= 0) {
        console.log(
          `[tier-limits-updated] Tier ${row.tier} has no price (free tier), skipping Paystack sync`,
        );
        return new Response(
          JSON.stringify({
            ok: true,
            event,
            tier: row.tier,
            note: 'Free tier, no Paystack plan needed',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // STRATEGY: Check if a plan with this exact pricing already exists
      // If yes, link to it. If no, create a new plan.
      const existingPlanWithPricing = await findPlanByPricing(amount, currency, interval);

      if (existingPlanWithPricing) {
        // Found a plan with matching pricing, link to it
        console.log(
          `[Paystack] Linking tier ${row.tier} to existing plan ${existingPlanWithPricing.plan_code}`,
        );

        const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
          row.tier,
          existingPlanWithPricing.id,
          existingPlanWithPricing.plan_code,
        );

        if (!dbUpdateSuccess) {
          console.error('[DB] Failed to link to existing plan');
          return new Response(
            JSON.stringify({
              error: 'Database update failed',
              details: 'Could not link tier to existing Paystack plan',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            event,
            tier: row.tier,
            linked_to_existing: true,
            plan_code: existingPlanWithPricing.plan_code,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // No existing plan with this pricing, check by tier/interval
      const existingPlansByTier = await findExistingPlansByTierAndInterval(row.tier, interval);

      if (existingPlansByTier.length > 0) {
        // Found plan(s) with matching tier/interval but different pricing
        // Update the first one with new pricing
        console.log(`[Paystack] Found existing plan for ${row.tier}-${interval}, updating pricing`);
        const planToUpdate = existingPlansByTier[0];

        const updateResult = await updatePaystackPlan(planToUpdate.plan_code, row);

        if (updateResult) {
          const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
            row.tier,
            updateResult.plan_id,
            updateResult.plan_code,
          );

          if (!dbUpdateSuccess) {
            console.error('[DB] Failed to update tier_limits after Paystack update');
            return new Response(
              JSON.stringify({
                error: 'Database update failed',
                details: 'Paystack plan updated but database sync failed',
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          return new Response(
            JSON.stringify({
              ok: true,
              event,
              tier: row.tier,
              updated_existing: true,
              plan_code: updateResult.plan_code,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        } else {
          // Update failed, but still link to existing plan
          console.warn('[Paystack] Update failed, linking to existing plan anyway');
          const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
            row.tier,
            planToUpdate.id,
            planToUpdate.plan_code,
          );

          if (!dbUpdateSuccess) {
            console.error('[DB] Failed to link to existing plan');
          }

          return new Response(
            JSON.stringify({
              ok: true,
              event,
              tier: row.tier,
              linked_to_existing: true,
              plan_code: planToUpdate.plan_code,
              note: 'Paystack update failed but linked to existing plan',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }

      // No existing plans at all, create new one
      console.log('[Paystack] No existing plans found, creating new one');
      const paystackResult = await createPaystackPlan(row);

      if (paystackResult) {
        const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
          row.tier,
          paystackResult.plan_id,
          paystackResult.plan_code,
        );

        if (!dbUpdateSuccess) {
          console.error('[DB] Failed to update tier_limits after Paystack creation');
          return new Response(
            JSON.stringify({
              error: 'Database update failed',
              details: 'Paystack plan created but database sync failed',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            event,
            tier: row.tier,
            created_new: true,
            plan_code: paystackResult.plan_code,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      } else {
        console.error('[Paystack] Failed to create plan');
        return new Response(
          JSON.stringify({
            error: 'Paystack plan creation failed',
            tier: row.tier,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // ============================================================
    // UPDATE LOGIC
    // ============================================================
    if (event === 'UPDATE') {
      console.log(`[tier-limits-updated] Tier updated: ${row.tier}`);

      // Determine amount and currency
      const amount = row.plan_interval === 'monthly' ? row.price_monthly_usd : row.price_yearly_usd;
      const currency = row.plan_currency || 'USD';
      const interval = row.plan_interval || 'monthly';

      // Handle free tiers (price = 0)
      if (!amount || amount <= 0) {
        console.log(
          `[tier-limits-updated] Tier ${row.tier} has no price (free tier), skipping Paystack sync`,
        );
        return new Response(
          JSON.stringify({
            ok: true,
            event,
            tier: row.tier,
            note: 'Free tier, no Paystack plan needed',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // If we have a plan_code in DB, update that plan
      if (row.paystack_plan_code) {
        console.log('[Paystack] Plan code exists in DB, updating it...');

        const existingPlan = await getPaystackPlan(row.paystack_plan_code);

        if (existingPlan) {
          // Plan exists, update it
          const updateResult = await updatePaystackPlan(row.paystack_plan_code, row);

          if (updateResult) {
            console.log('[Paystack] Plan updated successfully');
            return new Response(
              JSON.stringify({
                ok: true,
                event,
                tier: row.tier,
                updated: true,
                plan_code: updateResult.plan_code,
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          } else {
            console.error('[Paystack] Failed to update existing plan');
            return new Response(
              JSON.stringify({
                error: 'Paystack plan update failed',
                tier: row.tier,
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }
        } else {
          // Plan doesn't exist in Paystack anymore, find or create alternative
          console.warn(
            '[Paystack] Plan code in DB not found in Paystack, searching for alternatives...',
          );
        }
      }

      // No plan_code or plan not found, search by pricing first
      const existingPlanWithPricing = await findPlanByPricing(amount, currency, interval);

      if (existingPlanWithPricing) {
        // Found a plan with matching pricing, link to it
        console.log(`[Paystack] Linking tier ${row.tier} to existing plan with matching pricing`);

        const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
          row.tier,
          existingPlanWithPricing.id,
          existingPlanWithPricing.plan_code,
        );

        if (!dbUpdateSuccess) {
          console.error('[DB] Failed to link to existing plan');
          return new Response(
            JSON.stringify({
              error: 'Database update failed',
              details: 'Could not link tier to existing Paystack plan',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            event,
            tier: row.tier,
            linked_to_existing: true,
            plan_code: existingPlanWithPricing.plan_code,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Search by tier/interval
      const matchingPlans = await findExistingPlansByTierAndInterval(row.tier, interval);

      if (matchingPlans.length > 0) {
        // Found matching plan(s), update the first one
        console.log('[Paystack] Found matching plan by tier/interval, updating it');
        const plan = matchingPlans[0];

        const updateResult = await updatePaystackPlan(plan.plan_code, row);

        if (updateResult) {
          const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
            row.tier,
            updateResult.plan_id,
            updateResult.plan_code,
          );

          if (!dbUpdateSuccess) {
            console.error('[DB] Failed to update tier_limits');
            return new Response(
              JSON.stringify({
                error: 'Database update failed',
                details: 'Paystack plan updated but database sync failed',
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          return new Response(
            JSON.stringify({
              ok: true,
              event,
              tier: row.tier,
              updated_existing: true,
              plan_code: updateResult.plan_code,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        } else {
          // Update failed but link anyway
          const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
            row.tier,
            plan.id,
            plan.plan_code,
          );

          if (!dbUpdateSuccess) {
            console.error('[DB] Failed to link to existing plan');
          }

          return new Response(
            JSON.stringify({
              ok: true,
              event,
              tier: row.tier,
              linked_to_existing: true,
              plan_code: plan.plan_code,
              note: 'Paystack update failed but linked to existing plan',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }

      // No matching plans, create new one
      console.log('[Paystack] No matching plans found, creating new one');
      const paystackResult = await createPaystackPlan(row);

      if (paystackResult) {
        const dbUpdateSuccess = await updateTierLimitsWithPaystackData(
          row.tier,
          paystackResult.plan_id,
          paystackResult.plan_code,
        );

        if (!dbUpdateSuccess) {
          console.error('[DB] Failed to update tier_limits after Paystack creation');
          return new Response(
            JSON.stringify({
              error: 'Database update failed',
              details: 'Paystack plan created but database sync failed',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            event,
            tier: row.tier,
            created_new: true,
            plan_code: paystackResult.plan_code,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      } else {
        console.error('[Paystack] Failed to create plan');
        return new Response(
          JSON.stringify({
            error: 'Paystack plan creation failed',
            tier: row.tier,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // ============================================================
    // OK RESPONSE (fallback)
    // ============================================================
    return new Response(JSON.stringify({ ok: true, event, tier: row.tier }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[tier-limits-updated] Internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
