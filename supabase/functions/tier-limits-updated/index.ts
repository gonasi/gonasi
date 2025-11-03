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
        matchingPlans.map((p: any) => ({ name: p.name, code: p.plan_code })),
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
 * This prevents duplicate plans with identical pricing
 */
async function checkForDuplicatePricing(amount: number, currency: string, interval: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return null;
  }

  try {
    const allPlans = await getAllPaystackPlans();

    // Convert amount to subunit for comparison
    const amountInSubunit = Math.round(amount * 100);

    // Find any active plan with matching price, currency, and interval
    const duplicatePlan = allPlans.find((plan: any) => {
      const priceMatches = plan.amount === amountInSubunit;
      const currencyMatches = plan.currency === currency.toUpperCase();
      const intervalMatches = plan.interval === interval;
      return priceMatches && currencyMatches && intervalMatches;
    });

    if (duplicatePlan) {
      console.warn(
        `[Paystack] DUPLICATE PRICING DETECTED: Plan "${duplicatePlan.name}" (${duplicatePlan.plan_code}) already exists with ${currency} ${amount}/${interval}`,
      );
      return duplicatePlan;
    }

    console.log(
      `[Paystack] No duplicate pricing found for ${currency} ${amount}/${interval} - safe to proceed`,
    );
    return null;
  } catch (error) {
    console.error('[Paystack] Error checking for duplicate pricing:', error);
    return null;
  }
}

/**
 * Check if a plan with the same name already exists
 * This prevents duplicate plans with identical names
 */
