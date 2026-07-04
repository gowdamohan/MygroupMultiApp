/**
 * Role-aware login redirects and returnUrl handling for protected routes.
 */

const PUBLIC_PATH_PREFIXES = [
  '/',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/',
  '/admin/login',
  '/client-login/',
  '/media-login/',
  '/god-login/',
  '/reporter/login',
  '/register-form/',
  '/mobile/',
  '/partner/register',
];

/** Exact paths that are public (partner login landing). */
const PUBLIC_EXACT_PATHS = new Set(['/partner']);

export const isPublicPath = (pathname: string): boolean => {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => {
    if (prefix === '/') return pathname === '/';
    return pathname === prefix || pathname.startsWith(prefix);
  });
};

/**
 * Pick the login screen for a protected path the user tried to open.
 */
export const getLoginPathForRoute = (pathname: string): string => {
  if (pathname.startsWith('/partner/') && pathname !== '/partner/register') {
    return '/partner';
  }
  if (pathname.startsWith('/app/')) {
    return '/admin/login';
  }
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard/admin')
  ) {
    return '/auth/admin';
  }
  if (pathname.startsWith('/corporate') || pathname.startsWith('/dashboard/corporate')) {
    return '/auth/login';
  }
  if (pathname.startsWith('/franchise') || pathname.startsWith('/dashboard/franchise')) {
    return '/auth/login';
  }
  if (pathname.startsWith('/client') || pathname.startsWith('/dashboard/client')) {
    return '/auth/login';
  }
  if (pathname.startsWith('/labor') || pathname.startsWith('/dashboard/labor')) {
    return '/auth/login';
  }
  if (pathname.startsWith('/media/dashboard')) {
    return '/partner';
  }
  if (pathname.startsWith('/media') || pathname.startsWith('/dashboard/media')) {
    return '/auth/login';
  }
  if (pathname.startsWith('/dashboard/partner')) {
    return '/partner';
  }
  if (pathname.startsWith('/mobile/')) {
    return '/';
  }
  return '/auth/login';
};

export const buildLoginRedirectUrl = (pathname: string, search = ''): string => {
  const loginPath = getLoginPathForRoute(pathname);
  const returnUrl = `${pathname}${search}`;
  const params = new URLSearchParams();
  if (returnUrl && returnUrl !== '/' && !isPublicPath(pathname)) {
    params.set('returnUrl', returnUrl);
  }
  const qs = params.toString();
  return qs ? `${loginPath}?${qs}` : loginPath;
};

export const getReturnUrlFromSearch = (search: string): string | null => {
  const raw = new URLSearchParams(search).get('returnUrl');
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
    if (isPublicPath(decoded.split('?')[0])) return null;
    return decoded;
  } catch {
    return null;
  }
};

/** Full-page redirect after session expiry (api interceptor). */
export const redirectToLoginForPath = (pathname?: string, search = '') => {
  if (typeof window === 'undefined') return;
  const path = pathname || window.location.pathname;
  if (isPublicPath(path)) return;
  window.location.href = buildLoginRedirectUrl(path, search || window.location.search);
};

export const getUserRoles = (user: { groups?: { name: string }[] } | null): string[] => {
  if (!user?.groups) return [];
  return user.groups.map((g) => g.name);
};

export const userHasAnyRole = (
  user: { groups?: { name: string }[] } | null,
  allowedRoles: string[]
): boolean => {
  if (!allowedRoles.length) return true;
  const roles = getUserRoles(user);
  return roles.some((r) => allowedRoles.includes(r));
};

/** Default dashboard when no valid returnUrl. */
export const getDefaultDashboardPath = (user: { groups?: { name: string }[] } | null): string => {
  const roles = getUserRoles(user);
  if (roles.includes('admin') || roles.includes('groups')) return '/dashboard/admin';
  if (roles.includes('corporate')) return '/dashboard/corporate';
  if (roles.includes('head_office') || roles.includes('regional') || roles.includes('branch')) {
    return '/dashboard/franchise';
  }
  if (roles.includes('labor')) return '/dashboard/labor';
  if (roles.includes('partner')) return '/dashboard/partner';
  if (roles.includes('reporter')) return '/dashboard/reporter';
  if (roles.includes('client') || roles.includes('client_god')) return '/dashboard/client';
  return '/dashboard';
};

const PATH_ROLE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/dashboard/admin', roles: ['admin', 'groups', 'corporate', 'head_office', 'regional', 'branch'] },
  { prefix: '/admin', roles: ['admin', 'groups', 'corporate', 'head_office', 'regional', 'branch'] },
  { prefix: '/dashboard/corporate', roles: ['corporate'] },
  { prefix: '/corporate', roles: ['corporate'] },
  { prefix: '/dashboard/franchise', roles: ['head_office', 'regional', 'branch'] },
  { prefix: '/franchise', roles: ['head_office', 'regional', 'branch'] },
  { prefix: '/dashboard/labor', roles: ['labor'] },
  { prefix: '/labor', roles: ['labor'] },
  { prefix: '/dashboard/partner', roles: ['partner'] },
  { prefix: '/partner/', roles: ['partner'] },
  { prefix: '/dashboard/client', roles: ['client', 'client_god'] },
  { prefix: '/client', roles: ['client', 'client_god'] },
  { prefix: '/dashboard/media', roles: ['client', 'client_god', 'media'] },
  { prefix: '/media/dashboard', roles: ['partner', 'client', 'client_god', 'media'] },
  { prefix: '/media', roles: ['client', 'client_god', 'media'] },
  { prefix: '/dashboard/reporter', roles: ['reporter'] },
  { prefix: '/app/', roles: ['admin', 'groups'] },
];

export const getRequiredRolesForPath = (pathname: string): string[] | null => {
  const rule = PATH_ROLE_RULES.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix)
  );
  return rule ? rule.roles : null;
};

export const canUserAccessPath = (
  user: { groups?: { name: string }[] } | null,
  pathname: string
): boolean => {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return true;
  return userHasAnyRole(user, required);
};

export const resolvePostLoginPath = (
  user: { groups?: { name: string }[] } | null,
  returnUrl: string | null
): string => {
  if (returnUrl) {
    const pathOnly = returnUrl.split('?')[0];
    if (canUserAccessPath(user, pathOnly)) {
      return returnUrl;
    }
  }
  return getDefaultDashboardPath(user);
};
