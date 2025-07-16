import type { InitializeEnrollMetadata, PaystackMetadata } from './types';

export function toPaystackMetadata(metadata: InitializeEnrollMetadata): PaystackMetadata {
  return {
    ...metadata,
    custom_fields: [
      {
        display_name: 'Course ID',
        variable_name: 'published_course_id',
        value: metadata.publishedCourseId,
      },
      {
        display_name: 'Tier Name',
        variable_name: 'tier_name',
        value: metadata.tierName ?? 'N/A',
      },
      {
        display_name: 'Payment Frequency',
        variable_name: 'payment_frequency',
        value: metadata.paymentFrequency,
      },
      {
        display_name: 'Promo Applied',
        variable_name: 'is_promotional',
        value: metadata.isPromotional ? 'Yes' : 'No',
      },
      {
        display_name: 'Effective Price',
        variable_name: 'effective_price',
        value: metadata.effectivePrice.toString(),
      },
    ],
  };
}
