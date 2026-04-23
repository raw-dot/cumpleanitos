// Paleta Cumpleanitos (matching mockup)
export const C = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#F3EEFF',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  ink: '#1a1a2e',
  inkSoft: '#4B5563',
  inkMuted: '#9CA3AF',
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#EAEAEA',
  borderSoft: '#F3F4F6',
  success: '#10B981',
  danger: '#EF4444',
};

export const getInitial = (name) => {
  if (!name) return 'U';
  return name.trim()[0].toUpperCase();
};

export const calcDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(dateStr);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
  return diff;
};

export const formatDay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

export const formatCurrency = (amount) => {
  if (!amount) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
};
