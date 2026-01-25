import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// -------------------------------------------------------------
// Environment Variable Validation
// -------------------------------------------------------------
const requiredEnv = [
  'RESEND_API_KEY',
  'FRONTEND_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const missing = requiredEnv.filter((k) => !Deno.env.get(k));
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FRONTEND_URL = Deno.env.get('FRONTEND_URL')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Supabase client (service role)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// -------------------------------------------------------------
// Background task: send course invite email + update database
// -------------------------------------------------------------
async function processInviteEmail(email: string, token: string) {
  try {
    console.log('Processing course invite email for:', email);

    // Fetch invite + embedded course and organization
    const { data: inviteData, error: inviteError } = await supabase
      .from('course_invites')
      .select(
        `
        id,
        published_course_id,
        organization_id,
        published_course:published_courses!course_invites_published_course_id_fkey (
          id,
          name,
          description
        ),
        organization:organizations!course_invites_organization_id_fkey (
          id,
          name,
          handle
        )
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

    // Extract course and organization info
    const courseArr = Array.isArray(inviteData.published_course)
      ? inviteData.published_course
      : [inviteData.published_course];
    const courseName = courseArr?.[0]?.name ?? 'Gonasi Course';

    const organizationArr = Array.isArray(inviteData.organization)
      ? inviteData.organization
      : [inviteData.organization];
    const organizationName = organizationArr?.[0]?.name ?? 'Gonasi Organization';

    const inviteUrl = `${FRONTEND_URL}/i/course-invites/${token}/accept`;

    // Email content
    // -----------------------------------------------------------
    const payload = {
      from: 'Gonasi Team <no-reply@mail.gonasi.com>',
      to: email,
      subject: `You've been invited to enroll in "${courseName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 480px;">
          <p>Hello,</p>

          <p>
            <strong>${organizationName}</strong> has invited you to enroll in the course <strong>"${courseName}"</strong> on <strong>Gonasi</strong>.
          </p>

          <p style="margin: 24px 0;">
            <a href="${inviteUrl}"
              style="
                background: #4f46e5;
                color: #ffffff;
                padding: 12px 20px;
                border-radius: 6px;
                text-decoration: none;
                display: inline-block;
                font-weight: 600;
              ">
              Enroll Now
            </a>
          </p>

          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>

          <p style="color: #555;">This invitation link expires in 7 days.</p>

          <p>Best regards,<br/>The Gonasi Team</p>
        </div>
      `,
    };

    const now = new Date().toISOString();
    let deliveryStatus: 'sent' | 'failed' = 'sent';
    let deliveryLog: unknown = {};

    // -----------------------------------------------------------
    // Send email via Resend
    // -----------------------------------------------------------
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

    // -----------------------------------------------------------
    // Update invite record with delivery status
    // -----------------------------------------------------------
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

// -------------------------------------------------------------
// Update invite status + delivery logs
// -------------------------------------------------------------
async function updateInviteStatus(token: string, status: 'sent' | 'failed', deliveryLog: unknown) {
  try {
    const { data: currentInvite, error: fetchError } = await supabase
      .from('course_invites')
      .select('delivery_logs')
      .eq('token', token)
      .single();

    if (fetchError) {
      console.error('Failed to fetch current invite:', fetchError);
      return;
    }

    const updatedLogs = [...(currentInvite?.delivery_logs ?? []), deliveryLog];

    const { error: updateError } = await supabase
      .from('course_invites')
      .update({
        delivery_status: status,
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

// -------------------------------------------------------------
// Shutdown logging
// -------------------------------------------------------------
addEventListener('beforeunload', (_ev) => {
  console.log('Function shutting down');
});
// -------------------------------------------------------------
// Main HTTP Handler
// -------------------------------------------------------------
Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const body = await req.json();
    console.log('Received body:', body);

    const { email, token } = body;

    if (!email || !token) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email and token are required',
          received: body,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fire background task without blocking response
    EdgeRuntime.waitUntil(processInviteEmail(email, token));

    return new Response(
      JSON.stringify({
        success: true,
        status: 'processing',
        message: 'Course invite email is being processed in the background',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
