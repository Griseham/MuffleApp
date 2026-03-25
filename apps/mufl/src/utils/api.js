import axios from 'axios';

const normalizeBaseUrl = (baseUrl = '') =>
  String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);

export const buildApiUrl = (path = '', baseUrl = API_BASE_URL) => {
  const rawPath = String(path || '');
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return normalizedBaseUrl ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath;
};

export const apiClient = axios.create({
  ...(API_BASE_URL ? { baseURL: API_BASE_URL } : {}),
  timeout: 12000,
});
