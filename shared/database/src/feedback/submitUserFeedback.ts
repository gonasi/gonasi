import type { FeedbackSubmitValues } from '../../../gonasi-schemas/src/feedback/index';
import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const submitUserFeedback = async (
  supabase: TypedSupabaseClient,
  feedbackData: FeedbackSubmitValues,
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getUserId(supabase);
  const { experience, hardestPart, bestPart, npsScore, shareFeedback, email } = feedbackData;

  const normalizedUserId = userId && userId.trim() !== '' ? userId : null;

  try {
    const { data, error: insertError } = await supabase
      .from('feedback')
      .insert({
        experience,
        hardest_part: hardestPart,
        best_part: bestPart,
        nps_score: npsScore,
        share_feedback: shareFeedback,
        email,
        created_by: normalizedUserId,
        updated_by: normalizedUserId,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error submitting feedback: ', insertError);
      return {
        success: false,
        message: 'Failed to submit feedback. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Your feedback has been submitted successfully. Thank you!',
      data,
    };
  } catch (err) {
    console.error('Unexpected error in submitUserFeedback:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
