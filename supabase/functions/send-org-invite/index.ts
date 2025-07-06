import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const BASE_URL = Deno.env.get('BASE_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Background task to handle email sending and database updates
async function processInviteEmail(email: string, token: string) {
  try {
    console.log('Processing invite email for:', email);

    // Get organization name from the invite token
    const { data: inviteData, error: inviteError } = await supabase
      .from('organization_invites')
      .select(
        `
        organization_id,
        organizations!inner(name)
      `,
      )
      .eq('token', token)
      .single();

    if (inviteError || !inviteData) {
      console.error('Failed to fetch invite data:', inviteError);
      await updateInviteStatus(token, 'failed', {
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: 'Invalid invite token or invite not found',
      });
      return;
    }

    const organizationName = inviteData.organizations.name ?? 'Gonasi Organizaiton';
    const inviteUrl = `${BASE_URL}/i/org-invites/${token}/accept`;

    const payload = {
      from: 'Team at Gonasi <noreply@gonasi.com>',
      to: email,
      subject: `${organizationName} has invited you to collaborate`,
      html: `
        <p>Hello,</p>
        <p>${organizationName} has invited you to join their team.</p>
        <p>Accept your invite here:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>This link will expire in 7 days.</p>
        <p>Thanks,</p>
        <p>The Gonasi Team</p>
      `,
    };

    const now = new Date().toISOString();
    let deliveryStatus: 'sent' | 'failed' = 'sent';
    let deliveryLog: unknown = {};

    // Send email via Resend
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        deliveryStatus = 'failed';
        deliveryLog = {
          timestamp: now,
          status: 'failed',
          response: data,
        };
        console.error('Resend API error:', data);
      } else {
        deliveryLog = {
          timestamp: now,
          status: 'sent',
          messageId: data.id ?? null,
        };
        console.log('Email sent successfully:', data.id);
      }
    } catch (error) {
      deliveryStatus = 'failed';
      deliveryLog = {
        timestamp: now,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
      console.error('Email sending error:', error);
    }

    // Update invite record with delivery status
    await updateInviteStatus(token, deliveryStatus, deliveryLog);
  } catch (error) {
    console.error('Background task error:', error);
    await updateInviteStatus(token, 'failed', {
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Helper function to update invite status
async function updateInviteStatus(token: string, status: 'sent' | 'failed', deliveryLog: unknown) {
  try {
    // Get current resend count and logs
    const { data: currentInvite, error: fetchError } = await supabase
      .from('organization_invites')
      .select('resend_count, delivery_logs')
      .eq('token', token)
      .single();

    if (fetchError) {
      console.error('Failed to fetch current invite:', fetchError);
      return;
    }

    const currentLogs = currentInvite?.delivery_logs || [];
    const updatedLogs = [...currentLogs, deliveryLog];

    const { error: updateError } = await supabase
      .from('organization_invites')
      .update({
        delivery_status: status,
        last_sent_at: new Date().toISOString(),
        resend_count: (currentInvite?.resend_count || 0) + 1,
        updated_at: new Date().toISOString(),
        delivery_logs: updatedLogs,
      })
      .eq('token', token);

    if (updateError) {
      console.error('Failed to update delivery status:', updateError);
    }
  } catch (error) {
    console.error('Failed to update invite status:', error);
  }
}

// Listen for function shutdown events
addEventListener('beforeunload', (ev) => {
  console.log('Function will be shutdown due to', ev.detail?.reason);
});

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const body = await req.json();
    console.log('Received body:', body);

    const { email, token } = body;

    if (!email || !token) {
      console.error('Missing required fields:', { email: !!email, token: !!token });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email and token are required',
          received: Object.keys(body),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Start the background task - this will not block the response
    EdgeRuntime.waitUntil(processInviteEmail(email, token));

    // Return immediately to the client
    return new Response(
      JSON.stringify({
        success: true,
        status: 'processing',
        message: 'Invite email is being processed in the background',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
