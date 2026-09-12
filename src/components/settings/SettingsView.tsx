import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Layers,
  Key,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  FileCheck2,
  Lock
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { UserRole } from '../../types';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchCurrentOrganization } from '../../features/organizations/organizationsSlice';
import {
  fetchMemberships,
  createInvitation,
  updateMemberRole,
  deleteMembership,
  transferMembershipOwnership,
} from '../../features/memberships/membershipsSlice';
import type { Membership } from '../../api/membershipsTypes';

interface SettingsViewProps {
  navigate: (route: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ navigate }) => {
  const { currentOrg, currentUser, updateOrganization } = useAccounting();
  const dispatch = useAppDispatch();
  const { currentStatus, error: orgError } = useAppSelector((state) => state.organizations);
  const membershipsState = useAppSelector((state) => state.memberships);
  const memberships = membershipsState.list;

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'coa' | 'integrations'>('profile');

  // Org Profile State
  const [name, setName] = useState(currentOrg?.name || '');
  const [tradeName, setTradeName] = useState(currentOrg?.tradeName || '');
  const [gstin, setGstin] = useState(currentOrg?.gstin || '');
  const [pan, setPan] = useState(currentOrg?.pan || '');
  const [address, setAddress] = useState(currentOrg?.address || '');
  const [city, setCity] = useState(currentOrg?.city || '');
  const [state, setState] = useState(currentOrg?.state || '');
  const [pincode, setPincode] = useState(currentOrg?.pincode || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load the backend's authoritative copy of the current organization
  // whenever the profile tab is opened.
  useEffect(() => {
    if (activeTab === 'profile' && currentStatus === 'idle') {
      void dispatch(fetchCurrentOrganization());
    }
  }, [activeTab, currentStatus, dispatch]);

  useEffect(() => {
    if (currentStatus === 'succeeded' && currentOrg) {
      setName((prev) => prev || currentOrg.name);
      setGstin((prev) => prev || currentOrg.gstin);
    }
  }, [currentStatus, currentOrg]);

  // Invite user state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Accountant');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);

  // Team roster comes from GET /memberships. Role UUIDs are learned from the
  // roster itself (each membership carries its role id + name), the only role
  // source the existing frontend API layer exposes.
  useEffect(() => {
    if (activeTab === 'users' && membershipsState.listStatus === 'idle') {
      void dispatch(fetchMemberships());
    }
  }, [activeTab, membershipsState.listStatus, dispatch]);

  const roleIdFor = (uiRole: UserRole): string | undefined =>
    memberships.find((m) => m.role?.name?.toUpperCase() === uiRole.toUpperCase())?.role?.id;

  const roleOptions = Array.from(
    new Map(memberships.map((m) => [m.role?.name ?? '', m.role])).values(),
  ).filter((r): r is NonNullable<Membership['role']> => r != null && r.name.toUpperCase() !== 'OWNER');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOrg && !isSubmittingProfile) {
      setIsSubmittingProfile(true);
      setProfileError(null);
      try {
        updateOrganization(currentOrg.id, {
          name,
          tradeName,
          gstin,
          pan,
          address,
          city,
          state,
          pincode,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } catch {
        setProfileError('Unable to update the organization profile. Please try again.');
      } finally {
        setIsSubmittingProfile(false);
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !currentOrg) return;
    const roleId = roleIdFor(inviteRole);
    if (!roleId) {
      setInviteError(
        `No "${inviteRole}" role is available in this organization yet. Available roles: ${
          roleOptions.map((r) => r.name).join(', ') || 'none loaded'
        }.`,
      );
      return;
    }
    setInviteError(null);
    setMemberBusyId('invite');
    try {
      await dispatch(createInvitation({ email: inviteEmail.trim(), roleId })).unwrap();
      setIsInviteModalOpen(false);
      setInviteEmail('');
      void dispatch(fetchMemberships());
    } catch (err: any) {
      setInviteError(err?.message || 'Failed to send invitation.');
    } finally {
      setMemberBusyId(null);
    }
  };

  const handleRoleChange = async (membership: Membership, newRoleName: string) => {
    if (!membership.role || membership.role.name === newRoleName) return;
    const targetRoleId = memberships.find((m) => m.role?.name === newRoleName)?.role?.id;
    if (!targetRoleId) return;
    setMemberBusyId(membership.id);
    try {
      await dispatch(
        updateMemberRole({ id: membership.id, payload: { roleId: targetRoleId } }),
      ).unwrap();
      void dispatch(fetchMemberships());
    } catch (err: any) {
      window.alert(err?.message || 'Failed to update member role.');
    } finally {
      setMemberBusyId(null);
    }
  };

  const handleRemoveMember = async (membership: Membership) => {
    if (!window.confirm('Remove this member from the organization?')) return;
    setMemberBusyId(membership.id);
    try {
      await dispatch(deleteMembership({ id: membership.id })).unwrap();
      void dispatch(fetchMemberships());
    } catch (err: any) {
      window.alert(err?.message || 'Failed to remove member.');
    } finally {
      setMemberBusyId(null);
    }
  };

  const handleTransferOwnership = async (membership: Membership) => {
    if (
      !window.confirm(
        'Transfer organization ownership to this member? You will lose OWNER privileges.',
      )
    )
      return;
    setMemberBusyId(membership.id);
    try {
      await dispatch(transferMembershipOwnership({ id: membership.id })).unwrap();
      void dispatch(fetchMemberships());
    } catch (err: any) {
      window.alert(err?.message || 'Failed to transfer ownership.');
    } finally {
      setMemberBusyId(null);
    }
  };

  // Sample standard Chart of Accounts
  const chartOfAccounts = [
    { code: '1000', name: 'Current Assets', type: 'Asset', items: ['Cash on Hand', 'HDFC Bank #0060', 'ICICI Bank Operating', 'Trade Debtors (Receivables)', 'Input Tax Credit (GST Asset)'] },
    { code: '1500', name: 'Fixed Assets', type: 'Asset', items: ['Plant & Machinery', 'Computer Hardware & Office Tech', 'Furniture & Fixtures'] },
    { code: '2000', name: 'Current Liabilities', type: 'Liability', items: ['Trade Creditors (Payables)', 'Output GST Liability (CGST/SGST/IGST)', 'TDS Payable', 'Salaries Payable'] },
    { code: '3000', name: 'Shareholders Equity', type: 'Equity', items: ['Paid-up Capital', 'Retained Earnings / General Reserves'] },
    { code: '4000', name: 'Direct & Indirect Income', type: 'Income', items: ['Domestic Product Sales', 'Consulting & Engineering Fees', 'Interest on Fixed Deposits'] },
    { code: '5000', name: 'Operating Expenditures', type: 'Expense', items: ['Raw Material Purchases (COGS)', 'Salaries & Wages', 'Rent & Facilities', 'Electricity & Utilities', 'Professional & Legal Fees', 'Freight & Forwarding'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Organization Settings & Tenant Administration
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Configure {currentOrg?.name}, statutory identifiers, RBAC permissions, and chart of accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-2.5 py-1.5 rounded-xs border border-neutral-200">
            Tenant ID: {currentOrg?.id}
          </span>
          <button
            onClick={() => navigate('/new-business')}
            id="settings-add-business-btn"
            className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus size={13} />
            <span>Add New Business</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xs p-4">
        <div className="flex items-center gap-1 border-b border-slate-200 pb-3 overflow-x-auto">
          {[
            { id: 'profile', label: 'Organization Profile' },
            { id: 'users', label: 'Team & RBAC Roles' },
            { id: 'coa', label: 'Chart of Accounts' },
            { id: 'integrations', label: 'Banking & GST APIs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono rounded-xs transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Organization Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="pt-6 max-w-2xl space-y-4 text-xs">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Organization master parameters updated successfully.</span>
              </div>
            )}

            {(profileError || (activeTab === 'profile' && currentStatus === 'failed' && orgError)) && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" />
                <span>{profileError || orgError?.message}</span>
              </div>
            )}

            {currentStatus === 'loading' && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xs flex items-center gap-2 font-mono text-xs">
                <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading organization details from the server...</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono uppercase focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  GSTIN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono uppercase focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  PAN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono uppercase focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Registered Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xs transition-colors flex items-center gap-2"
              >
                {isSubmittingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating Master Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Update Master Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Users & Roles */}
        {activeTab === 'users' && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tenant Users & Access Privileges
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Role-based access control (RBAC): Owner, Admin, Accountant, Viewer
                </p>
              </div>

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} />
                <span>Invite Team Member</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xs overflow-hidden">
              {membershipsState.listStatus === 'loading' && memberships.length === 0 && (
                <div className="px-4 py-8 text-center text-xs font-mono text-slate-500">
                  Loading team members from server…
                </div>
              )}
              {membershipsState.listStatus === 'failed' && membershipsState.error && (
                <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between">
                  <span>{membershipsState.error.message}</span>
                  <button
                    onClick={() => dispatch(fetchMemberships())}
                    className="font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              <table className="w-full swiss-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.length === 0 &&
                    membershipsState.listStatus !== 'loading' && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs font-mono text-slate-400">
                          No members found. Invite a team member below.
                        </td>
                      </tr>
                    )}
                  {memberships.map((m) => (
                    <tr key={m.id}>
                      <td className="text-xs font-mono text-slate-600">{m.user_id}</td>
                      <td>
                        {m.role?.name === 'OWNER' ? (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-slate-900 text-white rounded-xs">
                            OWNER
                          </span>
                        ) : (
                          <select
                            value={m.role?.name ?? ''}
                            onChange={(e) => void handleRoleChange(m, e.target.value)}
                            disabled={memberBusyId === m.id}
                            className="px-2 py-1 text-[10px] font-mono border border-slate-300 rounded-xs bg-white disabled:opacity-50"
                          >
                            <option value={m.role?.name ?? ''}>{m.role?.name ?? 'Unknown'}</option>
                            {roleOptions
                              .filter((r) => r.name !== m.role?.name)
                              .map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs font-semibold bg-emerald-100 text-emerald-900">
                          {m.status}
                        </span>
                      </td>
                      <td className="text-xs font-mono text-slate-500">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {m.role?.name !== 'OWNER' && (
                          <>
                            <button
                              onClick={() => void handleTransferOwnership(m)}
                              disabled={memberBusyId === m.id}
                              className="text-[11px] font-semibold text-slate-900 hover:underline disabled:opacity-50 mr-3"
                            >
                              Make Owner
                            </button>
                            <button
                              onClick={() => void handleRemoveMember(m)}
                              disabled={memberBusyId === m.id}
                              className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Chart of Accounts */}
        {activeTab === 'coa' && (
          <div className="pt-6 space-y-6 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Standard Chart of Accounts (Tally & Schedule III compliant)
                </h3>
                <p className="text-slate-500 font-mono text-[11px]">
                  Hierarchical double-entry ledger grouping
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {chartOfAccounts.map((grp) => (
                <div key={grp.code} className="border border-slate-200 rounded-xs overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{grp.code} — {grp.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-300 rounded-xs font-semibold text-slate-700">
                      {grp.type}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                    {grp.items.map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-50/50 border border-slate-100 rounded-xs text-slate-800">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Banking & GST APIs */}
        {activeTab === 'integrations' && (
          <div className="pt-6 space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Connected Financial APIs & Webhooks
              </h3>
              <p className="text-slate-500 font-mono text-[11px]">
                Real-time statutory portal connections and banking protocol feeds
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-xs bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">GSTN e-Invoice & e-Way Bill API</div>
                  <div className="text-[11px] text-slate-500 mt-1">Direct GST portal return filing & 2B statement sync</div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={12} />
                    <span>Connected (GSP Token Active)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xs bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">HDFC Corporate Banking Feed API</div>
                  <div className="text-[11px] text-slate-500 mt-1">Direct ISO 20022 statement ingestion & automated reconciliation</div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={12} />
                    <span>Connected (Daily Sync)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xs shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-950">
              Invite Team Member to Organization
            </h3>

            <form onSubmit={handleInvite} className="space-y-3">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xs">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="venkat@ca-audit.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900 bg-white font-mono"
                >
                  <option value="Accountant">Accountant (Vouchers, Ledger & GST filing)</option>
                  <option value="Admin">Admin (Full settings, users & accounts)</option>
                  <option value="Viewer">Viewer (Read-only reports access)</option>
                </select>
                <p className="mt-1 text-[10px] text-slate-400 font-mono">
                  Sends a real invitation via POST /memberships/invitations. The member appears
                  here after they accept.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberBusyId === 'invite'}
                  className="px-4 py-2 bg-slate-950 text-white rounded-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {memberBusyId === 'invite' ? 'Sending…' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
