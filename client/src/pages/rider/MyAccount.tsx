import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Shield, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

export default function MyAccount () {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white border-b border-ui-border px-4 h-14 flex items-center gap-3 sticky top-0 z-50'>
        <button
          title='Back'
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-app-bg rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-content-primary' />
        </button>
        <h1 className='text-lg font-bold text-content-primary'>My Account</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl border border-ui-border p-6 mb-6 shadow-sm'>
          <div className='flex items-center gap-4 mb-6'>
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              size='xl'
              className='ring-4 ring-primary/10'
            />
            <div>
              <h2 className='text-xl font-bold text-content-primary'>{user?.name}</h2>
              <p className='text-sm text-content-secondary'>{user?.email}</p>
              <span className='inline-block mt-2 text-xs font-medium text-white bg-primary px-2.5 py-0.5 rounded-full capitalize'>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            title='Edit Profile'
            onClick={() => navigate('/settings')}
            className='w-full btn btn-coral'
          >
            Edit Profile
          </button>
        </div>

        {/* Account Details */}
        <div className='bg-white rounded-2xl border border-ui-border p-6 mb-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-content-primary mb-4'>
            Account Details
          </h3>

          <div className='space-y-4'>
            <div className='flex items-center gap-4 p-3 bg-app-bg rounded-lg border border-ui-border/50'>
              <Mail className='w-5 h-5 text-content-secondary/60' />
              <div className='flex-1'>
                <p className='text-xs text-content-secondary mb-0.5'>Email</p>
                <p className='text-sm font-medium text-content-primary'>
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.phone && (
              <div className='flex items-center gap-4 p-3 bg-app-bg rounded-lg border border-ui-border/50'>
                <Phone className='w-5 h-5 text-content-secondary/60' />
                <div className='flex-1'>
                  <p className='text-xs text-content-secondary mb-0.5'>Phone</p>
                  <p className='text-sm font-medium text-content-primary'>
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className='flex items-center gap-4 p-3 bg-app-bg rounded-lg border border-ui-border/50'>
              <Shield className='w-5 h-5 text-content-secondary/60' />
              <div className='flex-1'>
                <p className='text-xs text-content-secondary mb-0.5'>Account Status</p>
                <p className='text-sm font-medium text-content-primary'>
                  {user?.isEmailVerified ? (
                    <span className='text-green-600'>Verified</span>
                  ) : (
                    <span className='text-amber-600 font-semibold'>Unverified</span>
                  )}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4 p-3 bg-app-bg rounded-lg border border-ui-border/50'>
              <Calendar className='w-5 h-5 text-content-secondary/60' />
              <div className='flex-1'>
                <p className='text-xs text-content-secondary mb-0.5'>Member Since</p>
                <p className='text-sm font-medium text-content-primary'>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-2xl border border-ui-border p-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-content-primary mb-4'>
            Quick Actions
          </h3>

          <div className='space-y-2'>
            <button
              title='Settings'
              onClick={() => navigate('/settings')}
              className='w-full text-left p-3 rounded-lg hover:bg-app-bg transition-colors'
            >
              <p className='text-sm font-medium text-content-primary'>Settings</p>
              <p className='text-xs text-content-secondary'>
                Manage your account settings
              </p>
            </button>

            <button
              title='Notifications'
              onClick={() => navigate('/notifications')}
              className='w-full text-left p-3 rounded-lg hover:bg-app-bg transition-colors'
            >
              <p className='text-sm font-medium text-content-primary'>Notifications</p>
              <p className='text-xs text-content-secondary'>
                Configure notification preferences
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
