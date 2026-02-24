import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Route as RouteIcon,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Map
} from 'lucide-react'
import { routesApi, stopsApi } from '@/services/api'
import type { Route, Stop } from '@/types'

export default function ManageRoutes () {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [showStopModal, setShowStopModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<
    string | null
  >(null)

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const { data } = await routesApi.getAll()
      setRoutes(data.data)
    } catch (error) {
      console.error('Failed to load routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoute = async (id: string) => {
    if (
      !confirm('Are you sure? This will also delete all stops on this route.')
    )
      return
    try {
      await routesApi.delete(id)
      loadRoutes()
    } catch (error) {
      console.error('Failed to delete route:', error)
    }
  }

  const handleDeleteStop = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stop?')) return
    try {
      await stopsApi.delete(id)
      loadRoutes()
    } catch (error) {
      console.error('Failed to delete stop:', error)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='w-8 h-8 text-primary animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-display font-bold text-content-primary'>
          Manage Routes
        </h1>
        <button
          onClick={() => {
            setEditingRoute(null)
            setShowRouteModal(true)
          }}
          className='btn-coral flex items-center gap-2'
        >
          <Plus className='w-5 h-5' />
          Add Route
        </button>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className='card shadow-sm text-center py-12'>
          <RouteIcon className='w-12 h-12 text-content-secondary/30 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-content-primary mb-2'>
            No Routes Yet
          </h3>
          <p className='text-content-secondary mb-6'>
            Create your first route to get started
          </p>
          <button onClick={() => setShowRouteModal(true)} className='btn-coral'>
            <Plus className='w-5 h-5' />
            Create Route
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {routes.map(route => (
            <div key={route._id} className='card shadow-sm'>
              {/* Route Header */}
              <div
                className='flex items-center justify-between cursor-pointer'
                onClick={() =>
                  setExpandedRoute(
                    expandedRoute === route._id ? null : route._id
                  )
                }
              >
                <div className='flex items-center gap-4'>
                  <div
                    className={`p-2 rounded-lg ${
                      route.isActive ? 'bg-green-50' : 'bg-app-bg'
                    }`}
                  >
                    <RouteIcon
                      className={`w-5 h-5 ${
                        route.isActive
                          ? 'text-green-600'
                          : 'text-content-secondary'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className='font-semibold text-content-primary'>
                      {route.name}
                    </h3>
                    <p className='text-sm text-content-secondary'>
                      {route.stops?.length || 0} stops •{' '}
                      {route.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/admin/routes/builder/${route._id}`)
                    }}
                    className='p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors'
                    title='Open Route Builder'
                  >
                    <Map className='w-4 h-4' />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setEditingRoute(route)
                      setShowRouteModal(true)
                    }}
                    className='p-2 text-content-secondary hover:text-content-primary hover:bg-app-bg rounded-lg transition-colors'
                  >
                    <Edit className='w-4 h-4' />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteRoute(route._id)
                    }}
                    className='p-2 text-content-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                  {expandedRoute === route._id ? (
                    <ChevronUp className='w-5 h-5 text-content-secondary/60' />
                  ) : (
                    <ChevronDown className='w-5 h-5 text-content-secondary/60' />
                  )}
                </div>
              </div>

              {/* Expanded Stops */}
              {expandedRoute === route._id && (
                <div className='mt-4 pt-4 border-t border-ui-border'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-sm font-bold text-content-secondary uppercase tracking-wider'>
                      Stops
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedRouteForStop(route._id)
                        setEditingStop(null)
                        setShowStopModal(true)
                      }}
                      className='text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1'
                    >
                      <Plus className='w-4 h-4' />
                      Add Stop
                    </button>
                  </div>

                  {!route.stops || route.stops.length === 0 ? (
                    <p className='text-content-secondary/60 text-sm'>
                      No stops added yet
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {route.stops.map((stop, index) => (
                        <div
                          key={stop._id}
                          className='flex items-center justify-between p-3 bg-app-bg/50 border border-ui-border rounded-lg'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-sm'>
                              {index + 1}
                            </div>
                            <div>
                              <div className='text-sm font-semibold text-content-primary'>
                                {stop.name}
                              </div>
                              <div className='text-xs text-content-secondary/70'>
                                {stop.latitude.toFixed(4)},{' '}
                                {stop.longitude.toFixed(4)}
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center gap-1'>
                            <button
                              onClick={() => {
                                setSelectedRouteForStop(route._id)
                                setEditingStop(stop)
                                setShowStopModal(true)
                              }}
                              className='p-1.5 text-content-secondary hover:text-content-primary hover:bg-white rounded transition-colors'
                            >
                              <Edit className='w-3.5 h-3.5' />
                            </button>
                            <button
                              onClick={() => handleDeleteStop(stop._id)}
                              className='p-1.5 text-content-secondary hover:text-red-500 hover:bg-red-50 rounded transition-colors'
                            >
                              <Trash2 className='w-3.5 h-3.5' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <RouteModal
          route={editingRoute}
          onClose={() => setShowRouteModal(false)}
          onSuccess={() => {
            setShowRouteModal(false)
            loadRoutes()
          }}
        />
      )}

      {/* Stop Modal */}
      {showStopModal && selectedRouteForStop && (
        <StopModal
          routeId={selectedRouteForStop}
          stop={editingStop}
          existingStopsCount={
            routes.find(r => r._id === selectedRouteForStop)?.stops?.length || 0
          }
          onClose={() => setShowStopModal(false)}
          onSuccess={() => {
            setShowStopModal(false)
            loadRoutes()
          }}
        />
      )}
    </div>
  )
}

interface RouteModalProps {
  route: Route | null
  onClose: () => void
  onSuccess: () => void
}

function RouteModal ({ route, onClose, onSuccess }: RouteModalProps) {
  const [name, setName] = useState(route?.name || '')
  const [description, setDescription] = useState(route?.description || '')
  const [isActive, setIsActive] = useState(route?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (route) {
        await routesApi.update(route._id, { name, description, isActive })
      } else {
        await routesApi.create({ name, description })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save route:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='card max-w-md w-full shadow-2xl'>
        <h2 className='text-xl font-display font-bold text-content-primary mb-6'>
          {route ? 'Edit Route' : 'Create Route'}
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-content-primary mb-2'>
              Route Name
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className='input'
              placeholder='e.g., DHA Phase 5 - Model Town'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-content-primary mb-2'>
              Description (Optional)
            </label>
            <input
              type='text'
              value={description}
              onChange={e => setDescription(e.target.value)}
              className='input'
              placeholder='e.g., Morning route via main boulevard'
            />
          </div>
          {route && (
            <div>
              <label className='flex items-center gap-3 cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className='w-4 h-4 rounded border-ui-border text-primary focus:ring-primary'
                />
                <span className='text-content-secondary group-hover:text-content-primary transition-colors font-medium'>
                  Route is active
                </span>
              </label>
            </div>
          )}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='btn-secondary h-[46px] flex-1'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='btn-coral h-[46px] flex-1'
            >
              {saving ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StopModalProps {
  routeId: string
  stop: Stop | null
  existingStopsCount: number
  onClose: () => void
  onSuccess: () => void
}

function StopModal ({
  routeId,
  stop,
  existingStopsCount,
  onClose,
  onSuccess
}: StopModalProps) {
  const [name, setName] = useState(stop?.name || '')
  const [latitude, setLatitude] = useState(stop?.latitude?.toString() || '')
  const [longitude, setLongitude] = useState(stop?.longitude?.toString() || '')
  const [sequence, setSequence] = useState(
    stop?.sequence?.toString() || existingStopsCount.toString()
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (stop) {
        await stopsApi.update(stop._id, {
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          sequence: parseInt(sequence)
        })
      } else {
        await stopsApi.create({
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          sequence: parseInt(sequence),
          routeId
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save stop:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='card max-w-md w-full shadow-2xl'>
        <h2 className='text-xl font-display font-bold text-content-primary mb-6'>
          {stop ? 'Edit Stop' : 'Add Stop'}
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-content-primary mb-2'>
              Stop Name
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className='input'
              placeholder='e.g., Main Gate'
              required
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-content-primary mb-2'>
                Latitude
              </label>
              <input
                type='number'
                step='any'
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                className='input'
                placeholder='31.5204'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-content-primary mb-2'>
                Longitude
              </label>
              <input
                type='number'
                step='any'
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                className='input'
                placeholder='74.3587'
                required
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-semibold text-content-primary mb-2'>
              Sequence (Order)
            </label>
            <input
              type='number'
              min='0'
              value={sequence}
              onChange={e => setSequence(e.target.value)}
              className='input'
              required
            />
          </div>
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='btn-secondary h-[46px] flex-1'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='btn-coral h-[46px] flex-1'
            >
              {saving ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
