import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getMyBookings } from "../../services/rides";

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

    // ✅ correct keys from backend Ride entity
    departureLocation?: string;
    destinationLocation?: string;

    // (optional fallback if your backend still returns these)
    departure?: string;
    destination?: string;

    departureDate?: string;
    departureTime?: string;
    pricePerSeat?: number;
    vehicleName?: string;
    vehicleNumber?: string;
  };
};

export default function MyRides() {
  const router = useRouter();
  const { token } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    if (!token) return;
    const data = await getMyBookings(token);
    setBookings(Array.isArray(data) ? data : []);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await loadBookings();
    } catch (e: any) {
      if (e?.message === "SESSION_EXPIRED") {
        Alert.alert("Session Expired", "Please login again.");
        router.replace("/welcome");
        return;
      }
      Alert.alert("Error", "Failed to load My Rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadBookings();
    } catch {
      Alert.alert("Error", "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusChip = (status: string) => {
    const upper = (status || "").toUpperCase();

    if (upper === "CONFIRMED") {
      return { bg: "#E8F5E9", text: "#1B5E20", label: "CONFIRMED" };
    }
    if (upper === "CANCELLED") {
      return { bg: "#FFEBEE", text: "#B71C1C", label: "CANCELLED" };
    }

    return { bg: "#EEE", text: "#333", label: upper || "UNKNOWN" };
  };

  const TicketCard = ({ item }: { item: Booking }) => {
    const ride = item?.ride;

    // ✅ FIXED: correct keys
    const from =
      ride?.departureLocation || ride?.departure || "Departure";

    const to =
      ride?.destinationLocation || ride?.destination || "Destination";

    const chip = getStatusChip(item?.status);

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/rides/booking-details",
            params: {
              booking: JSON.stringify(item),
            },
          })
        }
        style={({ pressed }) => [styles.ticket, pressed && { opacity: 0.85 }]}
      >
        {/* top row */}
        <View style={styles.ticketTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.routeText} numberOfLines={1}>
              {from} <Text style={{ color: "#111" }}>→</Text> {to}
            </Text>

            <Text style={styles.subText}>
              Passenger: <Text style={styles.bold}>{item.passengerName}</Text>
            </Text>
          </View>

          <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.statusText, { color: chip.text }]}>
              {chip.label}
            </Text>
          </View>
        </View>

        {/* dashed line */}
        <View style={styles.dashedRow}>
          <View style={styles.circleCutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.circleCutRight} />
        </View>

        {/* bottom info */}
        <View style={styles.ticketBottom}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={18} color="#333" />
            <Text style={styles.infoText}>
              Seats: <Text style={styles.bold}>{item.seatsBooked}</Text>
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={18} color="#333" />
            <Text style={styles.infoText}>
              Phone: <Text style={styles.bold}>{item.phoneNumber || "-"}</Text>
            </Text>
          </View>
        </View>

        {/* footer */}
        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>View Ticket</Text>
          <Ionicons name="chevron-forward" size={18} color="#777" />
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading My Rides...</Text>
      </View>
    );
  }

  // EMPTY STATE (CENTER)
  if (!bookings || bookings.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#111" />
          </Pressable>

          <Text style={styles.headerTitle}>My Rides</Text>

          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-outline" size={30} color="#333" />
            </View>

            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptySub}>
              You haven't booked any rides yet. Find a ride and book it.
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push("/find-ride")}
            >
              <Text style={styles.primaryBtnText}>Find a Ride</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </Pressable>

        <Text style={styles.headerTitle}>My Rides</Text>

        <Pressable onPress={fetchData} style={styles.iconBtn}>
          <Ionicons name="refresh-outline" size={18} color="#111" />
        </Pressable>
      </View>

      {/* List */}
      <View style={{ paddingHorizontal: 16 }}>
        {bookings.map((b) => (
          <TicketCard key={b.id} item={b} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  center: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
    fontWeight: "700",
  },

  headerRow: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },

  iconBtn: {
    height: 38,
    width: 38,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
  },

  emptyCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    elevation: 2,
    alignItems: "center",
  },

  emptyIcon: {
    height: 60,
    width: 60,
    borderRadius: 18,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginTop: 4,
  },

  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 14,
  },

  primaryBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    minWidth: 160,
    alignItems: "center",
  },

  primaryBtnText: {
    color: "#fff",
    fontWeight: "900",
  },

  // Ticket
  ticket: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    elevation: 2,
  },

  ticketTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  routeText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  subText: {
    marginTop: 6,
    color: "#666",
    fontWeight: "600",
    fontSize: 13,
  },

  bold: {
    fontWeight: "900",
    color: "#111",
  },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontWeight: "900",
    fontSize: 12,
  },

  dashedRow: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  circleCutLeft: {
    height: 18,
    width: 18,
    borderRadius: 9,
    backgroundColor: "#F7F7F7",
    marginLeft: -6,
  },

  circleCutRight: {
    height: 18,
    width: 18,
    borderRadius: 9,
    backgroundColor: "#F7F7F7",
    marginRight: -6,
  },

  dashedLine: {
    flex: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#DDD",
    marginHorizontal: 8,
  },

  ticketBottom: {
    gap: 10,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  viewDetailsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewDetailsText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },
});
