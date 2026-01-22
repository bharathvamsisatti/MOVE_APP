import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { cancelBooking } from "../../services/rides";

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
    departure?: string;
    destination?: string;
    departureDate?: string;
    departureTime?: string;
    pricePerSeat?: number;
    vehicleName?: string;
    vehicleNumber?: string;
  };
};

export default function BookingDetails() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const booking: Booking | null = useMemo(() => {
    try {
      if (!params?.booking) return null;
      return JSON.parse(String(params.booking));
    } catch {
      return null;
    }
  }, [params]);

  const chip = useMemo(() => {
    const upper = (booking?.status || "").toUpperCase();
    if (upper === "CONFIRMED")
      return { bg: "#E8F5E9", text: "#1B5E20", label: "CONFIRMED" };
    if (upper === "CANCELLED")
      return { bg: "#FFEBEE", text: "#B71C1C", label: "CANCELLED" };
    return { bg: "#EEE", text: "#333", label: upper || "UNKNOWN" };
  }, [booking]);

  const handleCancel = async () => {
    if (!token || !booking?.id) return;

    Alert.alert("Cancel Booking", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelBooking(token, booking.id);
            Alert.alert("Cancelled", "Your booking has been cancelled.");
            router.back();
          } catch (e: any) {
            if (e?.message === "SESSION_EXPIRED") {
              Alert.alert("Session Expired", "Please login again.");
              router.replace("/welcome");
              return;
            }
            Alert.alert("Error", "Failed to cancel booking");
          }
        },
      },
    ]);
  };

  if (!booking) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color="#E53935" />
        <Text style={styles.errTitle}>Ticket not found</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const ride = booking.ride;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </Pressable>

        <Text style={styles.headerTitle}>Ticket</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Ticket Card */}
      <View style={styles.ticket}>
        {/* top */}
        <View style={styles.ticketTop}>
          <Text style={styles.ticketTitle}>MOVE Ride Ticket</Text>

          <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.statusText, { color: chip.text }]}>
              {chip.label}
            </Text>
          </View>
        </View>

        {/* route */}
        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={styles.dot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>{ride?.departure || "-"}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: "#111" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>{ride?.destination || "-"}</Text>
            </View>
          </View>
        </View>

        {/* dashed */}
        <View style={styles.dashedRow}>
          <View style={styles.circleCutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.circleCutRight} />
        </View>

        {/* details */}
        <View style={styles.detailsBox}>
          <DetailRow
            icon="person-outline"
            label="Passenger"
            value={booking.passengerName || "-"}
          />
          <DetailRow
            icon="call-outline"
            label="Phone"
            value={booking.phoneNumber || "-"}
          />
          <DetailRow
            icon="people-outline"
            label="Seats"
            value={String(booking.seatsBooked ?? "-")}
          />
          <DetailRow
            icon="calendar-outline"
            label="Departure Date"
            value={ride?.departureDate || "-"}
          />
          <DetailRow
            icon="time-outline"
            label="Departure Time"
            value={ride?.departureTime || "-"}
          />
          <DetailRow
            icon="car-outline"
            label="Vehicle"
            value={ride?.vehicleName || "-"}
          />
          <DetailRow
            icon="pricetag-outline"
            label="Final Price"
            value={booking.finalPrice ? `₹ ${booking.finalPrice}` : "-"}
          />
          <DetailRow
            icon="key-outline"
            label="Booking ID"
            value={String(booking.id)}
          />
        </View>
      </View>

      {/* Cancel button only if confirmed */}
      {String(booking.status).toUpperCase() === "CONFIRMED" && (
        <Pressable style={styles.cancelBtn} onPress={handleCancel}>
          <Ionicons name="close-circle-outline" size={18} color="#fff" />
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color="#111" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },

  center: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  errTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  btn: {
    marginTop: 14,
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
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

  ticket: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    elevation: 2,
    marginTop: 8,
  },

  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ticketTitle: {
    fontSize: 16,
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

  routeBox: {
    marginTop: 14,
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 12,
  },

  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#777",
    marginTop: 6,
  },

  routeLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#777",
  },

  routeValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
    marginTop: 2,
  },

  routeLine: {
    height: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#DDD",
    marginLeft: 4,
    marginVertical: 6,
  },

  dashedRow: {
    marginTop: 14,
    marginBottom: 14,
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

  detailsBox: {
    gap: 12,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#777",
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
    marginTop: 2,
  },

  cancelBtn: {
    marginTop: 14,
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  cancelText: {
    color: "#fff",
    fontWeight: "900",
  },
});
