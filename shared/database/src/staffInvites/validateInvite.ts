// const { data: invite, error } = await supabase
//   .from('staff_invites')
//   .select('*')
//   .eq('invite_token', inviteToken)
//   .gt('expires_at', new Date().toISOString()) // Ensure invite is still valid
//   .single();

// if (!invite || error) {
//   return { success: false, message: 'This invite has expired or is invalid.' };
// }
