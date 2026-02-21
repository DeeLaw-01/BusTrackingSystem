import { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import mongoose from 'mongoose';

import Route from '../models/route.model';
import Stop from '../models/stop.model';
import Trip from '../models/trip.model';
import { getActiveBusesOnRoute } from '../config/redis';

export const getAllRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    
    const filter: Record<string, unknown> = {};
    if (active === 'true') {
      filter.isActive = true;
    }

    const routes = await Route.find(filter)
      .populate('stops')
      .sort({ name: 1 });

    res.json({ success: true, data: routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get routes' });
  }
};

export const getRouteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id).populate('stops');

    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ success: false, error: 'Failed to get route' });
  }
};

export const getRouteStops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stops = await Stop.find({ routeId: id }).sort({ sequence: 1 });

    res.json({ success: true, data: stops });
  } catch (error) {
    console.error('Get route stops error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stops' });
  }
};

export const getActiveBusesOnRouteHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const buses = await getActiveBusesOnRoute(id);

    res.json({ success: true, data: buses });
  } catch (error) {
    console.error('Get active buses error:', error);
    res.status(500).json({ success: false, error: 'Failed to get active buses' });
  }
};

export const createRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;

    const route = await Route.create({ name, description, isActive });

    res.status(201).json({ success: true, data: route });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ success: false, error: 'Failed to create route' });
  }
};

export const updateRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const route = await Route.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ success: false, error: 'Failed to update route' });
  }
};

export const deleteRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Delete all stops associated with this route
    await Stop.deleteMany({ routeId: id });

    // Delete the route
    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete route' });
  }
};

// ─── Route Builder Endpoints ─────────────────────────────────────────────────

/**
 * Check if a route can be edited (no active trips using it)
 */
export const canEditRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);
    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    const activeTrips = await Trip.countDocuments({
      routeId: id,
      status: 'ongoing',
    });

    const canEdit = activeTrips === 0;

    res.json({
      success: true,
      data: {
        canEdit,
        activeTrips,
        message: canEdit
          ? 'Route can be edited'
          : `Route has ${activeTrips} active trip(s). Editing is locked.`,
      },
    });
  } catch (error) {
    console.error('Can edit route error:', error);
    res.status(500).json({ success: false, error: 'Failed to check route edit status' });
  }
};

/**
 * Helper: Fetch JSON from a URL (works with both http and https)
 */
function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { headers: { 'User-Agent': 'BusTrackingSystem/1.0' } }, (resp) => {
        let data = '';
        resp.on('data', (chunk: string) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Generate route path using OSRM public server
 * Takes ordered stops, sends them to OSRM, stores the resulting polyline
 */
export const generateRoutePath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);
    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    // Check if route has active trips
    const activeTrips = await Trip.countDocuments({ routeId: id, status: 'ongoing' });
    if (activeTrips > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot regenerate path while route has active trips',
      });
      return;
    }

    // Get ordered stops
    const stops = await Stop.find({ routeId: id }).sort({ sequence: 1 });

    if (stops.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Route must have at least 2 stops to generate a path',
      });
      return;
    }

    // Build OSRM coordinates string: lng,lat;lng,lat;...
    const coordinates = stops
      .map((s) => `${s.longitude},${s.latitude}`)
      .join(';');

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const osrmResponse = (await fetchJson(osrmUrl)) as {
      code: string;
      routes?: Array<{
        geometry: {
          coordinates: [number, number][];
        };
        distance: number;
        duration: number;
      }>;
    };

    if (osrmResponse.code !== 'Ok' || !osrmResponse.routes?.length) {
      res.status(400).json({
        success: false,
        error: 'OSRM could not generate a route path. Please check stop locations.',
      });
      return;
    }

    const osrmRoute = osrmResponse.routes[0];

    // OSRM returns [lng, lat] — convert to [lat, lng] for Leaflet
    const path: [number, number][] = osrmRoute.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    // Save path to route
    route.path = path as unknown as mongoose.Types.Array<[number, number]>;
    await route.save();

    res.json({
      success: true,
      data: {
        path,
        distance: Math.round(osrmRoute.distance / 1000 * 100) / 100, // km
        duration: Math.round(osrmRoute.duration / 60), // minutes
      },
      message: 'Route path generated successfully',
    });
  } catch (error) {
    console.error('Generate route path error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate route path' });
  }
};

/**
 * Reverse geocode coordinates using Nominatim (OpenStreetMap)
 */
export const reverseGeocode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ success: false, error: 'lat and lng query params are required' });
      return;
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const result = (await fetchJson(url)) as {
      display_name?: string;
      address?: {
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
      };
      error?: string;
    };

    if (result.error) {
      res.json({
        success: true,
        data: { name: `Stop at ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` },
      });
      return;
    }

    // Build a concise name from address components
    const addr = result.address || {};
    const parts = [
      addr.road,
      addr.neighbourhood || addr.suburb,
      addr.city || addr.town || addr.village,
    ].filter(Boolean);

    const name = parts.length > 0
      ? parts.join(', ')
      : result.display_name?.split(',').slice(0, 3).join(',') || `Stop at ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;

    res.json({ success: true, data: { name, fullAddress: result.display_name } });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.json({
      success: true,
      data: { name: `Stop at ${req.query.lat}, ${req.query.lng}` },
    });
  }
};
