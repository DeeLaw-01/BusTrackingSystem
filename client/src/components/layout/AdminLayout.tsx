import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Bus,
  LayoutDashboard,
  Users,
  Route as RouteIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/routes', icon: RouteIcon, label: 'Routes' },
  { to: '/admin/buses', icon: Bus, label: 'Buses' }
]

export default function AdminLayout () {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // Use h-screen + overflow-hidden on root so the page never scrolls as a whole
    <div className='h-screen flex overflow-hidden relative'>
      {/* ── Global Background Image ── */}
      <div 
        className='absolute inset-0 z-0 bg-cover bg-center bg-no-repeat'
        style={{ 
          backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/The_Red_Metro_Bus_in_Blue_Area.jpg/1280px-The_Red_Metro_Bus_in_Blue_Area.jpg")',
          filter: 'brightness(0.8)' 
        }}
      />
      {/* ── Overlay for Content Contrast ── */}
      <div className='absolute inset-0 z-0 bg-slate-900/60 backdrop-blur-[2px]' />

      {/* ── Sidebar ── */}
      {/* Sidebar - Desktop */}
      <aside className='hidden lg:flex flex-col w-64 bg-white/40 backdrop-blur-md border-r border-ui-border h-screen sticky top-0 transition-all duration-300 z-20'>
        <SidebarContent user={user} logout={logout} location={location} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-[110] w-64 bg-white/40 backdrop-blur-md transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent user={user} logout={logout} location={location} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Right side: header + scrollable content ── */}
      <div className='flex-1 flex flex-col min-w-0 h-full'>
        {/* Mobile Top Header */}
      <header className='lg:hidden sticky top-0 z-[90] h-16 bg-white/40 backdrop-blur-md border-b border-ui-border flex items-center justify-between px-4'>
          <button
            title='Open Sidebar'
            onClick={() => setSidebarOpen(true)}
            className='lg:hidden p-2 text-content-secondary hover:text-content-primary mr-4'
          >
            <Menu className='w-6 h-6' />
          </button>
          <h1 className='admin-header text-xl'>
            Admin Panel
          </h1>
        </header>

        {/* Scrollable content area — only this part scrolls */}
        <main className='flex-1 overflow-y-auto p-4 lg:p-8 relative z-10'>
          <div className='relative z-10'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ user, logout, location, setSidebarOpen }: any) {
  return (
    <>
      {/* Logo */}
      <div className='h-16 flex items-center justify-between px-4 border-b border-ui-border shrink-0'>
        <Link to='/admin' className='flex items-center gap-2'>
          <div className='p-2 bg-primary rounded-lg'>
            <Bus className='w-5 h-5 text-white' />
          </div>
          <span className='text-xl font-display font-bold text-content-primary'>
            Safara
          </span>
        </Link>
        <button
          title='Close Sidebar'
          onClick={() => setSidebarOpen(false)}
          className='lg:hidden p-2 text-content-secondary hover:text-content-primary'
        >
          <X className='w-5 h-5' />
        </button>
      </div>

      {/* Nav — scrollable if needed */}
      <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-content-secondary hover:bg-primary/5 hover:text-content-primary'
              }`}
            >
              <Icon className='w-5 h-5 shrink-0' />
              <span className='font-medium text-sm'>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User section — always at bottom, never scrolls away */}
      <div className='p-4 border-t border-ui-border shrink-0'>
        <div className='flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-app-bg transition-colors'>
          <UserAvatar name={user?.name} size='sm' />
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-bold text-content-primary truncate'>
              {user?.name}
            </div>
            <div className='text-xs text-content-secondary'>Administrator</div>
          </div>
        </div>
        <button
          onClick={logout}
          className='w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors'
        >
          <LogOut className='w-4 h-4' />
          <span>Logout</span>
        </button>
      </div>
    </>
  )
}
