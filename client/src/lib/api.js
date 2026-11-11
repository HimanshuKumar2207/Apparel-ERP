import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
export const api = axios.create({ baseURL, withCredentials: true });

// The access token lives only in memory (never localStorage) so XSS cannot steal a long-lived credential.
let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;

let onAuthFailure = () => {};
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

// One refresh at a time, shared by every request that needs it.
let refreshing = null;
export function refreshSession() {
  if (!refreshing) {
    refreshing = axios
      .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
      .then((r) => { setAccessToken(r.data.accessToken); return r.data; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = config?.url?.startsWith('/auth/');
    if (response?.status === 401 && config && !config._retry && !isAuthCall) {
      config._retry = true;
      try {
        await refreshSession();
        config.headers.Authorization = `Bearer ${getAccessToken()}`;
        return api(config);
      } catch {
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
export const fieldErrors = (e) => {
  const out = {};
  for (const it of e?.response?.data?.errors || []) if (it.path) out[it.path] = it.message;
  return out;
};
