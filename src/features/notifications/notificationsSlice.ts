import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { notificationsApi } from '../../api/notificationsApi';
import type { NotificationPreference } from '../../api/notificationsApi';
import type { AppNotification } from '../../types';

// Define the state interface
interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreference[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  preferencesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  preferencesError: string | null;
}

// Initial state
const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  preferences: [],
  status: 'idle',
  error: null,
  preferencesStatus: 'idle',
  preferencesError: null,
};

// Thunk for fetching notifications
export const fetchNotifications = createAsyncThunk<
  AppNotification[],
  { organizationId: string; userId: string },
  { rejectValue: string }
>('notifications/fetchNotifications', async ({ organizationId, userId }, { rejectWithValue }) => {
  try {
    return await notificationsApi.listNotifications(organizationId, userId);
  } catch (error) {
    return rejectWithValue('Failed to fetch notifications');
  }
});

// Thunk for fetching unread count
export const fetchUnreadCount = createAsyncThunk<
  { count: number },
  { organizationId: string; userId: string },
  { rejectValue: string }
>('notifications/fetchUnreadCount', async ({ organizationId, userId }, { rejectWithValue }) => {
  try {
    return await notificationsApi.getUnreadCount(organizationId, userId);
  } catch (error) {
    return rejectWithValue('Failed to fetch unread count');
  }
});

// Thunk for marking notification as read
export const markNotificationRead = createAsyncThunk<
  AppNotification,
  { organizationId: string; userId: string; notificationId: string },
  { rejectValue: string }
>('notifications/markNotificationRead', async ({ organizationId, userId, notificationId }, { rejectWithValue }) => {
  try {
    return await notificationsApi.markNotificationRead(organizationId, userId, notificationId);
  } catch (error) {
    return rejectWithValue('Failed to mark notification as read');
  }
});

// Thunk for marking all notifications as read
export const markAllNotificationsRead = createAsyncThunk<
  { count: number },
  { organizationId: string; userId: string },
  { rejectValue: string }
>('notifications/markAllNotificationsRead', async ({ organizationId, userId }, { rejectWithValue }) => {
  try {
    return await notificationsApi.markAllNotificationsRead(organizationId, userId);
  } catch (error) {
    return rejectWithValue('Failed to mark all notifications as read');
  }
});

// Thunk for fetching notification preferences
export const fetchNotificationPreferences = createAsyncThunk<
  NotificationPreference[],
  { organizationId: string; userId: string },
  { rejectValue: string }
>('notifications/fetchNotificationPreferences', async ({ organizationId, userId }, { rejectWithValue }) => {
  try {
    return await notificationsApi.getNotificationPreferences(organizationId, userId);
  } catch (error) {
    return rejectWithValue('Failed to fetch notification preferences');
  }
});

// Thunk for updating notification preference
export const updateNotificationPreference = createAsyncThunk<
  NotificationPreference,
  { organizationId: string; userId: string; notificationType: string; preferences: any },
  { rejectValue: string }
>('notifications/updateNotificationPreference', async ({ organizationId, userId, notificationType, preferences }, { rejectWithValue }) => {
  try {
    return await notificationsApi.updateNotificationPreference(organizationId, userId, notificationType, preferences);
  } catch (error) {
    return rejectWithValue('Failed to update notification preference');
  }
});

// Notifications slice
export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPreferencesError: (state) => {
      state.preferencesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch notifications';
      })

      // Fetch unread count
      .addCase(fetchUnreadCount.pending, (state) => {
        // Don't change status for unread count to avoid interference with main notifications status
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        // Don't set error status for unread count to avoid interfering with main status
        // Just keep the current count (will be 0 if never successfully fetched)
      })

      // Mark notification as read
      .addCase(markNotificationRead.pending, (state) => {
        // Loading state handled by UI if needed
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        // Update the notification in the list
        const index = state.items.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          // Update unread count if needed
          if (!action.payload.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        // Error handled by UI if needed
      })

      // Mark all notifications as read
      .addCase(markAllNotificationsRead.pending, (state) => {
        // Loading state handled by UI if needed
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        // Mark all notifications as read
        state.items = state.items.map(notification => ({
          ...notification,
          read: true
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        // Error handled by UI if needed
      })

      // Fetch notification preferences
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.preferencesStatus = 'loading';
        state.preferencesError = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferencesStatus = 'succeeded';
        state.preferences = action.payload;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.preferencesStatus = 'failed';
        state.preferencesError = action.payload || 'Failed to fetch notification preferences';
      })

      // Update notification preference
      .addCase(updateNotificationPreference.pending, (state) => {
        // Loading state handled by UI if needed
      })
      .addCase(updateNotificationPreference.fulfilled, (state, action) => {
        // Update the preference in the list
        const index = state.preferences.findIndex(p => p.notificationType === action.payload.notificationType);
        if (index !== -1) {
          state.preferences[index] = action.payload;
        } else {
          // Add new preference if it doesn't exist
          state.preferences.push(action.payload);
        }
      })
      .addCase(updateNotificationPreference.rejected, (state, action) => {
        // Error handled by UI if needed
      });
  },
});

// Action creators
export const {
  clearError,
  clearPreferencesError
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectNotificationsStatus = (state: RootState) => state.notifications.status;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectNotificationPreferences = (state: RootState) => state.notifications.preferences;
export const selectPreferencesStatus = (state: RootState) => state.notifications.preferencesStatus;
export const selectPreferencesError = (state: RootState) => state.notifications.preferencesError;

export default notificationsSlice.reducer;