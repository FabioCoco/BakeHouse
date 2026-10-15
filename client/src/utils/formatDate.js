const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

export const formatDateTime = (iso) => (iso ? formatter.format(new Date(iso)) : '');
export const formatDate = (iso) => (iso ? dateOnly.format(new Date(iso)) : '');
