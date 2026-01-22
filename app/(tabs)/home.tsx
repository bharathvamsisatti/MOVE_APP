import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getMyBookings } from "../../services/rides";

/* ---------------- Types ---------------- */
type Booking = {
  id: number;
  passengerName: string;
  phoneNumber: string;
  seatsBooked: number;
  finalPrice?: number;
  bookTime?: string;
  status: "CONFIRMED" | "CANCELLED" | string;
  ride?: {
    id: number;

    // ✅ backend might send any of these keys
    departureLocation?: string;
    destinationLocation?: string;
    departure?: string;
    destination?: string;

    departureDate?: string;
    departureTime?: string;
    pricePerSeat?: number;
  };
};
/* -------------------------------------- */

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const shake = useRef(new Animated.Value(0)).current;
  const [showOffer, setShowOffer] = useState(false);

  // Upcoming bookings
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);

  const name = user?.userName || user?.email?.split("@")[0] || "Guest";

  useEffect(() => {
    initLocation();
    loadHomeData();
  }, []);

  /* ---------------- Location ---------------- */
  const initLocation = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationGranted(false);
      return;
    }
    setLocationGranted(true);
    loadLocation();
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setLocationGranted(true);
      loadLocation();
    }
  };

  const loadLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync(loc.coords);

      if (!geo || geo.length === 0) {
        setCity("Your location");
        return;
      }

      const place = geo[0];
      const cityName =
        place.city || place.subregion || place.region || "Your location";

      setCity(cityName);
      setFrom(cityName);
    } catch (err) {
      console.log("Location error:", err);
      setCity("Your location");
    }
  };
  /* ----------------------------------------- */

  /* ---------------- Home Data ---------------- */
  const loadUpcomingBookings = async () => {
    if (!token) {
      setUpcomingBookings([]);
      return;
    }

    const data = await getMyBookings(token);
    const list: Booking[] = Array.isArray(data) ? data : [];

    // only confirmed bookings
    const confirmed = list.filter(
      (b) => (b.status || "").toUpperCase() === "CONFIRMED"
    );

    // sort by bookTime latest first
    confirmed.sort((a, b) => {
      const t1 = new Date(a.bookTime || "").getTime();
      const t2 = new Date(b.bookTime || "").getTime();
      return (isNaN(t2) ? 0 : t2) - (isNaN(t1) ? 0 : t1);
    });

    setUpcomingBookings(confirmed);
  };

  const loadHomeData = async () => {
    try {
      setBookingsLoading(true);
      await loadUpcomingBookings();
    } catch (e) {
      Alert.alert("Error", "Failed to load home data");
    } finally {
      setBookingsLoading(false);
    }
  };
  /* ------------------------------------------ */

  const shakeGift = () => {
    Animated.sequence([
      Animated.timing(shake, {
        toValue: -10,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 10,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setShowOffer(true));
  };

  const onSearch = () => {
    if (!from || !to) return;
    router.push({
      pathname: "/(tabs)/find-ride",
      params: { from, to },
    });
  };

  const RideMiniCard = ({
    title,
    subtitle,
    rightText,
    onPress,
  }: {
    title: string;
    subtitle: string;
    rightText?: string;
    onPress?: () => void;
  }) => {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.miniCard,
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.miniTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.miniSub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {rightText ? <Text style={styles.miniRight}>{rightText}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color="#999" />
      </Pressable>
    );
  };

  /* ---------- LOCATION PERMISSION UI ---------- */
  if (locationGranted === false) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="location-outline" size={64} color="#1E40AF" />
        <Text style={styles.enableTitle}>Enable location</Text>
        <Text style={styles.enableText}>
          Location helps us find rides near you.
        </Text>

        <Pressable style={styles.enableBtn} onPress={requestPermission}>
          <Text style={styles.enableBtnText}>Enable Location</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (locationGranted === null) return null;

  /* ---------- HOME ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logo}>MOVE</Text>
            <Pressable style={styles.locationPill}>
              <Ionicons name="location-outline" size={14} color="#1E40AF" />
              <Text style={styles.locationText}>{city || "Fetching..."}</Text>
            </Pressable>
          </View>

          <Pressable onPress={shakeGift}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: shake.interpolate({
                      inputRange: [-20, 20],
                      outputRange: ["-20deg", "20deg"],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="gift-outline" size={26} color="#1E40AF" />
            </Animated.View>
          </Pressable>
        </View>

        {/* GREETING */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>Hi, {name} 👋</Text>
          <Text style={styles.subtitle}>Where are you heading today?</Text>
        </View>

        {/* FIND RIDE CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Find a ride</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="radio-button-on" size={14} color="#22C55E" />
            <TextInput
              placeholderTextColor="#9CA3AF"
              placeholder="From"
              value={from}
              onChangeText={setFrom}
              style={styles.input}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <TextInput
              placeholderTextColor="#9CA3AF"
              placeholder="To"
              value={to}
              onChangeText={setTo}
              style={styles.input}
            />
          </View>

          <Pressable
            disabled={!from || !to}
            style={[styles.searchBtn, (!from || !to) && { opacity: 0.6 }]}
            onPress={onSearch}
          >
            <Text style={styles.searchText}>Search rides</Text>
          </Pressable>
        </View>

        {/* UPCOMING RIDES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming rides</Text>

          {/* ✅ FIXED ROUTE */}
          <Pressable onPress={() => router.push("/rides/myrides")}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {bookingsLoading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator />
            <Text style={styles.loaderText}>Loading rides...</Text>
          </View>
        ) : upcomingBookings.length === 0 ? (
          <Text style={styles.empty}>
            No rides yet. Start by searching for one.
          </Text>
        ) : (
          upcomingBookings.slice(0, 2).map((b) => {
            // ✅ FIX: support both keys
            const fromLoc =
              b?.ride?.departureLocation || b?.ride?.departure || "Departure";

            const toLoc =
              b?.ride?.destinationLocation || b?.ride?.destination || "Destination";

            return (
              <RideMiniCard
                key={b.id}
                title={`${fromLoc} → ${toLoc}`}
                subtitle={`Seats: ${b.seatsBooked} • Status: ${b.status}`}
                rightText={b.finalPrice ? `₹${b.finalPrice}` : undefined}
                onPress={() =>
                  router.push({
                    pathname: "/rides/booking-details",
                    params: { booking: JSON.stringify(b) },
                  })
                }
              />
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* OFFER MODAL */}
      <Modal visible={showOffer} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🎉 Welcome Offer</Text>
            <Text style={styles.modalText}>
              Get <Text style={{ fontWeight: "800" }}>10% off</Text> on your
              first ride
            </Text>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowOffer(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Awesome!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 20 },

  /* HEADER */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },

  logo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E40AF",
    letterSpacing: 1,
  },

  locationPill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  locationText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },

  /* HERO */
  hero: { marginTop: 16 },

  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#6B7280",
  },

  /* CARD */
  card: {
    marginTop: 26,
    backgroundColor: "#F9FAFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 6,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
    color: "#111827",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  input: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  searchBtn: {
    marginTop: 14,
    backgroundColor: "#1E40AF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  searchText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  /* Sections */
  sectionHeader: {
    marginTop: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  viewAll: {
    color: "#1E40AF",
    fontWeight: "800",
  },

  empty: { marginTop: 10, color: "#6B7280" },

  loaderRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loaderText: {
    color: "#6B7280",
    fontWeight: "700",
  },

  miniCard: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  miniTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
  },

  miniSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },

  miniRight: {
    fontWeight: "900",
    color: "#16A34A",
  },

  /* PERMISSION */
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  enableTitle: { fontSize: 22, fontWeight: "800", marginTop: 16 },
  enableText: { color: "#6B7280", textAlign: "center", marginTop: 8 },
  enableBtn: {
    marginTop: 20,
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  enableBtnText: { color: "#fff", fontWeight: "700" },

  /* MODAL */
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 22,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalText: { marginTop: 8, color: "#374151" },
  closeBtn: {
    marginTop: 16,
    backgroundColor: "#1E40AF",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 14,
  },
});
