const formatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });

export const formatDateTime = (iso) => (iso ? formatter.format(new Date(iso)) : '');
export const formatDate = (iso) => (iso ? dateOnly.format(new Date(iso)) : '');
