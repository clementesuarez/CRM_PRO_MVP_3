/**
 * Utility functions for consistent currency formatting across the CRM.
 * Rule: If currency is USD, DO NOT include the '$' symbol (display as 'USD 48.000').
 * If currency is ARS, display with '$' (e.g. '$ 48.000 ARS' or '$ 48.000').
 */

export const formatCurrency = (amount: number | string, moneda: 'USD' | 'ARS' = 'USD'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  const formattedNum = Math.round(num).toLocaleString('es-AR');
  
  if (moneda === 'USD') {
    return `USD ${formattedNum}`;
  }
  return `$ ${formattedNum} ARS`;
};

export const getCurrencyBadgeLabel = (moneda: 'USD' | 'ARS' = 'USD'): string => {
  if (moneda === 'USD') {
    return 'USD';
  }
  return '$ ARS';
};
