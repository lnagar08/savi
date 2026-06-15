// utils/formatters.ts
export const includeCurrency = (value: number | string, currency = 'GBP') => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2,
  }).format(numericValue || 0);
};
