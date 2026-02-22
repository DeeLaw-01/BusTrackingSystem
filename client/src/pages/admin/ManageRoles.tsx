import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
  Bus,
  ChevronDown
} from 'lucide-react'
import { adminApi } from '@/services/api'
import UserAvatar from '@/components/ui/UserAvatar'

interface User {
  _id: string
  name: string
  email: string
  role: string
  isApproved: boolean
  avatar?: string
  createdAt: string
}

export default function ManageRoles () {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 100 }
      if (search.trim()) params.search = search.trim()
      const { data } = await adminApi.getUsers(params)
      setUsers(data.data)
    } catch {
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timeout)
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('')
    setSuccess('')
    setChangingRole(userId)
    setOpenDropdown(null)

    try {
      await adminApi.changeUserRole(userId, newRole)
      setSuccess('Role updated successfully')
      fetchUsers()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to change role'
      )
    } finally {
      setChangingRole(null)
    }
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className='w-4 h-4' />
      case 'driver':
        return <Bus className='w-4 h-4' />
      default:
        return <UserCheck className='w-4 h-4' />
    }
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      driver: 'bg-blue-50 text-blue-700 border-blue-200',
      rider: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[role] || colors.rider}`}
      >
        {roleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-display font-bold text-content-primary'>Manage Roles</h1>
        <p className='text-content-secondary text-sm mt-1'>
          Assign user roles — promote riders to drivers or vice versa
        </p>
      </div>

      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
          {error}
        </div>
      )}
      {success && (
        <div className='p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm'>
          {success}
        </div>
      )}

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary/60' />
        <input
          type='text'
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search by name or email...'
          className='input pl-10 h-[42px]'
        />
      </div>

      {/* Users Table */}
      <div className='card shadow-sm overflow-hidden p-0'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-6 h-6 animate-spin text-primary' />
          </div>
        ) : users.length === 0 ? (
          <div className='text-center py-12 text-content-secondary'>
            <p className='text-sm font-medium'>No users found</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-ui-border bg-app-bg/50'>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    User
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Current Role
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Approved
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Joined
                  </th>
                  <th className='text-right text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-ui-border'>
                {users.map(user => (
                  <tr key={user._id} className='hover:bg-app-bg/50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <UserAvatar
                          avatar={user.avatar}
                          name={user.name}
                          size='sm'
                        />
                        <div>
                          <p className='text-sm font-semibold text-content-primary'>
                            {user.name}
                          </p>
                          <p className='text-xs text-content-secondary'>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>{roleBadge(user.role)}</td>
                    <td className='px-6 py-4'>
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${user.isApproved ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-content-secondary'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      {user.role === 'admin' ? (
                        <span className='text-xs text-content-secondary/40 font-medium'>System Admin</span>
                      ) : (
                        <div className='relative inline-block'>
                          {changingRole === user._id ? (
                            <Loader2 className='w-4 h-4 animate-spin text-primary' />
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setOpenDropdown(
                                    openDropdown === user._id
                                      ? null
                                      : user._id
                                  )
                                }
                                className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                                           text-sm font-semibold text-content-secondary bg-app-bg border border-ui-border
                                           hover:bg-white hover:border-primary/30 transition-all shadow-sm'
                              >
                                Change Role
                                <ChevronDown className='w-3.5 h-3.5 opacity-60' />
                              </button>

                              {openDropdown === user._id && (
                                <div className='absolute right-0 top-full mt-1 w-40 bg-white border border-ui-border rounded-xl shadow-xl z-10 py-1.5'>
                                  {['rider', 'driver']
                                    .filter(r => r !== user.role)
                                    .map(role => (
                                      <button
                                        key={role}
                                        onClick={() =>
                                          handleRoleChange(user._id, role)
                                        }
                                        className='w-full flex items-center gap-2.5 px-4 py-2 text-sm text-content-secondary
                                                   hover:bg-app-bg hover:text-primary transition-colors font-medium text-left'
                                      >
                                        <div className='p-1 bg-app-bg rounded-md group-hover:bg-white'>
                                          {roleIcon(role)}
                                        </div>
                                        {role.charAt(0).toUpperCase() +
                                          role.slice(1)}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
