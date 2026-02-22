import { useEffect, useState } from 'react';
import { 
  Search, 
  Check, 
  X, 
  Trash2, 
  Loader2,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '@/services/api'
import type { User } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
    loadPendingDrivers();
  }, [page, roleFilter]);

  const loadUsers = async () => {
    try {
      const { data } = await adminApi.getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setUsers(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingDrivers = async () => {
    try {
      const { data } = await adminApi.getPendingDrivers();
      setPendingDrivers(data.data);
    } catch (error) {
      console.error('Failed to load pending drivers:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleApproveDriver = async (id: string) => {
    try {
      await adminApi.approveDriver(id);
      loadPendingDrivers();
      loadUsers();
    } catch (error) {
      console.error('Failed to approve driver:', error);
    }
  };

  const handleRejectDriver = async (id: string) => {
    if (!confirm('Are you sure you want to reject this driver?')) return;
    try {
      await adminApi.rejectDriver(id);
      loadPendingDrivers();
    } catch (error) {
      console.error('Failed to reject driver:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-content-primary">Manage Users</h1>
      </div>

      {/* Pending Drivers Alert */}
      {pendingDrivers.length > 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-800">
              {pendingDrivers.length} Driver{pendingDrivers.length > 1 ? 's' : ''} Pending Approval
            </h2>
          </div>
          <div className="space-y-2">
            {pendingDrivers.map((driver) => (
              <div
                key={driver._id}
                className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg shadow-sm"
              >
                <div>
                  <div className="font-medium text-content-primary">{driver.name}</div>
                  <div className="text-sm text-content-secondary">{driver.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveDriver(driver._id)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                    title="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRejectDriver(driver._id)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-content-secondary/60" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="input w-auto h-[46px] py-0"
            >
              <option value="">All Roles</option>
              <option value="rider">Riders</option>
              <option value="driver">Drivers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <button type="submit" className="btn btn-coral px-8">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card shadow-sm overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ui-border bg-app-bg/50">
                <th className="text-left p-4 text-sm font-semibold text-content-secondary">User</th>
                <th className="text-left p-4 text-sm font-semibold text-content-secondary">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-content-secondary">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-content-secondary">Joined</th>
                <th className="text-right p-4 text-sm font-semibold text-content-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-ui-border hover:bg-app-bg/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                      <div>
                        <div className="font-semibold text-content-primary">{user.name}</div>
                        <div className="text-sm text-content-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-600'
                        : user.role === 'driver'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isApproved ? (
                      <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                        <UserCheck className="w-4 h-4" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-content-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-ui-border bg-app-bg/30">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-content-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
