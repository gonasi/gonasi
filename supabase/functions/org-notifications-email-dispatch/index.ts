import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log('✅ Function started: [org-notifications-email-dispatch]');

// ──────────────────────────────────────────────────────────────
// ENVIRONMENT
// ──────────────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const QUEUE_NAME = 'org_notifications_email_queue';
const BATCH_SIZE = 10; // Avoid timeouts

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────
interface QueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: {
    notification_id: string;
    organization_id: string;
    type_key: string;
    title: string;
    body: string;
    link?: string;
    payload: Record<string, any>;
    emails: string[]; // ✅ Added field from trigger
  };
}

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
function templateReplace(text: string, payload: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    payload[key] !== undefined ? String(payload[key]) : match,
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN MESSAGE HANDLER
// ──────────────────────────────────────────────────────────────
async function processMessage(
  message: QueueMessage,
  supabase: any,
): Promise<{ success: boolean; error?: any }> {
  console.log(`📦 Processing org notification ${message.message.notification_id}`);

  const { notification_id, title, body, payload, emails, link } = message.message;

  try {
    if (!emails || emails.length === 0) {
      console.warn(`⚠️ No recipients found for notification ${notification_id}`);
      await supabase.schema('pgmq_public').rpc('delete', {
        queue_name: QUEUE_NAME,
        message_id: message.msg_id,
      });
      return { success: false, error: 'No recipients' };
    }

    // Interpolate template placeholders
    const emailBody = templateReplace(body, payload || {});
    const emailTitle = templateReplace(title, payload || {});

    // Wrap the body with clickable link if available
    const emailBodyContent = link
      ? `
        <a href="${link}"
          style="color: inherit; text-decoration: none; display: block; padding: 12px 0;">
          <p style="color: #555; line-height: 1.6; margin: 0;">
            ${emailBody}
          </p>
          <p style="color: #007BFF; margin-top: 8px; font-size: 14px;">
            View details →
          </p>
        </a>
      `
      : `<p style="color: #555; line-height: 1.6;">${emailBody}</p>`;

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Gonasi Notifications <no-reply@mail.gonasi.com>',
        to: emails,
        subject: emailTitle,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${emailTitle}</h2>
            ${emailBodyContent}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated organization notification from Gonasi.
            </p>
          </div>
        `,
      }),
    });

    const emailResponse = await emailRes.json();

    if (!emailRes.ok) {
      console.error(`❌ Failed to send email for ${notification_id}:`, emailResponse);
      return { success: false, error: emailResponse };
    }

    console.log(
      `✅ Email sent for notification ${notification_id}, resend_id: ${emailResponse.id}`,
    );

    // Update DB as delivered
    const { error: updateError } = await supabase
      .from('org_notifications')
      .update({
        delivered_email: true,
        email_job_id: emailResponse.id,
      })
      .eq('id', notification_id);

    if (updateError)
      console.error(`⚠️ Failed to update notification ${notification_id}:`, updateError);

    // Delete message from queue
    const { error: deleteError } = await supabase.schema('pgmq_public').rpc('delete', {
      queue_name: QUEUE_NAME,
      message_id: message.msg_id,
    });
    if (deleteError)
      console.error(`Failed to delete queue message ${message.msg_id}:`, deleteError);

    return { success: true };
  } catch (error) {
    console.error(`❌ Error processing message ${message.msg_id}:`, error);
    return { success: false, error: String(error) };
  }
}

// ──────────────────────────────────────────────────────────────
// ENTRYPOINT
// ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: messages, error: readError } = await supabase.schema('pgmq_public').rpc('read', {
      queue_name: QUEUE_NAME,
      sleep_seconds: 0,
      n: BATCH_SIZE,
    });

    console.log('messages: ', JSON.stringify(messages));

    if (readError) {
      console.error(`❌ Error reading from queue:`, readError);
      return new Response(JSON.stringify({ error: readError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      console.log('✅ No pending org notifications');
      return new Response(JSON.stringify({ processed: 0, message: 'Queue empty' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📧 Processing ${messages.length} messages`);

    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const message of messages) {
      const result = await processMessage(message as QueueMessage, supabase);
      if (result.success) results.success++;
      else {
        results.failed++;
        results.errors.push({
          notification_id: message.message.notification_id,
          msg_id: String(message.msg_id),
          error: result.error,
        });
      }
    }

    console.log(`📊 Dispatch complete: ${results.success} ok, ${results.failed} failed`);

    return new Response(JSON.stringify({ processed: messages.length, ...results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Fatal error in dispatcher:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
