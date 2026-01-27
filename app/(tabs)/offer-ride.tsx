import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  BackHandler,
  Alert,
  FlatList,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import LoadingOverlay from "../../components/LoadingOverlay";
// Using WebView + Leaflet/OpenStreetMap (Expo-safe)
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFER_RIDE_DRAFT_KEY = "offer_ride_draft_v1";
// Set this to your backend URL (e.g. "https://api.example.com" or "http://10.0.2.2:8080")
const API_BASE_URL = "https://dev-moveservices.mroads.com";

type Step = 0 | 1 | 2 | 3;

export default function OfferRide() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  // STEP-1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // STEP-2
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  // Lifted coords so they can be published
  const [fromCoords, setFromCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Phase-1: local map coords (centers marker). Kept separate so we can control map behavior.
  const [mapCoords, setMapCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // ROUTE / ETA / DISTANCE (frontend-only via OSRM)
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  // routeCoords as OSRM returns: array of [lon, lat]
  const [routeCoords, setRouteCoords] = useState<number[][]>([]);

  // STEP-3 (Schedule) - keep empty initially
  const [totalSeats, setTotalSeats] = useState<number | "">("");
  const [availableSeats, setAvailableSeats] = useState<number | "">("");
  const [pricePerSeat, setPricePerSeat] = useState<number | "">("");
  const [rideDate, setRideDate] = useState<string>("");
  const [rideTime, setRideTime] = useState<string>("");

  // controls confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // prevent double publish
  const [publishing, setPublishing] = useState<boolean>(false);

  // Location permission state (fix)
  const [locationGranted, setLocationGranted] = useState<boolean>(false);

  // Restore draft on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(OFFER_RIDE_DRAFT_KEY);
        if (!saved) return;
        const draft = JSON.parse(saved);

        // If draft exists, resume at draft.step; default to 1 (skip intro) instead of 0
        setStep((draft.step ?? 1) as Step);
        setName(draft.name ?? "");
        setPhone(draft.phone ?? "");
        setVehicleNumber(draft.vehicleNumber ?? "");
        setFromLocation(draft.fromLocation ?? "");
        setToLocation(draft.toLocation ?? "");
        // load as empty if not present (remove previous defaults)
        setTotalSeats(draft.totalSeats ?? "");
        setAvailableSeats(draft.availableSeats ?? "");
        setPricePerSeat(draft.pricePerSeat ?? "");
        setRideDate(draft.rideDate ?? "");
        setRideTime(draft.rideTime ?? "");
        // coords may have been saved in older drafts - restore if available
        if (draft.fromCoords) setFromCoords(draft.fromCoords);
        if (draft.toCoords) setToCoords(draft.toCoords);
      } catch (e) {
        // ignore corrupted draft
      }
    })();
  }, []);

  // check permission state on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationGranted(status === "granted");
      } catch {
        setLocationGranted(false);
      }
    })();
  }, []);

  // convenience function to request permission (fix)
  const requestLocation = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === "granted");
      return status === "granted";
    } catch (e) {
      console.log("requestLocation error", e);
      setLocationGranted(false);
      return false;
    }
  };

  // keep mapCoords in sync when draft/fromCoords restores or changes
  useEffect(() => {
    if (fromCoords && Number.isFinite(fromCoords.latitude) && Number.isFinite(fromCoords.longitude)) {
      setMapCoords(fromCoords);
    }
  }, [fromCoords]);

  // Clear route when fromCoords changes (UX safety)
  useEffect(() => {
    setDistanceKm(null);
    setEtaMin(null);
    setRouteCoords([]);
  }, [fromCoords]);

  // Auto-save draft on meaningful changes (do NOT save when on intro step 0)
  useEffect(() => {
    if (step === 0) return;

    const draft: any = {
      step,
      name,
      phone,
      vehicleNumber,
      fromLocation,
      toLocation,
      totalSeats,
      availableSeats,
      pricePerSeat,
      rideDate,
      rideTime,
      fromCoords,
      toCoords,
    };

    AsyncStorage.setItem(OFFER_RIDE_DRAFT_KEY, JSON.stringify(draft)).catch(() => {
      // silent fail
    });
  }, [
    step,
    name,
    phone,
    vehicleNumber,
    fromLocation,
    toLocation,
    totalSeats,
    availableSeats,
    pricePerSeat,
    rideDate,
    rideTime,
    fromCoords,
    toCoords,
  ]);

  // Hardware back handler (Android fallback) with confirmation on Step-1
  useEffect(() => {
    const onBackPress = () => {
      if (step === 1) {
        Alert.alert(
          "Exit?",
          "Your ride details will be lost.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", style: "destructive", onPress: () => router.back() },
          ],
          { cancelable: true }
        );
        return true; // handled
      }

      if (step > 0) {
        setStep((prev) => ((prev - 1) as Step));
        return true; // handled
      }

      return false; // allow OS to handle (exit / goBack)
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [step, router]);

  const normalize = (t: string) => t.trim().replace(/\s+/g, " ");

  // Try a few common AsyncStorage keys for auth token
  const getAuthToken = async (): Promise<string | null> => {
    const keys = ["auth_token", "token", "userToken", "jwt", "access_token"];
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k);
      if (v) return v;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader
        onBack={() => {
          if (step === 1) {
            Alert.alert(
              "Exit?",
              "Your ride details will be lost.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Exit", style: "destructive", onPress: () => router.back() },
              ],
              { cancelable: true }
            );
            return;
          }

          if (step > 0) {
            setStep((prev) => ((prev - 1) as Step));
          } else {
            router.back(); // go back via router at root
          }
        }}
      />

      {/* Simple step progress indicator */}
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              step >= i ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      <IntroModal visible={step === 0} onContinue={() => setStep(1)} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {step === 1 && (
          <VehicleStep
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            vehicleNumber={vehicleNumber}
            setVehicleNumber={setVehicleNumber}
            onContinue={() => {
              if (!name || phone.length < 10) return;
              setStep(2);
            }}
          />
        )}

        {step === 2 ? (
          <RouteStep
            key="route"
            fromLocation={fromLocation}
            toLocation={toLocation}
            setFromLocation={setFromLocation}
            setToLocation={setToLocation}
            onContinue={() => {
              // Require both pickup and drop selected before moving to schedule
              if (!fromCoords || !toCoords) {
                Alert.alert("Route missing", "Please select pickup and drop location.");
                return;
              }
              setStep(3);
            }}
            fromCoords={fromCoords}
            setFromCoords={setFromCoords}
            toCoords={toCoords}
            setToCoords={setToCoords}
            mapCoords={mapCoords}
            setMapCoords={setMapCoords}
            distanceKm={distanceKm}
            etaMin={etaMin}
            routeCoords={routeCoords}
            setDistanceKm={setDistanceKm}
            setEtaMin={setEtaMin}
            setRouteCoords={setRouteCoords}
            locationGranted={locationGranted}
            requestLocation={requestLocation}
          />
        ) : null}

        {step === 3 && (
          <ScheduleStep
            totalSeats={totalSeats}
            setTotalSeats={setTotalSeats}
            availableSeats={availableSeats}
            setAvailableSeats={setAvailableSeats}
            pricePerSeat={pricePerSeat}
            setPricePerSeat={setPricePerSeat}
            rideDate={rideDate}
            setRideDate={setRideDate}
            rideTime={rideTime}
            setRideTime={setRideTime}
            onConfirm={() => setShowConfirmModal(true)}
          />
        )}
      </KeyboardAvoidingView>

      <ConfirmPublishModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onPublish={async () => {
          if (publishing) return;
          setPublishing(true);

          try {
            const token = await getAuthToken();
            if (!token) {
              Alert.alert("Login required", "Please login again.");
              return;
            }

            const normalizeLoc = (s: string) => (s ? normalize(s) : null);

            // SAFE convert: do NOT coerce "" -> 0. Send null when empty so backend can detect missing.
            const payload: any = {
              driverName: name.trim(),
              phoneNumber:
                phone.trim().length === 10 ? `+91${phone.trim()}` : phone.trim() || null,
              vehicleNumber: vehicleNumber?.trim() || null,
              totalSeats: totalSeats === "" ? null : Number(totalSeats),
              availableSeats: availableSeats === "" ? null : Number(availableSeats),
              pricePerSeat: pricePerSeat === "" ? null : Number(pricePerSeat),
              departureLocation: normalizeLoc(fromLocation),
              destinationLocation: normalizeLoc(toLocation),
              departureDate: rideDate,
              departureTime: rideTime,
              fromLatitude: fromCoords ? fromCoords.latitude : null,
              fromLongitude: fromCoords ? fromCoords.longitude : null,
              toLatitude: toCoords ? toCoords.latitude : null,
              toLongitude: toCoords ? toCoords.longitude : null,

              // ✅ FIXED KEY — match backend field name exactly
              distanceKm: distanceKm ?? null,

              vehicleImagePath: null,
            };

            const res = await fetch(`${API_BASE_URL}/api/rides/add`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const text = await res.text();
              throw new Error(text || "Failed to publish ride");
            }

            // Clear saved draft only AFTER success
            await AsyncStorage.removeItem(OFFER_RIDE_DRAFT_KEY).catch(() => {});

            setShowConfirmModal(false);  
            router.replace("/thankyou");
          } catch (e: any) {
            Alert.alert("Publish failed", e.message || "Something went wrong");
          } finally {
            setPublishing(false);
          }
        }}
        data={{
          name,
          phone,
          vehicleNumber,
          fromLocation,
          toLocation,
          totalSeats,
          availableSeats,
          pricePerSeat,
          rideDate,
          rideTime,
          fromCoords,
          toCoords,
          routeCoords,
          distanceKm, // include kms in data passed to modal
        }}
        publishing={publishing}
      />
    </SafeAreaView>
  );
}

