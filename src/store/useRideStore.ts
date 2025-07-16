import { create } from 'zustand';

type RideState = {
  preview: any;
  setPreview: (data: any) => void;
  requestedRide: any;
  setRequestedRide: (data: any) => void;
  location: { latitude: number; longitude: number } | null;
  setLocation: (data: { latitude: number; longitude: number } | null) => void;
  routeCoordinates: { latitude: number; longitude: number }[];
  setRouteCoordinates: (coords: { latitude: number; longitude: number }[]) => void;
  clearAll: () => void;
};

export const useRideStore = create<RideState>((set) => ({
  preview: null,
  setPreview: (data) => set({ preview: data }),
  requestedRide: null,
  setRequestedRide: (data) => set({ requestedRide: data }),
  location: null,
  setLocation: (data) => set({ location: data }),
  routeCoordinates: [],
  setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
  clearAll: () => set({ preview: null, requestedRide: null, location: null, routeCoordinates: [] }),
}));
