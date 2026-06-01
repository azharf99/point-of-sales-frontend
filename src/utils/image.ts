export const getProductImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  const baseURL = apiURL.replace(/\/api(\/v1)?$/, '');
  return `${baseURL}${url}`;
};
