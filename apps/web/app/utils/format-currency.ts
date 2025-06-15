export const formatCurrency = (amount: number, type: string = 'KES'): string => {
  const currencyMap: Record<string, string> = {
    USD: 'USD',
    KES: 'KES',
  };

  const currency = currencyMap[type.toUpperCase()] || 'KES';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};
