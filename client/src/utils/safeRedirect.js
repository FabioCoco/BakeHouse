// Only allow same-origin relative paths, so a crafted `from` value cannot send the user to another site.
export const safeRedirect = (target) => {
  if (typeof target !== 'string') return '/';
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/login') || target.startsWith('/register')) {
    return '/';
  }
  return target;
};
