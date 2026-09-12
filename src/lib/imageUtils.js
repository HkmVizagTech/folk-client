export const getSafeProfileImage = (url, name) => {
  if (!url) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'D')}&backgroundColor=ff9933&textColor=ffffff`;
  }
  return url;
};
