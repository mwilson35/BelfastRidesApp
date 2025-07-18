import io from 'socket.io-client';
import { API_CONFIG, buildApiUrl, getAuthHeaders } from '../config/api';

// Driver API Service for backend integration
export class DriverService {
  private static instance: DriverService;
  private socket: any;
  private driverToken: string | null = null;

  private constructor() {}

  static getInstance(): DriverService {
    if (!DriverService.instance) {
      DriverService.instance = new DriverService();
    }
    return DriverService.instance;
  }

  // Initialize socket connection for driver
  initializeSocket(driverId: number) {
    this.socket = io(API_CONFIG.SOCKET_URL, {
      auth: {
        token: this.driverToken
      }
    });

    this.socket.emit('registerDriver', driverId);
    
    return this.socket;
  }

  setDriverToken(token: string) {
    this.driverToken = token;
  }

  private getHeaders() {
    if (!this.driverToken) {
      throw new Error('Driver token not set');
    }
    return getAuthHeaders(this.driverToken);
  }

  // Driver Status Management
  async updateDriverStatus(status: 'online' | 'offline' | 'busy', location?: {
    latitude: number;
    longitude: number;
  }) {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_STATUS), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status,
          ...(location && {
            latitude: location.latitude,
            longitude: location.longitude
          })
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Emit status change via socket
      if (this.socket) {
        this.socket.emit('driverStatusChange', { 
          driverId: data.driverId, 
          status 
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  // Real-time Location Updates
  async updateDriverLocation(location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }) {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_LOCATION), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Emit location update via socket
      if (this.socket) {
        this.socket.emit('driverLocationUpdate', {
          driverId: data.driverId,
          ...location
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  // Get Driver's Current Status
  async getDriverStatus() {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_STATUS), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting driver status:', error);
      throw error;
    }
  }

  // Get Active Ride
  async getActiveRide() {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_ACTIVE_RIDE), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get active ride: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting active ride:', error);
      throw error;
    }
  }

  // Update Ride Status
  async updateRideStatus(rideId: number, status: 'assigned' | 'en_route_pickup' | 'arrived_pickup' | 'in_progress' | 'completed') {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_RIDE_STATUS), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          rideId,
          status
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update ride status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ride status:', error);
      throw error;
    }
  }

  // Socket Event Listeners
  onRideAssigned(callback: (rideData: any) => void) {
    if (this.socket) {
      this.socket.on('rideAssigned', callback);
    }
  }

  onRideUpdate(callback: (updateData: any) => void) {
    if (this.socket) {
      this.socket.on('rideUpdate', callback);
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
