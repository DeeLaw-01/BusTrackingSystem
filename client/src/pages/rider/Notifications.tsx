import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Smartphone,
  Mail,
  Save,
  Loader2,
  Check
} from 'lucide-react'

export default function Notifications () {
  const navigate = useNavigate()

  const STORAGE_KEY = 'safara_notification_settings'

  const defaultSettings = {
    pushNotifications: true,
    emailNotifications: true,
    busApproaching: true,
    routeUpdates: true,
    systemAnnouncements: false
  }

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      // Small delay so the loader is briefly visible for feedback
      await new Promise(resolve => setTimeout(resolve, 400))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const toggleSetting = (key: keyof typeof defaultSettings) => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, [key]: !prev[key] }))
  }

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
        <h1 className='text-lg font-bold text-content-primary'>Notifications</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Push Notifications */}
          <div className='bg-white rounded-2xl border border-ui-border p-6 shadow-sm'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Smartphone className='w-5 h-5 text-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-content-primary'>
                  Push Notifications
                </h3>
                <p className='text-sm text-content-secondary'>
                  Receive notifications on your device
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <label className='flex items-center justify-between p-3 bg-app-bg rounded-lg cursor-pointer hover:bg-ui-border/30 transition-colors border border-ui-border/50'>
                <div>
                  <p className='text-sm font-medium text-content-primary'>
                    Enable Push Notifications
                  </p>
                  <p className='text-xs text-content-secondary'>
                    Receive real-time updates on your device
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.pushNotifications}
                  onChange={() => toggleSetting('pushNotifications')}
                  className='w-5 h-5 text-primary rounded focus:ring-primary'
                />
              </label>

              <label className='flex items-center justify-between p-3 bg-app-bg rounded-lg cursor-pointer hover:bg-ui-border/30 transition-colors border border-ui-border/50'>
                <div>
                  <p className='text-sm font-medium text-content-primary'>
                    Bus Approaching
                  </p>
                  <p className='text-xs text-content-secondary'>
                    Get notified when your bus is nearby
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.busApproaching}
                  onChange={() => toggleSetting('busApproaching')}
                  disabled={!settings.pushNotifications}
                  className='w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50'
                />
              </label>

              <label className='flex items-center justify-between p-3 bg-app-bg rounded-lg cursor-pointer hover:bg-ui-border/30 transition-colors border border-ui-border/50'>
                <div>
                  <p className='text-sm font-medium text-content-primary'>
                    Route Updates
                  </p>
                  <p className='text-xs text-content-secondary'>
                    Notifications about route changes or delays
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.routeUpdates}
                  onChange={() => toggleSetting('routeUpdates')}
                  disabled={!settings.pushNotifications}
                  className='w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50'
                />
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className='bg-white rounded-2xl border border-ui-border p-6 shadow-sm'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Mail className='w-5 h-5 text-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-content-primary'>
                  Email Notifications
                </h3>
                <p className='text-sm text-content-secondary'>
                  Receive updates via email
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <label className='flex items-center justify-between p-3 bg-app-bg rounded-lg cursor-pointer hover:bg-ui-border/30 transition-colors border border-ui-border/50'>
                <div>
                  <p className='text-sm font-medium text-content-primary'>
                    Enable Email Notifications
                  </p>
                  <p className='text-xs text-content-secondary'>
                    Receive updates in your inbox
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting('emailNotifications')}
                  className='w-5 h-5 text-primary rounded focus:ring-primary'
                />
              </label>

              <label className='flex items-center justify-between p-3 bg-app-bg rounded-lg cursor-pointer hover:bg-ui-border/30 transition-colors border border-ui-border/50'>
                <div>
                  <p className='text-sm font-medium text-content-primary'>
                    System Announcements
                  </p>
                  <p className='text-xs text-content-secondary'>
                    Important updates and announcements
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.systemAnnouncements}
                  onChange={() => toggleSetting('systemAnnouncements')}
                  disabled={!settings.emailNotifications}
                  className='w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50'
                />
              </label>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className='flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700'>
              <Check className='w-5 h-5' />
              <span className='text-sm font-medium'>
                Notification preferences saved!
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className='flex gap-3'>
            <button
              type='button'
              title='Cancel'
              onClick={() => navigate(-1)}
              className='btn-secondary flex-1'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='btn-coral flex-1'
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-5 h-5' />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
