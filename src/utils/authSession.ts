import { getReturnUrlFromSearch, resolvePostLoginPath } from './authRedirect';

export const clearAuthStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivity');
};

export const persistAuthStorage = (
  user: unknown,
  accessToken: string,
  refreshToken?: string | null
) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('user', JSON.stringify(user));
};

/** Resolve where to send the user after a successful login. */
export const getPostLoginPath = (
  user: { groups?: { name: string }[] } | null,
  search: string,
  fallback: string
): string => {
  const returnUrl = getReturnUrlFromSearch(search);
  if (returnUrl) {
    return resolvePostLoginPath(user, returnUrl);
  }
  return fallback;
};
