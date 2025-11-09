// --- Response returned FROM your Edge function ---
export interface PaystackSubscriptionResponse {
  success: boolean;
  data: {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  } | null;
}