/* ───────── STEP-0 MODAL ───────── */

function IntroModal({
  visible,
  onContinue,
}: {
  visible: boolean;
  onContinue: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.heartCircle}>
            <Ionicons name="heart" size={28} color="#2563EB" />
          </View>

          <Text style={styles.modalTitle}>Thank you 💙</Text>
          <Text style={styles.modalText}>
            Thank you for making your{" "}
            <Text style={styles.boldBlue}>vacant seats</Text>{" "}
            someone’s destination.
          </Text>
          <Text style={styles.teamText}>— Team MOVE</Text>

          <Pressable style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── STEP-1 VEHICLE ───────── */

function VehicleStep({
  name,
  setName,
  phone,
  setPhone,
  vehicleNumber,
  setVehicleNumber,
  onContinue,
}: any) {
  // stricter validation: exactly 10 digits for mobile
  const isValid = name.length > 0 && /^\d{10}$/.test(phone);

  return (
    <View style={styles.container}>
      <Text style={styles.bigTitle}>Ride Giver</Text>
      <Text style={styles.subtitle}>Add your details</Text>

      <View style={styles.vehicleCard}>
        <Image
          source={require("../../assets/images/car-img.jpeg")}
          style={styles.carImage}
          resizeMode="contain"
        />
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      </View>

      <TextInput
        placeholderTextColor="#9CA3AF"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <View style={styles.phoneRow}>
        <Text style={styles.countryCode}>🇮🇳 +91</Text>
        <TextInput
          placeholderTextColor="#9CA3AF"
          placeholder="Mobile number"
          keyboardType="number-pad"
          value={phone}
          onChangeText={(t: string) => {
            // keep only digits
            const digits = t.replace(/\D/g, "");
            setPhone(digits);
          }}
          style={styles.phoneInput}
        />
      </View>

      <TextInput
        placeholderTextColor="#9CA3AF"
        placeholder="Vehicle registration number"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />

      <Pressable
        style={[styles.primaryBtn, !isValid && { backgroundColor: "#9CA3AF" }]}
        disabled={!isValid}
        onPress={onContinue}
      >
        <Text style={styles.primaryText}>Continue</Text>
      </Pressable>
    </View>
  );
}

/* ───────── STEP-2 ROUTE (Phase-1: FROM-focused) ───────── */

function RouteStep({
  fromLocation,
  toLocation,
  setFromLocation,
  setToLocation,
  onContinue,
  fromCoords,
  setFromCoords,
  toCoords,
  setToCoords,
  mapCoords,
  setMapCoords,
  distanceKm,
  etaMin,
  routeCoords,
  setDistanceKm,
  setEtaMin,
  setRouteCoords,
  locationGranted,
  requestLocation,
}: any) {
  // Safety guard: protect against invalid props (helps after a previous native crash)
  if (typeof setFromCoords !== "function" || typeof setToCoords !== "function") {
    return null;
  }

  const [geoLoading, setGeoLoading] = useState(false);

  // Separate suggestions for FROM and TO
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);

  const typingRefFrom = useRef<any>(null);
  const typingRefTo = useRef<any>(null);

  const geocodeControllerFromRef = useRef<AbortController | null>(null);
  const geocodeControllerToRef = useRef<AbortController | null>(null);

  // cache last query to prevent duplicate identical calls
  const lastQueryRef = useRef<{ FROM?: string; TO?: string }>({});

  // guard OSRM calls to avoid rate limiting / duplicate work
  const lastRouteRef = useRef<string | null>(null);

  // Helper: normalize text used for geocoding
  const normalizeInput = (t: string) => t.trim().replace(/\s+/g, " ");

  // OSRM routing helper (frontend)
  type RouteInfo = {
    distanceKm: number;
    durationMin: number;
    geometry: number[][];
  };

  const getRouteInfo = async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<RouteInfo | null> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes || !json.routes.length) return null;

      const route = json.routes[0];

      return {
        distanceKm: +(route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60),
        geometry: route.geometry.coordinates, // [lon, lat]
      };
    } catch (e) {
      console.log("Route error", e);
      return null;
    }
  };

  // ✅ Auto calculate route whenever both coords are ready
  useEffect(() => {
    const run = async () => {
      if (!fromCoords || !toCoords) return;

      const key = `${fromCoords.latitude},${fromCoords.longitude}-${toCoords.latitude},${toCoords.longitude}`;
      if (lastRouteRef.current === key) return;

      lastRouteRef.current = key;

      const info = await getRouteInfo(fromCoords, toCoords);
      if (!info) return;

      setDistanceKm(info.distanceKm);
      setEtaMin(info.durationMin);
      setRouteCoords(info.geometry);

      const mid = info.geometry[Math.floor(info.geometry.length / 2)];
      if (mid && mid.length >= 2) {
        const [midLon, midLat] = mid;
        setMapCoords({ latitude: midLat, longitude: midLon });
      }
    };

    run();
    // only when coords change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCoords, toCoords]);

  // 1️⃣ Get device location and auto-fill FROM (safe with mounted flag + only when empty)
  useEffect(() => {
    if (fromLocation) return; // don't override user-entered value

    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          // we don't force prompt here; requestLocation is available via GPS icon
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(loc.coords);

        if (!isMounted) return;

        const place =
          geo[0]?.city ||
          geo[0]?.subregion ||
          geo[0]?.region ||
          "Current location";

        setFromLocation(place);
        setFromCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setMapCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.log("Location error", e);
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only (do not re-run if user edits)

  // cleanup abort controllers on unmount (stability)
  useEffect(() => {
    return () => {
      if (geocodeControllerFromRef.current) {
        geocodeControllerFromRef.current.abort();
        geocodeControllerFromRef.current = null;
      }
      if (geocodeControllerToRef.current) {
        geocodeControllerToRef.current.abort();
        geocodeControllerToRef.current = null;
      }
    };
  }, []);

  // Shared helper for geocoding suggestions (Nominatim) but separate debounces and controllers
  const fetchGeoSuggestions = async (text: string, type: "FROM" | "TO") => {
    if (text.length < 3) {
      if (type === "FROM") setFromSuggestions([]);
      else setToSuggestions([]);
      // clear lastQuery to allow future re-queries if user retypes
      lastQueryRef.current[type] = undefined;
      return;
    }

    // prevent duplicate identical query
    if (lastQueryRef.current[type] === text) return;
    lastQueryRef.current[type] = text;

    const ref = type === "FROM" ? geocodeControllerFromRef : geocodeControllerToRef;

    if (ref.current) {
      ref.current.abort();
      ref.current = null;
    }

    const controller = new AbortController();
    ref.current = controller;

    try {
      setGeoLoading(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          text
        )}&format=json&limit=5`,
        {
          headers: {
            "User-Agent": "MOVE-App/1.0",
          },
          signal: controller.signal,
        }
      );

      const data = await res.json();
      if (Array.isArray(data)) {
        if (type === "FROM") setFromSuggestions(data);
        else setToSuggestions(data);
      } else {
        if (type === "FROM") setFromSuggestions([]);
        else setToSuggestions([]);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log("Nominatim error", e);
      if (type === "FROM") setFromSuggestions([]);
      else setToSuggestions([]);
    } finally {
      setGeoLoading(false);
      ref.current = null;
    }
  };

  // 3a️⃣ Convert FROM text → suggestions (debounced)
  const resolveFromLocation = (text: string) => {
    setFromLocation(text);

    // Phase-1: do not clear coords while typing. Map updates only on selection.
    if (typingRefFrom.current) clearTimeout(typingRefFrom.current);

    typingRefFrom.current = setTimeout(() => {
      const clean = normalizeInput(text);
      fetchGeoSuggestions(clean, "FROM");
    }, 400);
  };

  // 3b️⃣ Convert TO text → suggestions (debounced)
  const resolveToLocation = (text: string) => {
    setToLocation(text);

    if (typingRefTo.current) clearTimeout(typingRefTo.current);

    typingRefTo.current = setTimeout(() => {
      const clean = normalizeInput(text);
      fetchGeoSuggestions(clean, "TO");
    }, 400);
  };

  // Phase-1 pickSuggestion: update coords & map only for FROM; TO fills text & calculates route if possible
  const pickSuggestion = async (item: any, type: "FROM" | "TO") => {
    const ref = type === "FROM" ? geocodeControllerFromRef : geocodeControllerToRef;
    if (ref.current) {
      ref.current.abort();
      ref.current = null;
    }

    if (type === "FROM") {
      const lat = Number(item.lat);
      const lon = Number(item.lon);

      setFromLocation(item.display_name);

      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        setFromCoords({ latitude: lat, longitude: lon });
        setMapCoords({ latitude: lat, longitude: lon });
      }

      setFromSuggestions([]);
      // clear any existing route as origin changed
      setDistanceKm(null);
      setEtaMin(null);
      setRouteCoords([]);
      lastQueryRef.current.FROM = undefined;
      lastQueryRef.current.TO = undefined;
      lastRouteRef.current = null;
    } else {
      // set toCoords now to avoid future bugs even if not used in phase-1
      const lat = Number(item.lat);
      const lon = Number(item.lon);

      setToLocation(item.display_name);

      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const coords = { latitude: lat, longitude: lon };
        setToCoords(coords);

        // route will be calculated by the useEffect watching fromCoords+toCoords
      }

      setToSuggestions([]);
      lastQueryRef.current.TO = undefined;
    }

    // dismiss keyboard after state update (avoid keyboardDidHide races)
    requestAnimationFrame(() => Keyboard.dismiss());
  };

  // Build WebView HTML pointing to Leaflet + OSM tiles + drawn polyline if routeCoords exist.
  const buildMapHtml = () => {
    // polyline: if we have routeCoords (OSRM gives [lon, lat]), convert to [lat, lon]
    const routeLatLon =
      routeCoords && routeCoords.length > 0
        ? JSON.stringify(routeCoords.map(([lon, lat]) => [lat, lon]))
        : "null";

    const centerLat = mapCoords?.latitude ?? 17.385044;
    const centerLon = mapCoords?.longitude ?? 78.486671;
    const zoom = 12;

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${centerLat}, ${centerLon}], ${zoom});
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);

            ${mapCoords ? `L.marker([${mapCoords.latitude}, ${mapCoords.longitude}]).addTo(map);` : ""}

            const route = ${routeLatLon};
            if (route && route.length) {
              const line = L.polyline(route, { color: 'blue', weight: 5 }).addTo(map);
              map.fitBounds(line.getBounds(), { padding: [20, 20] });
            } else {
              map.setView([${centerLat}, ${centerLon}], ${zoom});
            }
          </script>
        </body>
      </html>`;
  };

  // Memoize map HTML to avoid unnecessary full reloads
  const mapHtml = useMemo(() => buildMapHtml(), [
    mapCoords ? `${mapCoords.latitude},${mapCoords.longitude}` : "null",
    JSON.stringify(routeCoords),
    distanceKm,
    etaMin,
  ]);

  // Phase-1 validation: require origin and destination selected.
  const isValid = !!fromCoords && !!toCoords;

  return (
    <View style={styles.container}>
      {geoLoading && <LoadingOverlay />}

      <Text style={styles.bigTitle}>Let’s create your ride</Text>
      <Text style={styles.subtitle}>Your address is kept private</Text>

      {/* FROM (AUTO, now editable) with GPS icon */}
      <View style={{ position: "relative" }}>
        <TextInput
          placeholderTextColor="#9CA3AF"
          placeholder="Pickup location"
          value={fromLocation}
          onChangeText={resolveFromLocation}
          style={[styles.input, { backgroundColor: "#F9FAFB" }]}
        />

        <Pressable
          style={{ position: "absolute", right: 14, top: 14 }}
          onPress={async () => {
            try {
              // Use centralized requestLocation to set permission state
              let ok = locationGranted;
              if (!ok) {
                ok = await requestLocation();
                if (!ok) {
                  return;
                }
              }

              const loc = await Location.getCurrentPositionAsync({});
              const geo = await Location.reverseGeocodeAsync(loc.coords);
              const label = geo[0]?.city || geo[0]?.region || "Current location";

              setFromLocation(label);
              setFromCoords({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
              setMapCoords({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            } catch (err) {
              console.log("GPS press error", err);
              Alert.alert("Location error", "Could not get current location.");
            }
          }}
        >
          <Ionicons name="locate" size={22} color="#2563EB" />
        </Pressable>
      </View>

      {/* FROM suggestions */}
      {fromSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={fromSuggestions}
            keyExtractor={(item) => String(item.place_id)}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <Pressable
                android_disableSound
                style={styles.suggestionItem}
                onPressIn={() => pickSuggestion(item, "FROM")}
              >
                <Text style={styles.suggestionText}>{item.display_name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* TO */}
      <TextInput
        placeholderTextColor="#9CA3AF"
        placeholder="Set drop location"
        value={toLocation}
        onChangeText={resolveToLocation}
        style={styles.input}
      />

      {/* TO suggestions */}
      {toSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={toSuggestions}
            keyExtractor={(item) => String(item.place_id)}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <Pressable
                android_disableSound
                style={styles.suggestionItem}
                onPressIn={() => pickSuggestion(item, "TO")}
              >
                <Text style={styles.suggestionText}>{item.display_name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Distance & ETA */}
      {distanceKm != null && etaMin != null && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "600", color: "#111827" }}>
            📏 {distanceKm} km • ⏱ {etaMin} mins
          </Text>
        </View>
      )}

      {/* MAP (Phase-1: always-mounted WebView OpenStreetMap + Leaflet to avoid native crash) */}
      <View style={styles.mapWrapper}>
        <WebView originWhitelist={["*"]} style={{ flex: 1 }} source={{ html: mapHtml }} />
      </View>

      <Pressable
        style={[styles.primaryBtn, !isValid && { backgroundColor: "#9CA3AF" }]}
        disabled={!isValid}
        onPress={onContinue}
      >
        <Text style={styles.primaryText}>Continue</Text>
      </Pressable>
    </View>
  );
}

/* ───────── STEP-3 SCHEDULE ───────── */

function ScheduleStep({
  totalSeats,
  setTotalSeats,
  availableSeats,
  setAvailableSeats,
  pricePerSeat,
  setPricePerSeat,
  rideDate,
  setRideDate,
  rideTime,
  setRideTime,
  onConfirm,
}: any) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Helper: check if selected date is today
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const [dd, mm, yyyy] = dateStr.split("-").map(Number);
    const selected = new Date(yyyy, mm - 1, dd);
    const today = new Date();

    return (
      selected.getDate() === today.getDate() &&
      selected.getMonth() === today.getMonth() &&
      selected.getFullYear() === today.getFullYear()
    );
  };

  // Auto-clamp availableSeats when totalSeats decreases
  useEffect(() => {
    const total = Number(totalSeats);
    const avail = Number(availableSeats);

    if (!Number.isNaN(total) && totalSeats !== "") {
      const maxAvail = Math.max(total - 1, 0);
      if (!Number.isNaN(avail) && availableSeats !== "" && avail > maxAvail) {
        setAvailableSeats(maxAvail);
      }
    }
  }, [totalSeats]);

  // Validation using numeric conversion (handles "" case)
  const total = Number(totalSeats);
  const avail = Number(availableSeats);
  const price = Number(pricePerSeat);

  // enforce availableSeats <= total - 1 (driver excluded)
  const maxAvail = Math.max(total - 1, 0);

  const isValid =
    total > 0 &&
    avail >= 1 &&
    avail <= maxAvail &&
    price > 0 &&
    !!rideDate &&
    !!rideTime;

  return (
    <View style={styles.container}>
      <Text style={styles.bigTitle}>Ride Details</Text>
      <Text style={styles.subtitle}>Seats, price & schedule</Text>

      {/* Seats */}
      <TextInput
        placeholder="Total seats"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={totalSeats === "" ? "" : String(totalSeats)}
        onChangeText={(v) => {
          if (v === "") {
            setTotalSeats("");
            return;
          }
          const num = Number(v);
          if (!Number.isNaN(num) && num >= 0) {
            setTotalSeats(num);

            // auto-fill availableSeats if empty → exclude driver
            if (availableSeats === "") {
              setAvailableSeats(Math.max(num - 1, 0));
            }
          }
        }}
        style={styles.input}
      />

      <TextInput
        placeholder="Available seats (exclude driver)"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={availableSeats === "" ? "" : String(availableSeats)}
        onChangeText={(v) => {
          if (v === "") {
            setAvailableSeats("");
            return;
          }
          const num = Number(v);
          if (!Number.isNaN(num) && num >= 0) {
            setAvailableSeats(num);
          }
        }}
        style={styles.input}
      />

      {/* Price */}
      <TextInput
        placeholder="Price per seat (₹)"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={pricePerSeat === "" ? "" : String(pricePerSeat)}
        onChangeText={(v) => {
          if (v === "") {
            setPricePerSeat("");
            return;
          }
          const num = Number(v);
          if (!Number.isNaN(num) && num >= 0) {
            setPricePerSeat(num);
          }
        }}
        style={styles.input}
      />

      {/* DATE PICKER */}
      <Pressable
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: rideDate ? "#111827" : "#9CA3AF" }}>
          {rideDate || "Select departure date"}
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          minimumDate={new Date()}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (!selectedDate) return;

            const formatted =
              selectedDate.getDate().toString().padStart(2, "0") +
              "-" +
              (selectedDate.getMonth() + 1).toString().padStart(2, "0") +
              "-" +
              selectedDate.getFullYear();

            setRideDate(formatted);
            setRideTime("");
          }}
        />
      )}

      {/* TIME PICKER */}
      <Pressable
        style={styles.input}
        onPress={() => {
          if (!rideDate) {
            Alert.alert("Select date first", "Please select a departure date first.");
            return;
          }
          setShowTimePicker(true);
        }}
      >
        <Text style={{ color: rideTime ? "#111827" : "#9CA3AF" }}>
          {rideTime || "Select ride time"}
        </Text>
      </Pressable>

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (!selectedTime) return;

            // ✅ FIX: Compare only HH:MM if date is today
            if (isToday(rideDate)) {
              const now = new Date();

              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              const selectedMinutes =
                selectedTime.getHours() * 60 + selectedTime.getMinutes();

              if (selectedMinutes <= nowMinutes) {
                Alert.alert(
                  "Invalid time",
                  "Please select a future time (after current time)."
                );
                return;
              }
            }

            const formatted =
              selectedTime.getHours().toString().padStart(2, "0") +
              ":" +
              selectedTime.getMinutes().toString().padStart(2, "0");

            setRideTime(formatted);
          }}
        />
      )}

      {/* CONFIRM */}
      <Pressable
        style={[
          styles.primaryBtn,
          !isValid && { backgroundColor: "#9CA3AF", opacity: 0.7 },
        ]}
        disabled={!isValid}
        onPress={onConfirm}
      >
        <Text style={styles.primaryText}>Confirm & Publish</Text>
      </Pressable>
    </View>
  );
}

