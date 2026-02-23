import { Outlet, Link, useLocation } from 'react-router-dom'
import { Bus, LogOut, Navigation } from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuthStore } from '@/store/authStore'

export default function AppLayout () {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navItems = [
    { to: '/driver', icon: Bus, label: 'Dashboard' },
    { to: '/driver/trip', icon: Navigation, label: 'Active Trip' }
  ]

  return (
    <div className='min-h-screen bg-app-bg flex flex-col'>
      {/* Header */}
      <header className='bg-white/80 backdrop-blur-md border-b border-ui-border sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
          <Link to='/driver' className='flex items-center gap-2'>
            <div className='p-2 bg-primary rounded-lg'>
              <Bus className='w-5 h-5 text-white' />
            </div>
            <span className='text-xl font-display font-bold text-content-primary'>
              Safara
            </span>
          </Link>

          <div className='flex items-center gap-4'>
            <div className='hidden sm:flex items-center gap-2 text-sm'>
              <UserAvatar name={user?.name} size='sm' />
              <span className='text-content-secondary font-medium'>{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className='p-2 text-content-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors'
              title='Logout'
            >
              <LogOut className='w-5 h-5' />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className='flex-1 pb-20 lg:pb-0'>
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className='lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-ui-border z-50'>
        <div className='flex justify-around py-2'>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-content-secondary hover:text-primary'
                }`}
              >
                <Icon className='w-6 h-6' />
                <span className='text-xs font-medium'>{label}</span>
              </Link>
            )
          })}
          <button
            onClick={logout}
            className='flex flex-col items-center gap-1 px-4 py-2 text-content-secondary hover:text-primary transition-colors'
          >
            <LogOut className='w-6 h-6' />
            <span className='text-xs font-medium'>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
