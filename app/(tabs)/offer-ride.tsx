import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuth } from "../../context/AuthContext";
import { createRide } from "../../services/rides";
import * as Haptics from "expo-haptics";
import RoutePreviewMap from "../../components/RoutePreviewMap";
import { geocodeAddress, getRoute } from "../../services/maps";

/* ---------- Helpers ---------- */
const FALLING_EMOJIS = ["😊", "🚗", "💙", "🙂"];
function FallingEmojis() {
  return <View />;
}
function Confetti({ onComplete }: any) {
  return <View />;
}

const formatTime = (time?: string) => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1].padStart(2, "0");
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
};

/* ---------- OfferRide Component (with silent prepareRoute) ---------- */
export default function OfferRide() {
  /* intro + blast kept minimal here */
  const [showIntro, setShowIntro] = useState(true);
  const [showBlast, setShowBlast] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (showIntro) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [showIntro]);

  const { token, user } = useAuth();

  // form fields
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState<any>(null);
  const [toCoords, setToCoords] = useState<any>(null);

  // route data & states
  const [routeInfo, setRouteInfo] = useState<any | null>(null);
  const [routeConfirmed, setRouteConfirmed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [preparingRoute, setPreparingRoute] = useState(false);

  // remaining fields
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("09:00");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [publishing, setPublishing] = useState(false);

  /* ---------- location helper ---------- */
  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Location permission is required to use current location.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync(loc.coords);
      const g = geo[0] || {};
      const address = [g.name || "", g.street || "", g.subregion || "", g.city || "", g.region || ""]
        .filter(Boolean)
        .join(", ");
      setFromAddress(address);
      setFromCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude, displayName: address });
    } catch (err) {
      console.log("Location error", err);
      Alert.alert("Error", "Could not fetch location.");
    }
  };

  /* ---------- prepareRoute (silent) ----------
     Geocode (if needed) + fetch route before opening the map.
     This prepares routeInfo and coords without opening the modal.
  */
  const prepareRoute = async () => {
    if (!fromAddress || !toAddress) return null;
    if (preparingRoute) return routeInfo;
    setPreparingRoute(true);
    setGeocoding(true);

    try {
      let f = fromCoords;
      let t = toCoords;

      if (!f) {
        try {
          const g = await geocodeAddress(fromAddress);
          f = { lat: g.lat, lng: g.lng, displayName: g.displayName };
          setFromCoords(f);
        } catch (e) {
          // ignore and let the modal/parent show error if needed
          console.log("geocode from failed", e);
        }
      }

      if (!t) {
        try {
          const g = await geocodeAddress(toAddress);
          t = { lat: g.lat, lng: g.lng, displayName: g.displayName };
          setToCoords(t);
        } catch (e) {
          console.log("geocode to failed", e);
        }
      }

      // both coords must now exist (if geocoding failed, getRoute will also fail)
      if (!f || !t) {
        return null;
      }

      // fetch route
      const r = await getRoute({ lat: f.lat, lng: f.lng }, { lat: t.lat, lng: t.lng });
      const prepared = { ...r, from: f, to: t };
      setRouteInfo(prepared);
      return prepared;
    } catch (err) {
      console.log("prepareRoute error", err);
      return null;
    } finally {
      setPreparingRoute(false);
      setGeocoding(false);
    }
  };

  // Debounced silent preparation when user fills both addresses.
  useEffect(() => {
    if (!fromAddress.trim() || !toAddress.trim() || routeConfirmed || routeInfo) return;

    const t = setTimeout(() => {
      // silently prepare data (no modal open)
      prepareRoute().catch(() => {});
    }, 700); // debounce while typing

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAddress, toAddress]);

  // Called when user taps "Preview route" — ensures data prepared then opens modal
  const openRoutePreview = async () => {
    try {
      setGeocoding(true);
      const prepared = routeInfo || (await prepareRoute());
      if (!prepared) {
        Alert.alert("Could not prepare route", "Please check the addresses and try again.");
        return;
      }
      // route prepared — open modal (map will mount instantly)
      setShowMap(true);
    } finally {
      setGeocoding(false);
    }
  };

  /* ---------- publish ---------- */
  const submitRide = async () => {
    if (!token) {
      Alert.alert("Not signed in", "You must be signed in to publish a ride.");
      return;
    }

    if (!routeConfirmed || !routeInfo) {
      Alert.alert("Route not confirmed", "Please confirm the route before publishing.");
      return;
    }

    if (!price || !seats) {
      Alert.alert("Missing fields", "Please set seats and price.");
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        driverName: user?.userName || "Driver",
        driverPhone: user?.phone || undefined,
        departureLocation: fromAddress,
        destinationLocation: toAddress,
        departureDate: date.toLocaleDateString("en-GB").split("/").join("-"),
        departureTime: time,
        totalSeats: Number(seats),
        availableSeats: Number(seats),
        pricePerSeat: Number(price),
        fromLatitude: fromCoords?.lat || routeInfo?.from?.lat,
        fromLongitude: fromCoords?.lng || routeInfo?.from?.lng,
        toLatitude: toCoords?.lat || routeInfo?.to?.lat,
        toLongitude: toCoords?.lng || routeInfo?.to?.lng,
        distanceKm: routeInfo?.distanceKm,
        estimatedDurationMin: routeInfo?.durationMin,
        vehicleNumber: vehicleNumber || undefined,
      };

      await createRide(token, payload);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Ride Published", "Your ride was published successfully.");

      // reset
      setFromAddress("");
      setToAddress("");
      setFromCoords(null);
      setToCoords(null);
      setRouteInfo(null);
      setRouteConfirmed(false);
      setPrice("");
      setSeats("1");
      setVehicleNumber("");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not publish ride. Try again.");
    } finally {
      setPublishing(false);
    }
  };

  // celebrate haptic + confetti logic (kept)
  useEffect(() => {
    if (!showBlast) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const t2 = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 180);
    const t = setTimeout(() => setShowBlast(false), 1600);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [showBlast]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* intro */}
      <Modal visible={showIntro} transparent animationType="fade">
        <View style={styles.modalBg}>
          <FallingEmojis />
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: fade,
                transform: [{ translateY: slide }, { scale }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="heart-outline" size={34} color="#1E40AF" />
            </View>

            <Text style={styles.title}>Thank you 💙</Text>

            <Text style={styles.message}>
              Thank you for making your <Text style={styles.bold}>vacant seats</Text> someone’s destination.
            </Text>

            <Text style={styles.signature}>— Team MOVE</Text>

            <Pressable
              style={styles.continueBtn}
              onPress={() => {
                setShowIntro(false);
                setTimeout(() => setShowBlast(true), 50);
              }}
            >
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {showBlast && (
        <View style={styles.globalConfettiContainer} pointerEvents="none">
          <Confetti onComplete={() => setShowBlast(false)} />
        </View>
      )}

      <View style={styles.container}>
        <Text style={styles.logo}>Offer a ride</Text>

        {/* FROM */}
        <View style={styles.row}>
          <TextInput
            placeholder="Pickup (full address or place)"
            value={fromAddress}
            onChangeText={(v) => {
              setFromAddress(v);
              setRouteConfirmed(false);
              setRouteInfo(null);
            }}
            style={[styles.input, routeConfirmed && styles.inputDisabled]}
            editable={!routeConfirmed}
          />
          <Pressable style={styles.iconBtn} onPress={useCurrentLocation}>
            <Ionicons name="location-outline" size={22} color="#1E40AF" />
          </Pressable>

          <View style={{ justifyContent: "center", marginLeft: 8 }}>
            <Ionicons name={routeConfirmed ? "checkmark-circle" : "location-outline"} size={20} color={routeConfirmed ? "green" : "#6B7280"} />
          </View>
        </View>

        {/* TO */}
        <View style={[styles.row, { marginTop: 10 }]}>
          <TextInput
            placeholder="Drop (full address or place)"
            value={toAddress}
            onChangeText={(v) => {
              setToAddress(v);
              setRouteConfirmed(false);
              setRouteInfo(null);
            }}
            style={[styles.input, routeConfirmed && styles.inputDisabled]}
            editable={!routeConfirmed}
          />

          <View style={{ justifyContent: "center", marginLeft: 8 }}>
            <Ionicons name={routeConfirmed ? "checkmark-circle" : "location-outline"} size={20} color={routeConfirmed ? "green" : "#6B7280"} />
          </View>
        </View>

        {/* Preview route button (uses prepared route if available) */}
        {!routeConfirmed && (
          <View style={{ marginTop: 12 }}>
            <Pressable style={styles.previewBtn} onPress={openRoutePreview} disabled={geocoding || preparingRoute}>
              <Text style={{ color: "#1E40AF", fontWeight: "800" }}>{geocoding || preparingRoute ? "Preparing map..." : "Preview route"}</Text>
            </Pressable>
          </View>
        )}

        {/* Remaining fields (unlock after confirmation) */}
        {routeConfirmed && routeInfo && (
          <>
            <Text style={{ marginTop: 16, fontWeight: "800" }}>Route confirmed</Text>
            <Text style={{ color: "#6B7280", marginTop: 6 }}>
              {fromAddress.split(",")[0]} → {toAddress.split(",")[0]} • {routeInfo.distanceKm.toFixed(1)} km • {Math.round(routeInfo.durationMin)} mins
            </Text>

            <TextInput placeholder="Departure time (HH:MM)" value={time} onChangeText={setTime} style={[styles.input, { marginTop: 12 }]} />
            <TextInput placeholder="Seats" value={seats} onChangeText={setSeats} style={styles.input} />
            <TextInput placeholder="Price per seat" value={price} onChangeText={setPrice} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="Vehicle number (optional)" value={vehicleNumber} onChangeText={setVehicleNumber} style={styles.input} />
          </>
        )}

        <Pressable
          style={[styles.publishBtn, (!routeConfirmed || publishing) && { opacity: 0.6 }]}
          onPress={() => {
            if (!routeConfirmed) {
              Alert.alert("Confirm route", "Please confirm the route before publishing.");
              return;
            }
            Alert.alert(
              "Confirm & Publish",
              `From: ${fromAddress}\nTo: ${toAddress}\nDate: ${date.toLocaleDateString()}\nTime: ${formatTime(time)}\nDistance: ${routeInfo?.distanceKm.toFixed(1)} km\nSeats: ${seats}\nPrice: ₹${price}`,
              [{ text: "Edit", style: "cancel" }, { text: "Publish", onPress: submitRide }]
            );
          }}
          disabled={!routeConfirmed || publishing}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>{publishing ? "Publishing..." : "Publish ride"}</Text>
        </Pressable>
      </View>

      {/* Show map with pre-fetched route so map mounts instantly */}
      {showMap && routeInfo && fromCoords && toCoords && (
        <RoutePreviewMap
          fromCoords={fromCoords}
          toCoords={toCoords}
          route={routeInfo}
          onCancel={() => {
            setShowMap(false);
            setRouteConfirmed(false);
            setRouteInfo(null);
          }}
          onConfirm={(route: any) => {
            // route object includes from/to
            setRouteInfo(route);
            setRouteConfirmed(true);
            setShowMap(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },

  modalCard: { width: "85%", backgroundColor: "#fff", borderRadius: 26, padding: 28, alignItems: "center" },

  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginBottom: 18 },

  title: { fontSize: 26, fontWeight: "900", color: "#111827", marginBottom: 10 },

  message: { fontSize: 16, color: "#374151", textAlign: "center", lineHeight: 24 },

  bold: { fontWeight: "800", color: "#1E40AF" },

  signature: { marginTop: 12, fontSize: 14, color: "#6B7280", fontStyle: "italic" },

  continueBtn: { marginTop: 24, backgroundColor: "#1E40AF", paddingVertical: 14, paddingHorizontal: 42, borderRadius: 18 },

  continueText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  logo: { fontSize: 22, fontWeight: "900", color: "#1E40AF", marginBottom: 18 },

  row: { flexDirection: "row", alignItems: "center" },

  input: { flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, marginBottom: 6 },

  inputDisabled: { backgroundColor: "#F3F4F6" },

  iconBtn: { marginLeft: 8, backgroundColor: "#EFF6FF", padding: 10, borderRadius: 10 },

  previewBtn: { marginTop: 8, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1E40AF" },

  publishBtn: { marginTop: 20, backgroundColor: "#1E40AF", paddingVertical: 16, borderRadius: 16, alignItems: "center" },

  globalConfettiContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
});