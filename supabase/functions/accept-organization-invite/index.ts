import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Helper function to create consistent response format
function createResponse(success: boolean, message: string, data: any = null, status: number = 200) {
  return new Response(
    JSON.stringify({
      success,
      message,
      data,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

Deno.serve(async (req) => {
  try {
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return createResponse(false, 'Server configuration error', null, 500);
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return createResponse(false, 'Missing Authorization header', null, 401);
    }

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createResponse(false, 'Invalid JSON in request body', null, 400);
    }

    const { token: inviteToken } = requestBody;
    if (!inviteToken) {
      return createResponse(false, 'Missing invite token', null, 400);
    }

    // RLS-enabled client: used to validate invite visibility
    const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client: used to bypass RLS for operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Validate user token
    const { data: authData, error: authError } = await authedSupabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      console.error('Auth error:', authError);
      return createResponse(false, 'Invalid or expired token', null, 401);
    }

    // Use service role to fetch invite to avoid RLS issues
    const { data: invite, error: inviteError } = await authedSupabase
      .from('organization_invites')
      .select('id, organization_id, email, role, invited_by, accepted_at, revoked_at, expires_at')
      .eq('token', inviteToken)
      .single();

    if (inviteError) {
      console.error('Invite fetch error:', inviteError);
      return createResponse(false, 'Database error fetching invite', null, 500);
    }

    if (!invite) {
      return createResponse(false, 'Invite not found', null, 404);
    }

    // Validate invite status
    if (invite.revoked_at) {
      return createResponse(false, 'Invite has been revoked', null, 410);
    }

    if (invite.accepted_at) {
      return createResponse(false, 'Invite already accepted', null, 409);
    }

    if (new Date(invite.expires_at) < new Date()) {
      return createResponse(false, 'Invite has expired', null, 410);
    }

    // Validate email match (optional but recommended)
    if (invite.email && user.email !== invite.email) {
      return createResponse(false, 'Email mismatch', null, 403);
    }

    const now = new Date().toISOString();

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invite.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberCheckError) {
      console.error('Member check error:', memberCheckError);
      return createResponse(false, 'Database error checking membership', null, 500);
    }

    if (existingMember) {
      return createResponse(false, 'User already a member of this organization', null, 409);
    }

    // Use service role for both operations to avoid RLS conflicts
    const { error: updateError } = await serviceSupabase
      .from('organization_invites')
      .update({
        accepted_at: now,
        accepted_by: user.id,
        updated_at: now,
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Update invite error:', updateError);
      return createResponse(false, 'Failed to update invite', null, 500);
    }

    // Insert member
    const { error: insertError } = await serviceSupabase.from('organization_members').insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
      invited_by: invite.invited_by,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error('Insert member error:', insertError);

      // Rollback the invite update
      await serviceSupabase
        .from('organization_invites')
        .update({
          accepted_at: null,
          accepted_by: null,
          updated_at: now,
        })
        .eq('id', invite.id);

      return createResponse(false, 'Failed to add user to organization', null, 500);
    }

    // Success response with data
    return createResponse(
      true,
      'Successfully accepted invite and joined organization',
      {
        organization_id: invite.organization_id,
        role: invite.role,
        user_id: user.id,
        joined_at: now,
      },
      200,
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
});
