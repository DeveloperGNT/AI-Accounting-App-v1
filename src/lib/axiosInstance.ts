import axios from 'axios';
import { env } from '../config/env';
import { toApiError } from './apiError';
import { supabase } from './supabaseClient';
import { applyTenantHeader } from './tenantContext';

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

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);