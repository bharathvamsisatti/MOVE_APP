import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { bookRide, getRideById } from "../../services/rides";

export default function RideDetailsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // inputs
  const [passengerName, setPassengerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [seatsBooked, setSeatsBooked] = useState("1");

  const id = Number(rideId);

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

      const data = await getRideById(token, id);
      setRide(data);
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

    if (!passengerName.trim()) {
      Alert.alert("Missing Name", "Please enter your name.");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Missing Phone", "Please enter phone number.");
      return;
    }

    const seats = Number(seatsBooked);
    if (!seats || seats < 1) {
      Alert.alert("Invalid Seats", "Must book at least 1 seat.");
      return;
    }

    try {
      setBooking(true);

      await bookRide(token, id, {
        passengerName: passengerName.trim(),
        phoneNumber: phoneNumber.trim(),
        seatsBooked: seats,
      });

      router.replace("/booking-success");

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

        <Text style={styles.title}>Book Ride</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* DETAILS CARD */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.value}>{ride?.departureLocation}</Text>

            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-down" size={18} color="#444" />
            </View>

            <Text style={styles.label}>To</Text>
            <Text style={styles.value}>{ride?.destinationLocation}</Text>
          </View>

          <View style={styles.rightBox}>
            <View style={styles.iconRow}>
              <Ionicons name="time-outline" size={18} color="#111" />
              <Text style={styles.rightText}>{ride?.departureTime}</Text>
            </View>

            <View style={styles.iconRow}>
              <Ionicons name="calendar-outline" size={18} color="#111" />
              <Text style={styles.rightText}>{ride?.departureDate}</Text>
            </View>

            <Text style={styles.metaText}>• {ride?.distanceKm || 0} kms</Text>
            <Text style={styles.metaText}>
              • Seats Available: {ride?.availableSeats}
            </Text>
          </View>
        </View>
      </View>

      {/* BOOK NOW */}
      <Text style={styles.bookNow}>Book Now</Text>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Name"
          value={passengerName}
          onChangeText={setPassengerName}
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Seats"
          value={seatsBooked}
          onChangeText={setSeatsBooked}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor="#888"
        />
      </View>

      <Pressable
        disabled={booking}
        onPress={handleBook}
        style={[styles.bookBtn, booking && { opacity: 0.6 }]}
      >
        <Text style={styles.bookText}>{booking ? "Booking..." : "Book"}</Text>
      </Pressable>
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

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  label: { fontSize: 13, fontWeight: "700", color: "#777" },

  value: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginTop: 2,
  },

  arrowWrap: {
    marginVertical: 10,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },

  rightBox: {
    width: 160,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },

  rightText: { fontSize: 13, fontWeight: "800", color: "#111" },

  metaText: { fontSize: 12, fontWeight: "700", color: "#444", marginTop: 4 },

  bookNow: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  inputBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    elevation: 1,
  },

  input: { fontSize: 15, fontWeight: "700", color: "#111" },

  bookBtn: {
    marginTop: 8,
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  bookText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
