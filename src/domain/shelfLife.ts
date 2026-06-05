export function calculateExpiry(openedAt: Date, daysToExpire: number, hoursToExpire: number) {
  const expiresAt = new Date(openedAt);
  expiresAt.setDate(expiresAt.getDate() + daysToExpire);
  expiresAt.setHours(expiresAt.getHours() + hoursToExpire);
  return expiresAt;
}

export function formatLabelDate(value: Date) {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(value).replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase());
}

export function formatLabelTime(value: Date) {
  return new Intl.DateTimeFormat('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(value).replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase());
}

export function formatLabelDateOnly(value: Date) {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export function formatLabelDateCompact(value: Date) {
  return formatLabelDateOnly(value).toUpperCase();
}

export function formatLabelDateNumeric(value: Date) {
  const day = value.getDate().toString().padStart(2, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const year = value.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

export function formatLabelDateShort(value: Date) {
  const day = value.getDate().toString().padStart(2, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

export function formatLabelTimeCompact(value: Date) {
  return formatLabelTime(value).replace(/\s+/g, '');
}

export function formatLabelTimeCompactNoPeriod(value: Date) {
  return formatLabelTime(value).replace(/\s*(AM|PM)\b/i, '');
}

export function formatLabelTimeNumeric(value: Date) {
  const hour = value.getHours().toString().padStart(2, '0');
  const minute = value.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}
