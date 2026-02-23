import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/ui/Logo'
import { useState, useEffect } from 'react'

export default function AuthLayout () {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const [isSuccessExit, setIsSuccessExit] = useState(false)

  // Handle successful login animation
  useEffect(() => {
    if (isAuthenticated && user && !isSuccessExit) {
      setIsSuccessExit(true)
    }
  }, [isAuthenticated, user, isSuccessExit])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-app-splash'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white'></div>
      </div>
    )
  }

  if (isAuthenticated && user && isSuccessExit) {
    // Small delay to allow animation to play before actual route change
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/'
    }, 600)
  }

  return (
    <div 
      className='min-h-screen flex flex-col relative bg-cover bg-center bg-no-repeat'
      style={{ backgroundImage: 'url("/assets/bus_hero_auth_1771786297128.png")' }}
    >
      {/* Dark Overlay for Contrast */}
      <div className="absolute inset-0 bg-slate-900/60 z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Section with Logo */}
      <div className='flex-shrink-0 pt-8 pb-4'>
        <div className={`flex justify-center transition-all duration-700 ${isSuccessExit ? 'opacity-0 scale-95 translate-y-[-20px]' : 'animate-fade-in'}`}>
          <Logo variant='light' size='lg' />
        </div>
      </div>

      {/* Bottom Section with Form */}
      <div className='flex-1 flex flex-col mt-6 '>
        <div className={`auth-card flex-1 bg-white/90 transition-all duration-700 ease-in-out ${isSuccessExit ? 'translate-y-[100%] opacity-0' : 'animate-slide-up'}`}>
          <div className='px-8 py-10 max-w-md mx-auto w-full'>
            <Outlet />
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
