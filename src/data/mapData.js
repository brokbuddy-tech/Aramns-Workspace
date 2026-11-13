// Currency display options used by the map explorer.

export const CURRENCY_OPTIONS = [
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.6725, flag: '🇦🇪' },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 3.75, flag: '🇸🇦' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 84.15, flag: '🇮🇳' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.89, flag: '🇨🇭' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.38, flag: '🇨🇦' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', rate: 1.52, flag: '🇦🇺' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', rate: 1.32, flag: '🇸🇬' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', rate: 3.64, flag: '🇶🇦' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, flag: '🇨🇳' }
];

export const formatPriceShort = (price, isRent = false, currencyCode = 'AED') => {
  const curr = CURRENCY_OPTIONS.find(c => c.code === currencyCode) || CURRENCY_OPTIONS[0];
  const converted = price * curr.rate;
  const prefix = curr.code === 'USD' 
    ? '$' 
    : curr.code === 'EUR' 
      ? '€' 
      : curr.code === 'GBP' 
        ? '£' 
        : curr.code === 'INR' 
          ? '₹' 
          : `${curr.code} `;

  if (isRent) {
    if (curr.code === 'INR') {
      const lakhs = (converted / 100000).toFixed(1).replace(/\.0$/, '');
      return `₹${lakhs}L / year`;
    }
    const thousands = Math.round(converted / 1000);
    return `${prefix}${thousands.toLocaleString()}K / year`;
  }

  if (curr.code === 'INR') {
    const cr = (converted / 10000000).toFixed(1).replace(/\.0$/, '');
    return `₹${cr} Cr`;
  }

  if (converted >= 1000000000) {
    const b = (converted / 1000000000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${b}B`;
  }

  if (converted >= 1000000) {
    const m = (converted / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${m}M`;
  }

  return `${prefix}${Math.round(converted / 1000)}K`;
};
