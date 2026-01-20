// components/RoutePreviewMap.tsx
// Updated: assumes coords are already provided (no geocoding).
// If a `route` prop is passed, the component renders immediately (no network).
// Otherwise it will fetch the route (but still won't geocode).

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Haptics from "expo-haptics";
import { getRoute } from "../services/maps";

export default function RoutePreviewMap({
  fromCoords, // { lat, lng, displayName? } - REQUIRED
  toCoords,   // { lat, lng, displayName? } - REQUIRED
  route,      // optional pre-fetched route { distanceKm, durationMin, coordinates }
  onConfirm,
  onCancel,
  visible = true,
}: any) {
  const [loading, setLoading] = useState<boolean>(false);
  const [internalRoute, setInternalRoute] = useState<any | null>(route ?? null);

  useEffect(() => {
    let mounted = true;

    // If parent already passed a route, we use it and skip fetching.
    if (route) {
      setInternalRoute(route);
      return;
    }

    // Otherwise fetch the route (no geocoding here - coords must be present).
    async function loadRoute() {
      try {
        setLoading(true);
        const r = await getRoute(
          { lat: fromCoords.lat, lng: fromCoords.lng },
          { lat: toCoords.lat, lng: toCoords.lng }
        );
        if (!mounted) return;
        setInternalRoute(r);
      } catch (err) {
        console.log("RoutePreviewMap.getRoute error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRoute();

    return () => {
      mounted = false;
    };
  }, [fromCoords, toCoords, route]);

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={false} visible>
      <View style={styles.container}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Calculating route…</Text>
          </View>
        )}

        {!loading && internalRoute && (
          <>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (fromCoords.lat + toCoords.lat) / 2,
                longitude: (fromCoords.lng + toCoords.lng) / 2,
                latitudeDelta: Math.max(Math.abs(fromCoords.lat - toCoords.lat) * 2.5, 0.02),
                longitudeDelta: Math.max(Math.abs(fromCoords.lng - toCoords.lng) * 2.5, 0.02),
              }}
            >
              <Marker
                coordinate={{ latitude: fromCoords.lat, longitude: fromCoords.lng }}
                title={fromCoords.displayName || "Pickup"}
              />
              <Marker
                coordinate={{ latitude: toCoords.lat, longitude: toCoords.lng }}
                title={toCoords.displayName || "Drop"}
              />

              <Polyline
                coordinates={internalRoute.coordinates}
                strokeWidth={5}
                strokeColor="#1E40AF"
              />
            </MapView>

            <View style={styles.bottom}>
              <Text style={styles.info}>
                🚗 {internalRoute.distanceKm.toFixed(1)} km • ⏱ {Math.round(internalRoute.durationMin)} mins
              </Text>

              <View style={styles.actions}>
                <Pressable style={styles.cancel} onPress={onCancel}>
                  <Text>Change</Text>
                </Pressable>

                <Pressable
                  style={styles.confirm}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    onConfirm({
                      distanceKm: internalRoute.distanceKm,
                      durationMin: internalRoute.durationMin,
                      coordinates: internalRoute.coordinates,
                      from: fromCoords,
                      to: toCoords,
                    });
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm route</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {!loading && !internalRoute && (
          <View style={styles.center}>
            <Text>Could not compute route. Try changing addresses.</Text>
            <Pressable style={[styles.cancel, { marginTop: 12 }]} onPress={onCancel}>
              <Text>Back</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  info: { fontWeight: "700", marginBottom: 12 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  cancel: { padding: 12, borderRadius: 12, backgroundColor: "#E5E7EB" },
  confirm: { padding: 12, borderRadius: 12, backgroundColor: "#1E40AF" },
});