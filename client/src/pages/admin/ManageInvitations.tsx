import { useEffect, useState, useCallback } from 'react'
import {
  Send,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Mail,
  X
} from 'lucide-react'
import { adminApi } from '@/services/api'

interface Invitation {
  _id: string
  email: string
  invitedBy: { _id: string; name: string; email: string } | null
  token: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: string
}

export default function ManageInvitations () {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<string>('')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    try {
      const params: Record<string, string> = { limit: '100' }
      if (filter) params.status = filter
      const { data } = await adminApi.listInvitations(params)
      setInvitations(data.data)
    } catch {
      setError('Failed to load invitations')
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) return

    setIsSending(true)
    try {
      await adminApi.createInvitation(email.trim())
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      fetchInvitations()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to send invitation'
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?'))
      return
    setError('')
    setRevokingId(id)
    try {
      await adminApi.revokeInvitation(id)
      setSuccess('Invitation revoked successfully')
      fetchInvitations()
    } catch {
      setError('Failed to revoke invitation')
    } finally {
      setRevokingId(null)
    }
  }

  const handleResend = async (id: string, inviteEmail: string) => {
    setError('')
    setSuccess('')
    setResendingId(id)
    try {
      await adminApi.resendInvitation(id)
      setSuccess(`Invitation resent to ${inviteEmail}`)
      fetchInvitations()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to resend invitation'
      )
    } finally {
      setResendingId(null)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4 text-amber-600' />
      case 'accepted':
        return <CheckCircle className='w-4 h-4 text-green-600' />
      case 'revoked':
        return <XCircle className='w-4 h-4 text-red-600' />
      default:
        return null
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      accepted: 'bg-green-50 text-green-700 border-green-200',
      revoked: 'bg-red-50 text-red-700 border-red-200'
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || ''}`}
      >
        {statusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-display font-bold text-content-primary'>
          Manage Invitations
        </h1>
        <p className='text-content-secondary text-sm mt-1'>
          Send invitation links to allow new users to register
        </p>
      </div>

      {/* Toast Notifications */}
      {success && (
        <div className='fixed top-20 right-4 z-50 animate-in slide-in-from-right'>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 shadow-lg min-w-[300px]'>
            <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
            <p className='text-green-800 text-sm flex-1 font-medium'>{success}</p>
            <button
              onClick={() => setSuccess('')}
              className='text-green-600 hover:text-green-800 transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className='fixed top-20 right-4 z-50 animate-in slide-in-from-right'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 shadow-lg min-w-[300px]'>
            <XCircle className='w-5 h-5 text-red-600 flex-shrink-0' />
            <p className='text-red-800 text-sm flex-1 font-medium'>{error}</p>
            <button
              onClick={() => setError('')}
              className='text-red-600 hover:text-red-800 transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}

      {/* Send Invitation Form */}
      <div className='card shadow-sm'>
        <h2 className='text-lg font-semibold text-content-primary mb-4'>Invite a User</h2>

        <form onSubmit={handleSendInvitation} className='flex gap-3 items-end'>
          <div className='flex-1'>
            <label className='block text-sm font-semibold text-content-primary mb-1.5'>
              Email Address
            </label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary/60' />
              <input
                type='email'
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setError('')
                  setSuccess('')
                }}
                placeholder='user@example.com'
                className='input pl-10 h-[46px]'
                required
              />
            </div>
          </div>
          <button
            type='submit'
            disabled={isSending || !email.trim()}
            className='btn-coral flex items-center justify-center gap-2 px-6 h-[46px]'
          >
            {isSending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Send className='w-4 h-4' />
            )}
            Send Invite
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className='flex gap-2 flex-wrap'>
        {['', 'pending', 'accepted', 'revoked'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
              ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-content-secondary hover:bg-app-bg border border-ui-border'
              }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Invitations Table */}
      <div className='card overflow-hidden p-0 shadow-sm'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-6 h-6 animate-spin text-primary' />
          </div>
        ) : invitations.length === 0 ? (
          <div className='text-center py-12 text-content-secondary'>
            <Mail className='w-10 h-10 mx-auto mb-3 text-ui-border' />
            <p className='text-sm'>No invitations found</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-ui-border bg-app-bg/50'>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Email
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Status
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Invited By
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Sent
                  </th>
                  <th className='text-left text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Expires
                  </th>
                  <th className='text-right text-xs font-bold text-content-secondary uppercase tracking-wider px-6 py-4'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-ui-border'>
                {invitations.map(inv => (
                  <tr key={inv._id} className='hover:bg-app-bg/50 transition-colors'>
                    <td className='px-6 py-4 text-sm font-semibold text-content-primary'>
                      {inv.email}
                    </td>
                    <td className='px-6 py-4'>
                      {statusBadge(inv.status)}
                      {inv.status === 'pending' && isExpired(inv.expiresAt) && (
                        <span className='ml-2 text-xs text-primary font-bold'>(expired)</span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm text-content-secondary'>
                      {inv.invitedBy?.name || 'N/A'}
                    </td>
                    <td className='px-6 py-4 text-sm text-content-secondary'>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-sm text-content-secondary'>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      {inv.status === 'pending' && (
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            onClick={() => handleResend(inv._id, inv.email)}
                            disabled={resendingId === inv._id || revokingId === inv._id}
                            className='p-2 rounded-lg text-content-secondary hover:text-primary hover:bg-primary/10 
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            title='Resend invitation'
                          >
                            {resendingId === inv._id ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              <RefreshCw className='w-4 h-4' />
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(inv._id)}
                            disabled={resendingId === inv._id || revokingId === inv._id}
                            className='p-2 rounded-lg text-content-secondary hover:text-red-500 hover:bg-red-50
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            title='Revoke invitation'
                          >
                            {revokingId === inv._id ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              <Trash2 className='w-4 h-4' />
                            )}
                          </button>
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
