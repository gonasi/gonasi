import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log('✅ Function started: [user-notifications-email-dispatch]');

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Template replacement function
function templateReplace(text: string, payload: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return payload[key] !== undefined ? String(payload[key]) : match;
  });
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

    // Fetch pending email notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('delivered_email', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ No pending email notifications to process');
      return new Response(JSON.stringify({ message: 'No pending notifications', processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📧 Processing ${notifications.length} notifications`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each notification
    for (const notif of notifications) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', notif.user_id)
          .single();

        if (userError || !userData?.email) {
          console.error(`⚠️ User not found or no email: ${notif.user_id}`);
          results.failed++;
          results.errors.push({
            notification_id: notif.id,
            error: 'User email not found',
          });
          continue;
        }

        // Parse payload if it's a string
        const payload =
          typeof notif.payload === 'string' ? JSON.parse(notif.payload) : notif.payload;

        // Template the body and title
        const emailBody = templateReplace(notif.body, payload);
        const emailTitle = templateReplace(notif.title, payload);

        // Send email via Resend
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'noreply@gonasi.com',
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
          console.error(`❌ Failed to send email for notification ${notif.id}:`, emailResponse);
          results.failed++;
          results.errors.push({
            notification_id: notif.id,
            error: emailResponse,
          });
          continue;
        }

        console.log(`✅ Email sent for notification ${notif.id}, job_id: ${emailResponse.id}`);

        // Update notification as delivered
        const { error: updateError } = await supabase
          .from('user_notifications')
          .update({
            delivered_email: true,
            email_job_id: emailResponse.id,
          })
          .eq('id', notif.id);

        if (updateError) {
          console.error(`⚠️ Failed to update notification ${notif.id}:`, updateError);
          // Email was sent but update failed - log it but count as success
        }

        results.success++;
      } catch (notifError) {
        console.error(`❌ Error processing notification ${notif.id}:`, notifError);
        results.failed++;
        results.errors.push({
          notification_id: notif.id,
          error: String(notifError),
        });
      }
    }

    console.log(`📊 Processing complete: ${results.success} success, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Email dispatch completed',
        processed: notifications.length,
        ...results,
      }),
      { headers: { 'Content-Type': 'application/json' } },
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
