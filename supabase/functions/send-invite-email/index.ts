import { serve } from 'https://deno.land/std/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const BASE_URL = Deno.env.get('BASE_URL');

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { to, inviteToken, companyName } = await req.json();

  if (!to || !inviteToken || !companyName) {
    return new Response('Missing required fields', { status: 400 });
  }

  const inviteLink = `${BASE_URL}/invite/${inviteToken}/staff/accept-staff-invite`;

  // Send email via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'noreply@gonasi.com',
      to,
      subject: 'You’re Invited to Join Our Team!',
      html: `
        <p>Hi,</p>
        <p>You have been invited to join ${companyName} as a valued team member. Click the link below to accept your invitation:</p>
        <p><a href="${inviteLink}" style="color: #007bff; text-decoration: none;">Accept Invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
        <p>Best regards,</p>
        <p>The Gonasi Team</p>
      `,
    }),
  });

  const emailResponse = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify(emailResponse), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, message: 'Email sent.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
