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
    hour12: false,
  }).format(value);
}