async function checkForDuplicateName(planName: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack] Secret key not configured');
    return null;
  }

  try {
    const allPlans = await getAllPaystackPlans();

    // Find any active plan with exact matching name (case-insensitive)
    const duplicatePlan = allPlans.find(
      (plan: any) => plan.name?.toLowerCase() === planName.toLowerCase(),
    );

    if (duplicatePlan) {
      console.warn(
        `[Paystack] DUPLICATE NAME DETECTED: Plan "${duplicatePlan.name}" (${duplicatePlan.plan_code}) already exists`,
      );
      return duplicatePlan;
    }

    console.log(`[Paystack] No duplicate name found for "${planName}" - safe to proceed`);
    return null;
  } catch (error) {
    console.error('[Paystack] Error checking for duplicate name:', error);
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

  // Determine amount based on interval
  const amount = row.plan_interval === 'monthly' ? row.price_monthly_usd : row.price_yearly_usd;

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
    return;
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      return;
    }

    console.log('[DB] Successfully updated tier_limits with Paystack data:', data);
  } catch (error) {
    console.error('[DB] Error updating tier_limits:', error);
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
      const planName = `${row.tier.charAt(0).toUpperCase() + row.tier.slice(1)} - ${row.plan_interval}`;

      // SAFETY CHECK 1: Verify no duplicate pricing exists
      if (amount === null || amount === undefined) {
        throw new Error('Plan price (amount) is missing or invalid');
      }
      const duplicatePricePlan = await checkForDuplicatePricing(
        amount,
        currency,
        row.plan_interval as string,
      );

      if (duplicatePricePlan) {
        console.error(
          `[Paystack] BLOCKED: Cannot create plan - duplicate pricing detected (${duplicatePricePlan.plan_code})`,
        );
        return new Response(
          JSON.stringify({
            error: 'Duplicate pricing detected',
            existing_plan: duplicatePricePlan.plan_code,
            existing_plan_name: duplicatePricePlan.name,
            message: `A plan with ${currency} ${amount}/${row.plan_interval} already exists`,
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // SAFETY CHECK 2: Verify no duplicate name exists
      const duplicateNamePlan = await checkForDuplicateName(planName);

      if (duplicateNamePlan) {
        console.error(
          `[Paystack] BLOCKED: Cannot create plan - duplicate name detected (${duplicateNamePlan.plan_code})`,
        );
        return new Response(
          JSON.stringify({
            error: 'Duplicate name detected',
            existing_plan: duplicateNamePlan.plan_code,
            existing_plan_name: duplicateNamePlan.name,
            message: `A plan named "${planName}" already exists`,
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Check if we already have matching plans by tier/interval
      const existingPlans = await findExistingPlansByTierAndInterval(
        row.tier as string,
        row.plan_interval as string,
      );

      if (existingPlans.length > 0) {
        // Use the first matching plan and update it
        console.log(`[Paystack] Found ${existingPlans.length} existing plan(s), reusing first one`);
        const existingPlan = existingPlans[0];

        const updateResult = await updatePaystackPlan(existingPlan.plan_code, row);

        if (updateResult) {
          await updateTierLimitsWithPaystackData(
            row.tier,
            updateResult.plan_id,
            updateResult.plan_code,
          );
        } else {
          // Update failed, but we still want to link to the existing plan
          console.warn('[Paystack] Update failed, but linking to existing plan anyway');
          await updateTierLimitsWithPaystackData(row.tier, existingPlan.id, existingPlan.plan_code);
        }
      } else {
        // No existing plan, create new one
        console.log('[Paystack] No existing plan found, creating new one');
        const paystackResult = await createPaystackPlan(row);

        if (paystackResult) {
          await updateTierLimitsWithPaystackData(
            row.tier,
            paystackResult.plan_id,
            paystackResult.plan_code,
          );
        }
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
      const planName = `${row.tier.charAt(0).toUpperCase() + row.tier.slice(1)} - ${row.plan_interval}`;

      // SAFETY CHECK 1: Verify no duplicate pricing exists (except for the current plan)
      if (amount === null || amount === undefined) {
        throw new Error('Amount is required and must be a number');
      }
      const duplicatePricePlan = await checkForDuplicatePricing(
        amount,
        currency,
        row.plan_interval as string,
      );

      if (duplicatePricePlan && duplicatePricePlan.plan_code !== row.paystack_plan_code) {
        console.error(
          `[Paystack] BLOCKED: Cannot update plan - duplicate pricing detected (${duplicatePricePlan.plan_code})`,
        );
        return new Response(
          JSON.stringify({
            error: 'Duplicate pricing detected',
            existing_plan: duplicatePricePlan.plan_code,
            existing_plan_name: duplicatePricePlan.name,
            message: `A different plan with ${currency} ${amount}/${row.plan_interval} already exists`,
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // SAFETY CHECK 2: Verify no duplicate name exists (except for the current plan)
      const duplicateNamePlan = await checkForDuplicateName(planName);

      if (duplicateNamePlan && duplicateNamePlan.plan_code !== row.paystack_plan_code) {
        console.error(
          `[Paystack] BLOCKED: Cannot update plan - duplicate name detected (${duplicateNamePlan.plan_code})`,
        );
        return new Response(
          JSON.stringify({
            error: 'Duplicate name detected',
            existing_plan: duplicateNamePlan.plan_code,
            existing_plan_name: duplicateNamePlan.name,
            message: `A different plan named "${planName}" already exists`,
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // If we have a plan_code in DB, verify it exists and update it
      if (row.paystack_plan_code) {
        console.log('[Paystack] Plan code exists in DB, verifying in Paystack...');

        const existingPlan = await getPaystackPlan(row.paystack_plan_code);

        if (existingPlan) {
          // Plan exists, update it
          const updateResult = await updatePaystackPlan(row.paystack_plan_code, row);

          if (!updateResult) {
            console.error('[Paystack] Failed to update existing plan');
          }
        } else {
          // Plan doesn't exist in Paystack, search for matching plans
          console.warn(
            '[Paystack] Plan code in DB not found in Paystack, searching for alternatives...',
          );

          const matchingPlans = await findExistingPlansByTierAndInterval(
            row.tier,
            row.plan_interval || 'monthly',
          );

          if (matchingPlans.length > 0) {
            // Found matching plan(s), use the first one
            console.log('[Paystack] Found matching plan, linking to it');
            const plan = matchingPlans[0];

            const updateResult = await updatePaystackPlan(plan.plan_code, row);

            if (updateResult) {
              await updateTierLimitsWithPaystackData(
                row.tier,
                updateResult.plan_id,
                updateResult.plan_code,
              );
            }
          } else {
            // No matching plans, create new one
            console.log('[Paystack] No matching plans found, creating new one');
            const paystackResult = await createPaystackPlan(row);

            if (paystackResult) {
              await updateTierLimitsWithPaystackData(
                row.tier,
                paystackResult.plan_id,
                paystackResult.plan_code,
              );
            }
          }
        }
      } else {
        // No plan_code in DB, search for existing plans first
        console.log('[Paystack] No plan code in DB, searching for existing plans...');

        const matchingPlans = await findExistingPlansByTierAndInterval(
          row.tier,
          row.plan_interval || 'monthly',
        );

        if (matchingPlans.length > 0) {
          // Found matching plan(s), use the first one
          console.log('[Paystack] Found matching plan, linking to it');
          const plan = matchingPlans[0];

          const updateResult = await updatePaystackPlan(plan.plan_code, row);

          if (updateResult) {
            await updateTierLimitsWithPaystackData(
              row.tier,
              updateResult.plan_id,
              updateResult.plan_code,
            );
          } else {
            // Update failed but link anyway
            await updateTierLimitsWithPaystackData(row.tier, plan.id, plan.plan_code);
          }
        } else {
          // No matching plans, create new one
          console.log('[Paystack] No matching plans found, creating new one');
          const paystackResult = await createPaystackPlan(row);

          if (paystackResult) {
            await updateTierLimitsWithPaystackData(
              row.tier,
              paystackResult.plan_id,
              paystackResult.plan_code,
            );
          }
        }
      }
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
