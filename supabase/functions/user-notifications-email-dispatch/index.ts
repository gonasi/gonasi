import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log('✅ Function started: [user-notifications-email-dispatch]');

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const QUEUE_NAME = 'user_notifications_email_queue';
const BATCH_SIZE = 10; // Process 10 messages per invocation to prevent timeouts

// Type definition for queue messages
interface QueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: {
    notification_id: string;
    user_id: string;
    type_key: string;
    title: string;
    body: string;
    payload: Record<string, any>;
  };
}

// Template replacement function
function templateReplace(text: string, payload: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return payload[key] !== undefined ? String(payload[key]) : match;
  });
}

async function processMessage(
  message: QueueMessage,
  supabase: any,
): Promise<{ success: boolean; error?: any }> {
  const { notification_id, user_id, title, body, payload } = message.message;

  console.log('📦 Email payload:', JSON.stringify(payload, null, 2));

  try {
    console.log(`Processing notification ${notification_id} for user ${user_id}`);

    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user_id)
      .single();

    if (userError || !userData?.email) {
      console.error(`⚠️ User not found or no email: userId: ${user_id}`);
      console.error(`⚠️ Error: ${userError}`);
      // Delete message from queue (can't process without email)
      await supabase.schema('pgmq_public').rpc('delete', {
        queue_name: QUEUE_NAME,
        message_id: message.msg_id,
      });
      return { success: false, error: 'User email not found' };
    }

    // Template the body and title (in case they weren't pre-rendered)
    const emailBody = payload ? templateReplace(body, payload) : body;
    const emailTitle = payload ? templateReplace(title, payload) : title;

    console.log(`Sending email to ${userData.email}: ${emailTitle}`);

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Gonasi Notifications <no-reply@mail.gonasi.com>',
        to: userData.email,
        subject: emailTitle,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${emailTitle}</h2>
            <p style="color: #555; line-height: 1.6;">${emailBody}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated notification from Gonasi. Please do not reply to this email.
            </p>
          </div>
        `,
      }),
    });

    const emailResponse = await emailRes.json();

    if (!emailRes.ok) {
      console.error(`❌ Failed to send email for notification ${notification_id}:`, emailResponse);
      // Don't delete message - let it retry
      return { success: false, error: emailResponse };
    }

    console.log(
      `✅ Email sent for notification ${notification_id}, resend_id: ${emailResponse.id}`,
    );

    // Update notification as delivered
    const { error: updateError } = await supabase
      .from('user_notifications')
      .update({
        delivered_email: true,
        email_job_id: emailResponse.id,
      })
      .eq('id', notification_id);

    if (updateError) {
      console.error(`⚠️ Failed to update notification ${notification_id}:`, updateError);
      // Email was sent but update failed - still delete from queue
    }

    // Delete message from queue (successfully processed)
    const { error: deleteError } = await supabase.schema('pgmq_public').rpc('delete', {
      queue_name: QUEUE_NAME,
      message_id: message.msg_id,
    });

    if (deleteError) {
      console.error(`Failed to delete message ${message.msg_id}:`, deleteError);
    } else {
      console.log(`Message ${message.msg_id} deleted from queue`);
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Error processing message ${message.msg_id}:`, error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  console.log('📥 Incoming request at:', new Date().toISOString());

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Read messages from PGMQ queue
    const { data: messages, error: readError } = await supabase.schema('pgmq_public').rpc('read', {
      queue_name: QUEUE_NAME,
      sleep_seconds: 0, // Don't wait if queue is empty
      n: BATCH_SIZE, // Read N messages off the queue
    });

    if (readError) {
      console.error(`❌ Error reading from ${QUEUE_NAME} queue:`, readError);
      return new Response(JSON.stringify({ error: readError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      console.log('✅ No pending email notifications in queue');
      return new Response(JSON.stringify({ message: 'No pending notifications', processed: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📧 Processing ${messages.length} messages from queue`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each message
    for (const message of messages) {
      try {
        const result = await processMessage(message as QueueMessage, supabase);
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            notification_id: message.message.notification_id,
            msg_id: String(message.msg_id),
            error: result.error,
          });
        }
      } catch (error) {
        console.error(`Error processing message ${message.msg_id}:`, error);
        results.failed++;
        results.errors.push({
          msg_id: String(message.msg_id),
          error: String(error),
        });
      }
    }

    console.log(`📊 Processing complete: ${results.success} success, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Email dispatch completed',
        processed: messages.length,
        ...results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('❌ Fatal error in function:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