/* ───────── CONFIRM & PUBLISH MODAL ───────── */

function ConfirmPublishModal({
  visible,
  onClose,
  onPublish,
  data,
  publishing,
}: {
  visible: boolean;
  onClose: () => void;
  onPublish: () => void;
  data: any;
  publishing?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Confirm Ride Details</Text>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>Driver</Text>
            <Text>
              {data.name} {data.phone ? `• +91 ${data.phone}` : ""}
            </Text>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>Vehicle</Text>
            <Text>{data.vehicleNumber}</Text>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>Route</Text>
            <Text numberOfLines={2}>
              {data.fromLocation} → {data.toLocation}
            </Text>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>Distance</Text>
            <Text>{data.distanceKm != null ? `📏 ${data.distanceKm} km` : "—"}</Text>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>Seats & Price</Text>
            <Text>
              {data.availableSeats}/{data.totalSeats} seats • ₹{data.pricePerSeat}/seat
            </Text>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>Schedule</Text>
            <Text>
              {data.rideDate} {data.rideTime ? `at ${data.rideTime}` : ""}
            </Text>
          </View>

          <View style={styles.confirmActions}>
            <Pressable style={styles.closeBtn} onPress={onClose} disabled={publishing}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>

            <Pressable
              style={[
                styles.publishBtn,
                publishing && { opacity: 0.6 },
              ]}
              onPress={onPublish}
              disabled={publishing}
            >
              <Text style={styles.publishText}>{publishing ? "Publishing..." : "Publish"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },

  heartCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  modalText: { textAlign: "center", color: "#374151" },
  boldBlue: { color: "#2563EB", fontWeight: "700" },
  teamText: { color: "#6B7280", marginVertical: 12 },

  continueBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
  },

  continueText: { color: "#fff", fontWeight: "800" },

  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  bigTitle: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#6B7280", marginBottom: 24 },

  vehicleCard: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  carImage: { width: "80%", height: 90 },

  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 14,
    color: "#111827", // ✅ IMPORTANT (text visible)
  backgroundColor: "#fff", // ✅ ensures placeholder contrast
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    marginBottom: 14,
  },

  countryCode: { paddingHorizontal: 14, fontSize: 16, fontWeight: "600" },
  phoneInput: { flex: 1, paddingVertical: 14, fontSize: 16 },

  mapWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },

  map: {
    flex: 1,
  },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  primaryText: { color: "#fff", fontWeight: "800" },

  // suggestions
  suggestionsContainer: {
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  suggestionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  suggestionText: { color: "#111827" },

  // progress
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  progressDotActive: { backgroundColor: "#16A34A" },
  progressDotInactive: { backgroundColor: "#E5E7EB" },

  // confirm modal styles
  confirmCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  confirmTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  confirmSection: { marginBottom: 10 },
  confirmLabel: { color: "#6B7280", fontSize: 13, marginBottom: 4, fontWeight: "700" },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  closeBtn: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
  },
  closeText: { color: "#111827", fontWeight: "700" },
  publishBtn: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    alignItems: "center",
  },
  publishText: { color: "#fff", fontWeight: "800" },
});