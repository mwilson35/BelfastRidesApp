import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
// @ts-ignore
import PolylineDecoder from '@mapbox/polyline';

type Props = {
  encodedPolyline: string;
};

const PrebookMap: React.FC<Props> = ({ encodedPolyline }) => {
  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [hasFitted, setHasFitted] = useState(false);

  useEffect(() => {
    if (encodedPolyline) {
      try {
        const decoded = PolylineDecoder.decode(encodedPolyline).map(
          ([latitude, longitude]: [number, number]) => ({ latitude, longitude })
        );
        setRouteCoordinates(decoded);
        setHasFitted(false); // reset so it snaps again
      } catch {
        setRouteCoordinates([]);
      }
    }
  }, [encodedPolyline]);

  useEffect(() => {
    if (mapReady && mapRef.current && routeCoordinates.length > 0 && !hasFitted) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
      setHasFitted(true);
    }
  }, [mapReady, routeCoordinates]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        onMapReady={() => setMapReady(true)}
      >
        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={5}
              strokeColor="#007bff"
            />
            <Marker
              coordinate={routeCoordinates[0]}
              title="Pickup"
              pinColor="green"
            />
            <Marker
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title="Dropoff"
              pinColor="red"
            />
          </>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default PrebookMap;
