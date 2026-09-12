import { useEffect } from 'react';
import {
  clearAuth,
  fetchCurrentUser,
  restoreSession,
  setSessionSummary,
} from '../features/auth/authSlice';
import { clearUserProfile, fetchCurrentUserProfile } from '../features/users/usersSlice';
import {
  clearOrganizations,
  fetchOrganizations,
} from '../features/organizations/organizationsSlice';
import { hasSupabaseConfig } from '../config/env';
import { supabase } from '../lib/supabaseClient';
import { useAppDispatch } from './hooks';

let restoreStarted = false;

export const AuthSessionBootstrap = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      dispatch(clearAuth());
      dispatch(clearUserProfile());
      dispatch(clearOrganizations());
      return undefined;
    }

    let active = true;

    const loadApplicationUser = (session: Parameters<typeof setSessionSummary>[0]) => {
      if (!active) return;
      dispatch(setSessionSummary(session));
      void Promise.all([
        dispatch(fetchCurrentUser()),
        dispatch(fetchCurrentUserProfile()),
        dispatch(fetchOrganizations()),
      ]);
    };

    if (!restoreStarted) {
      restoreStarted = true;
      void dispatch(restoreSession()).then((result) => {
        if (restoreSession.fulfilled.match(result) && result.payload.session) {
          // The session is valid, so retry the backend user hydration if it
          // failed during restore instead of dropping back to the login page.
          if (!result.payload.user) {
            void dispatch(fetchCurrentUser());
          }
          void dispatch(fetchCurrentUserProfile());
          void dispatch(fetchOrganizations());
        }
      });
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Only an explicit sign-out should clear an authenticated Redux state.
      // INITIAL_SESSION may arrive with no session while restoreSession is still resolving.
      if (event === 'SIGNED_OUT') {
        dispatch(clearAuth());
        dispatch(clearUserProfile());
        dispatch(clearOrganizations());
        return;
      }

      if (!session) return;

      const sessionSummary = {
        userId: session.user.id,
        expiresAt: session.expires_at ?? null,
      };

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        loadApplicationUser(sessionSummary);
      } else if (event === 'TOKEN_REFRESHED') {
        dispatch(setSessionSummary(sessionSummary));
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
};