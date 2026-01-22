import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { bookRide } from "../../services/rides";

export default function RideDetailsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const id = Number(rideId);

  // ⚠️ Replace this with your actual API function if you have "getRideById"
  const fetchRideDetails = async () => {
    try {
      setLoading(true);

      if (!token) {
        Alert.alert("Login required", "Please login again.");
        router.back();
        return;
      }

      if (!id || isNaN(id)) {
        Alert.alert("Invalid ride", "Ride id not found.");
        router.back();
        return;
      }

      // 👉 If you have an API: getRideDetails(token, id)
      // For now, just dummy:
      // const data = await getRideDetails(token, id);
      // setRide(data);

      // TEMP: if you are passing ride object via params, you can parse here.
      // But best is fetch by id from backend.

      setRide({ id }); // placeholder
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load ride details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  const handleBook = async () => {
    if (!token) {
      Alert.alert("Login required", "Please login again.");
      return;
    }

    if (!id || isNaN(id)) {
      Alert.alert("Invalid ride", "Ride id not found.");
      return;
    }

    try {
      setBooking(true);

      // booking 1 seat by default
      await bookRide(token, id, 1);

      Alert.alert("Success 🎉", "Ride booked successfully!");
      router.back();
    } catch (e: any) {
      Alert.alert("Booking failed", e?.message || "Could not book ride");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, fontWeight: "700", color: "#666" }}>
          Loading ride details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </Pressable>

        <Text style={styles.title}>Ride Details</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.bigText}>Ride #{id}</Text>

        <Text style={styles.smallText}>
          (Fetch full ride details from backend here)
        </Text>

        <Pressable
          disabled={booking}
          onPress={handleBook}
          style={[styles.bookBtn, booking && { opacity: 0.6 }]}
        >
          <Text style={styles.bookText}>
            {booking ? "Booking..." : "Book Ride"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7F7", padding: 16 },

  center: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backBtn: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  title: { fontSize: 18, fontWeight: "900", color: "#111" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    elevation: 2,
  },

  bigText: { fontSize: 18, fontWeight: "900", color: "#111" },
  smallText: { marginTop: 6, color: "#666", fontWeight: "600" },

  bookBtn: {
    marginTop: 18,
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  bookText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
