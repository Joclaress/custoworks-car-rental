import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  X,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const AdminUsersTab: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STAFF_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER'>('STAFF_ADMIN');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<AdminUser | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN' as 'ADMIN' | 'STAFF',
    password: '',
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    role: 'ADMIN' as 'ADMIN' | 'STAFF' | 'CUSTOMER',
    isActive: true,
    newPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ users: AdminUser[] }>('/admin/users');
      setUsers(res.users);
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
      setToastError(err?.response?.data?.error || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setToastError(null);
    setToastSuccess(null);

    try {
      const res = await api.post<{ user: AdminUser }>('/admin/users', createForm);
      setToastSuccess(`Admin account created for ${res.user.fullName} (${res.user.email})!`);
      setCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        role: 'ADMIN',
        password: '',
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to create admin user:', err);
      setToastError(err?.response?.data?.error || 'Failed to create user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditModalUser(user);
    setEditForm({
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      newPassword: '',
    });
    setShowPassword(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setActionLoading(true);
    setToastError(null);
    setToastSuccess(null);

    const payload: Record<string, any> = {
      fullName: editForm.fullName,
      phone: editForm.phone,
      role: editForm.role,
      isActive: editForm.isActive,
    };
    if (editForm.newPassword.trim()) {
      payload.password = editForm.newPassword.trim();
    }

    try {
      const res = await api.patch<{ user: AdminUser }>(`/admin/users/${editModalUser.id}`, payload);
      setToastSuccess(`Updated account for ${res.user.fullName}!`);
      setEditModalUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      setToastError(err?.response?.data?.error || 'Failed to update user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalUser) return;
    setActionLoading(true);
    setToastError(null);
    setToastSuccess(null);

    try {
      await api.delete(`/admin/users/${deleteModalUser.id}`);
      setToastSuccess(`Account for ${deleteModalUser.fullName} removed.`);
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setToastError(err?.response?.data?.error || 'Failed to delete user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q));

    if (!matchesSearch) return false;

    if (roleFilter === 'STAFF_ADMIN') {
      return u.role === 'ADMIN' || u.role === 'STAFF';
    }
    if (roleFilter !== 'ALL') {
      return u.role === roleFilter;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastSuccess}</span>
          </div>
          <button onClick={() => setToastSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {toastError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between text-xs text-rose-800 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{toastError}</span>
          </div>
          <button onClick={() => setToastError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin & Staff Accounts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage portal administrators, dispatch staff, reset credentials, and control access permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh accounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Create New Admin / Staff
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-brand-blue focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('STAFF_ADMIN')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              roleFilter === 'STAFF_ADMIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Admins & Staff ({users.filter((u) => u.role === 'ADMIN' || u.role === 'STAFF').length})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              roleFilter === 'ADMIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Admins ({users.filter((u) => u.role === 'ADMIN').length})
          </button>
          <button
            onClick={() => setRoleFilter('STAFF')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              roleFilter === 'STAFF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Staff ({users.filter((u) => u.role === 'STAFF').length})
          </button>
          <button
            onClick={() => setRoleFilter('CUSTOMER')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              roleFilter === 'CUSTOMER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Customers ({users.filter((u) => u.role === 'CUSTOMER').length})
          </button>
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Accounts ({users.length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-blue mb-2" />
            Loading accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No user accounts found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => {
                  const isCurrent = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'STAFF'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{u.fullName}</span>
                              {isCurrent && (
                                <span className="bg-blue-100 text-brand-blue text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px] font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.phone ? (
                          <span className="font-mono text-slate-800">{u.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : u.role === 'STAFF'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role === 'ADMIN' ? (
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                          ) : u.role === 'STAFF' ? (
                            <Shield className="w-3 h-3 text-blue-600" />
                          ) : null}
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                            title="Edit details or change password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={isCurrent}
                            onClick={() => setDeleteModalUser(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? 'You cannot delete your own logged-in account' : 'Delete user account'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-brand-navy to-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Create Admin / Staff Account</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@custoworks.ph"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  placeholder="0995 123 4567"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Portal Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                >
                  <option value="ADMIN">ADMIN – Full portal access & settings</option>
                  <option value="STAFF">STAFF – Bookings, fleet, verification & dispatch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password * (min 6 characters)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Set a secure password..."
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-brand-blue focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER / RESET PASSWORD MODAL */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Edit User Account</h3>
                  <p className="text-[11px] text-slate-400">{editModalUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                <select
                  disabled={currentAdmin?.id === editModalUser.id}
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-brand-blue focus:outline-none disabled:opacity-50"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="STAFF">STAFF (Operational Access)</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
                {currentAdmin?.id === editModalUser.id && (
                  <p className="text-[10px] text-slate-400 mt-1">You cannot change your own role.</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editForm.isActive === true}
                      onChange={() => setEditForm({ ...editForm, isActive: true })}
                      disabled={currentAdmin?.id === editModalUser.id}
                    />
                    <span className="font-bold text-emerald-700">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editForm.isActive === false}
                      onChange={() => setEditForm({ ...editForm, isActive: false })}
                      disabled={currentAdmin?.id === editModalUser.id}
                    />
                    <span className="font-bold text-rose-700">Suspended / Deactivated</span>
                  </label>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset / Change Password</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Leave this blank if you do not wish to change the password.
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 chars)..."
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900">Remove Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-800">{deleteModalUser.fullName}</strong> ({deleteModalUser.email})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {actionLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
