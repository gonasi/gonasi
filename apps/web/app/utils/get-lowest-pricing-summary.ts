interface PricingTier {
  id: string;
  is_active: boolean;
  course_id: string;
  payment_frequency: 'monthly' | 'bi_monthly' | 'quarterly' | 'semi_annual' | 'annual';
  is_free: boolean;
  price: number;
  currency_code: string;
  promotional_price: number | null;
  promotion_start_date: string | null;
  promotion_end_date: string | null;
  tier_name: string | null;
  tier_description: string | null;
  position: number;
  is_popular: boolean;
  is_recommended: boolean;
}

const FREQUENCY_ORDER: Record<PricingTier['payment_frequency'], number> = {
  monthly: 1,
  bi_monthly: 2,
  quarterly: 3,
  semi_annual: 4,
  annual: 5,
};

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  KES: 130, // 1 USD = 130 KES
};

function convertToBaseCurrency(price: number, currencyCode: string): number {
  const rate = EXCHANGE_RATES[currencyCode];
  if (!rate) {
    throw new Error(`Unsupported currency: ${currencyCode}`);
  }
  return price / rate; // Convert to USD as base currency
}

export function getLowestPricingSummary(tiers: PricingTier[]): string | null {
  if (!tiers.length) return null;

  const activeTiers = tiers.filter((t) => t.is_active);
  if (!activeTiers.length) return null;

  const sorted = activeTiers.sort((a, b) => {
    // Handle free tiers first
    if (a.is_free && b.is_free) {
      return FREQUENCY_ORDER[a.payment_frequency] - FREQUENCY_ORDER[b.payment_frequency];
    }
    if (a.is_free) return -1;
    if (b.is_free) return 1;

    // Convert prices to base currency (USD) for comparison
    const aPrice = a.promotional_price ?? a.price;
    const bPrice = b.promotional_price ?? b.price;

    const aPriceInUSD = convertToBaseCurrency(aPrice, a.currency_code);
    const bPriceInUSD = convertToBaseCurrency(bPrice, b.currency_code);

    if (aPriceInUSD === bPriceInUSD) {
      return FREQUENCY_ORDER[a.payment_frequency] - FREQUENCY_ORDER[b.payment_frequency];
    }

    return aPriceInUSD - bPriceInUSD;
  });

  const best = sorted[0];
  if (!best) return null;

  if (best.is_free) {
    return `Free per ${frequencyToLabel(best.payment_frequency)}`;
  }

  const price = best.promotional_price ?? best.price;
  const formattedPrice = formatCurrency(price, best.currency_code);
  return `${formattedPrice} per ${frequencyToLabel(best.payment_frequency)}`;
}

function formatCurrency(amount: number, currencyCode: string): string {
  switch (currencyCode) {
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'KES':
      return `KES ${amount.toFixed(2)}`;
    default:
      return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function frequencyToLabel(frequency: PricingTier['payment_frequency']): string {
  switch (frequency) {
    case 'monthly':
      return 'month';
    case 'bi_monthly':
      return '2 months';
    case 'quarterly':
      return 'quarter';
    case 'semi_annual':
      return '6 months';
    case 'annual':
      return 'year';
    default:
      return frequency;
  }
}

// Helper function to get the best tier for display purposes
export function getBestPricingTier(tiers: PricingTier[]): PricingTier | null {
  if (!tiers.length) return null;

  const activeTiers = tiers.filter((t) => t.is_active);
  if (!activeTiers.length) return null;

  const sorted = activeTiers.sort((a, b) => {
    if (a.is_free && b.is_free) {
      return FREQUENCY_ORDER[a.payment_frequency] - FREQUENCY_ORDER[b.payment_frequency];
    }
    if (a.is_free) return -1;
    if (b.is_free) return 1;

    const aPrice = a.promotional_price ?? a.price;
    const bPrice = b.promotional_price ?? b.price;

    const aPriceInUSD = convertToBaseCurrency(aPrice, a.currency_code);
    const bPriceInUSD = convertToBaseCurrency(bPrice, b.currency_code);

    if (aPriceInUSD === bPriceInUSD) {
      return FREQUENCY_ORDER[a.payment_frequency] - FREQUENCY_ORDER[b.payment_frequency];
    }

    return aPriceInUSD - bPriceInUSD;
  });

  return sorted[0] || null;
}
