import axios from 'axios';
import { env } from '../config/env';
import { toApiError } from './apiError';
import { supabase } from './supabaseClient';
import { applyTenantHeader, getActiveOrganizationId } from './tenantContext';

// Routes that are organization-scoped on the backend. The backend's
// TenantAccessGuard requires a valid x-organization-id header on every one of
// these; sending the request without it can only ever produce a guaranteed
// 400/403. Failing fast here (TENANT_NOT_INITIALIZED) instead of firing a
// doomed request prevents the pre-organization race where slices fire while
// activeOrganizationId is still null. Every organization-scoped thunk also
// gates on the active organization before dispatching.
const ORGANIZATION_SCOPED_METHODS = new Set(['get', 'post', 'patch', 'put', 'delete']);
const TENANT_HEADER_REQUIRED_PATH = /^\/(organizations|gst|ai|files)\//;
const TENANT_HEADER_ALWAYS_REQUIRED_PATHS = [
  '/api/v1/expenses',
  '/api/v1/accounts',
  '/api/v1/invoices',
  '/api/v1/payments',
  '/api/v1/bills',
  '/api/v1/journal-entries',
  '/categories',
  '/customers',
  '/vendors',
  '/products',
  '/memberships',
  '/notifications',
  '/notification-preferences',
];

const requiresTenantHeader = (url: string | undefined): boolean => {
  if (!url) return false;
  // Strip any query string for matching.
  const path = url.split('?')[0];
  if (TENANT_HEADER_REQUIRED_PATH.test(path)) return true;
  return TENANT_HEADER_ALWAYS_REQUIRED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
};

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  applyTenantHeader(config.headers);

  // Never send an organization-scoped request while the tenant is still
  // uninitialized — reject locally with a typed error Redux thunks surface.
  if (
    !getActiveOrganizationId() &&
    ORGANIZATION_SCOPED_METHODS.has((config.method || '').toLowerCase()) &&
    requiresTenantHeader(typeof config.url === 'string' ? config.url : undefined)
  ) {
    return Promise.reject({
      code: 'TENANT_NOT_INITIALIZED',
      message:
        'The active organization is not initialized yet, so this organization-scoped request was not sent.',
    });
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);