export const errorText = (error, fallback) =>
  error?.code === 'permission-denied' ? 'You do not have permission to do that.' : error?.message || fallback
