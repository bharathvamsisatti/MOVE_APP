import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import LoadingOverlay from "../../components/LoadingOverlay";

const API_BASE_URL = "https://dev-moveservices.mroads.com";

export default function TicketScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  const getAuthToken = async (): Promise<string | null> => {
    const keys = ["auth_token", "token", "userToken", "jwt", "access_token"];
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k);
      if (v) return v;
    }
    return null;
  };

  const fetchBookings = async () => {
    try {
      if (!rideId) {
        Alert.alert("Error", "Ride ID missing");
        return;
      }

      setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Login required", "Please login again.");
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/bookings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch bookings");
      }

      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [rideId]);

  const getPassengerName = (b: any) => {
    return (
      b?.userName ||
      b?.passengerName ||
      b?.name ||
      b?.user?.userName ||
      b?.user?.name ||
      "Passenger"
    );
  };

  const getPassengerPhone = (b: any) => {
    return (
      b?.phoneNumber ||
      b?.phone ||
      b?.mobile ||
      b?.user?.phoneNumber ||
      b?.user?.mobile ||
      ""
    );
  };

  const callUser = async (phone: string) => {
    if (!phone) {
      Alert.alert("Phone not found", "Passenger phone number not available.");
      return;
    }

    const clean = phone.replace(/\s/g, "");
    const url = `tel:${clean}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Not supported", "Call option not supported on this device");
      return;
    }

    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader onBack={() => router.back()} />

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Booked Users</Text>

          <Pressable style={styles.refreshBtn} onPress={fetchBookings}>
            <Ionicons name="refresh" size={18} color="#2563EB" />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {bookings.length === 0 && !loading ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={34} color="#9CA3AF" />
            <Text style={styles.emptyText}>No one booked this ride yet.</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item, index) =>
              String(item?.id || item?.bookingId || index)
            }
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const passengerName = getPassengerName(item);
              const passengerPhone = getPassengerPhone(item);

              return (
                <View style={styles.userCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{passengerName}</Text>

                    <Text style={styles.userPhone}>
                      {passengerPhone ? passengerPhone : "Phone not available"}
                    </Text>

                    {item?.seatsBooked != null ? (
                      <Text style={styles.userSeats}>
                        Seats booked: {item.seatsBooked}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={[
                      styles.callBtn,
                      !passengerPhone && { opacity: 0.5 },
                    ]}
                    disabled={!passengerPhone}
                    onPress={() => callUser(passengerPhone)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.callText}>Call</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>

      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 18 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: { fontSize: 20, fontWeight: "800", color: "#111827" },

  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  refreshText: { color: "#2563EB", fontWeight: "700" },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  emptyText: { marginTop: 10, color: "#6B7280", fontWeight: "600" },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  userName: { fontSize: 16, fontWeight: "800", color: "#111827" },
  userPhone: { marginTop: 4, color: "#374151" },
  userSeats: { marginTop: 4, color: "#6B7280", fontSize: 12 },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  callText: { color: "#fff", fontWeight: "800" },
});
