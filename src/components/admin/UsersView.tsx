import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchAllUsers,
  selectAllUsers,
  selectUsersStatus,
  selectUsersError
} from '../../features/admin/adminSlice';
import { UserProfile } from '../../api/types';
import {
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  AlertTriangle,
  Mail,
  MapPin
} from 'lucide-react';

interface UsersViewProps {
  navigate: (route: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ navigate }) => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAllUsers);
  const status = useAppSelector(selectUsersStatus);
  const error = useAppSelector(selectUsersError);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchAllUsers());
    }
  }, [dispatch, status]);

  const handleRefresh = () => {
    setRefreshing(true);
    void dispatch(fetchAllUsers()).finally(() => setRefreshing(false));
  };

  if (status === 'loading' && users.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 size={24} className="mr-3" />
        <span>Loading users...</span>
      </div>
    );
  }

  if (status === 'failed' && error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={20} className="mr-3 h-5 w-5 text-red-500" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Failed to load users</h3>
          <p className="text-xs text-red-600">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <Loader2 size={16} className="mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-lg">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Platform Users
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Manage all users across the platform
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-3 py-1.5 text-xs font-mono rounded-xs transition-colors whitespace-nowrap ${
              refreshing ? 'opacity-50' : ''
            }`}
          >
            {refreshing ? (
              <>
                <Loader2 size={16} className="mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <Loader2 size={16} />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="px-6 py-8 text-center text-xs font-mono text-slate-400">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="px-6 py-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0 flex-sm-col items-sm-start">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-slate-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 truncate max-w-xs">
                        {user.display_name || user.first_name || user.last_name || 'Unnamed User'}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        ID: {user.id.substring(0, 8)}...
                      </p>
                      {(user as UserProfile & { email?: string }).email && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {(user as UserProfile & { email?: string }).email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex-sm-row items-sm-center space-sm-x-3 space-sm-y-2 text-xs">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs bg-slate-50">
                      {user.platform_role || 'User'}
                    </span>
                    {user.phone && (
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs bg-slate-50 ml-2">
                        {user.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span>Actions:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/user/${user.id}`)}
                        className="px-2 py-1 text-[10px] font-mono border border-slate-300 rounded-xs bg-white hover:bg-slate-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};