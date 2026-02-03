import { useCallback, useMemo } from 'react';

import type { ValidationField } from '../ValidationSection';

interface UsePricingFieldsProps {
  rootRoute: string;
  pricingData?: any[];
  validationErrors?: string[];
}

export function usePricingFields({
  rootRoute,
  pricingData,
  validationErrors,
}: UsePricingFieldsProps) {
  const errorSet = useMemo(() => {
    return validationErrors ? new Set(validationErrors) : null;
  }, [validationErrors]);

  const createTierFields = useCallback(
    (pricingTier: any): ValidationField[] => {
      return [
        {
          name: `pricingData.${pricingTier.id}.payment_frequency`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.price`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.currency_code`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.is_free`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.is_active`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.position`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
      ];
    },
    [rootRoute],
  );

  const fields = useMemo((): ValidationField[] => {
    if (errorSet === null) {
      // No error filtering - return all fields
      const basePricingFields: ValidationField[] = [
        {
          name: 'pricingData',
          fix: `${rootRoute}/pricing`,
        },
      ];

      const pricingTierFields = pricingData?.flatMap(createTierFields) ?? [];
      return [...basePricingFields, ...pricingTierFields];
    }

    if (!errorSet || errorSet.size === 0) {
      return [];
    }

    const result: ValidationField[] = [];

    // Check base pricing field
    if (errorSet.has('pricingData')) {
      result.push({
        name: 'pricingData',
        fix: `${rootRoute}/pricing`,
      });
    }

    // Process pricing tiers efficiently
    if (pricingData) {
      for (const pricingTier of pricingData) {
        const tierFields = createTierFields(pricingTier);
        for (const field of tierFields) {
          if (errorSet.has(field.name)) {
            result.push(field);
          }
        }
      }
    }

    return result;
  }, [rootRoute, pricingData, errorSet, createTierFields]);

  return { fields };
}
