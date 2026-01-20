import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const formatTime = (time: string) => {
  const [h, m] = time.split(":");
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
};

export default function RideDetailsModal({ ride, onClose }: any) {
  const estimatedHours = Math.round(ride.distanceKm / 50);

  return (
    <Modal transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={26} />
            </Pressable>
            <Text style={styles.title}>Ride details</Text>
          </View>

          {/* DRIVER */}
          <Text style={styles.driver}>{ride.driverName}</Text>

          {/* ROUTE */}
          <View style={styles.route}>
            <Text style={styles.label}>From</Text>
            <Text>{ride.departureLocation}</Text>

            <Text style={[styles.label, { marginTop: 12 }]}>To</Text>
            <Text>{ride.destinationLocation}</Text>
          </View>

          {/* INFO */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} />
            <Text>
              {ride.departureDate} • {formatTime(ride.departureTime)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} />
            <Text>Est. {estimatedHours} hrs</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} />
            <Text>{ride.distanceKm} km</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} />
            <Text>{ride.availableSeats} seats available</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{ride.pricePerSeat}</Text>
            <Text style={styles.perSeat}>per seat</Text>
          </View>

          {/* BOOK */}
          <Pressable style={styles.bookBtn}>
            <Text style={styles.bookText}>Book ride</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}



const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
  },

  driver: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },

  route: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    color: "#6B7280",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 12,
  },

  price: {
    fontSize: 22,
    fontWeight: "900",
    color: "#16A34A",
  },

  perSeat: {
    color: "#6B7280",
  },

  bookBtn: {
    marginTop: 18,
    backgroundColor: "#1E40AF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  bookText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
