import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { getMyOfferedRides, deleteRide } from "../../services/rides";

type OfferedRide = {
  id: number;

  departure?: string;
  departureLocation?: string;
  from?: string;

  destination?: string;
  destinationLocation?: string;
  to?: string;

  departureDate?: string;
  date?: string;
  rideDate?: string;

  departureTime?: string;
  time?: string;
  rideTime?: string;

  availableSeats?: number;
  seatsAvailable?: number;
  seats?: number;

  price?: number;
  fare?: number;

  driverName?: string;
  phoneNumber?: string;
  vehicleNumber?: string;
  totalSeats?: number;
  pricePerSeat?: number;

  fromLatitude?: number;
  fromLongitude?: number;
  toLatitude?: number;
  toLongitude?: number;

  createdByUuid?: string;

  [key: string]: any;
};

export default function MyOfferedRides() {
  const router = useRouter();
  const { token } = useAuth();

  const [rides, setRides] = useState<OfferedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState<OfferedRide | null>(null);

  const safeToken = token ?? "";

  const getFrom = (ride: OfferedRide) =>
    ride.departure || ride.departureLocation || ride.from || "From";

  const getTo = (ride: OfferedRide) =>
    ride.destination || ride.destinationLocation || ride.to || "To";

  const getSeats = (ride: OfferedRide) =>
    ride.availableSeats ?? ride.seatsAvailable ?? ride.seats ?? 0;

  const getPrice = (ride: OfferedRide) => {
    const p =
      ride.price ??
      ride.fare ??
      ride.pricePerSeat ??
      ride.amount ??
      ride.cost ??
      ride.ridePrice ??
      ride.rideFare ??
      ride.farePerSeat ??
      0;

    return Number(p) || 0;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) return dateStr;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--";
    if (timeStr.includes(":") && timeStr.length <= 5) return timeStr;

    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return String(timeStr);

    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const isRideCompleted = (ride: OfferedRide) => {
    const dateStr = ride.departureDate || ride.date || ride.rideDate;
    const timeStr = ride.departureTime || ride.time || ride.rideTime;

    if (!dateStr || !timeStr) return false;

    if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) {
      const [dd, mm, yyyy] = dateStr.split("-");
      const [hh, min] = timeStr.split(":");

      const rideDate = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh || 0),
        Number(min || 0)
      );

      return rideDate.getTime() < new Date().getTime();
    }

    const rideDateTime = new Date(`${dateStr} ${timeStr}`);
    if (isNaN(rideDateTime.getTime())) return false;

    return rideDateTime.getTime() < new Date().getTime();
  };

  const fetchOfferedRides = async () => {
    try {
      setLoading(true);

      if (!safeToken) {
        Alert.alert("Login Required", "Please login again.");
        setRides([]);
        return;
      }

      const data = await getMyOfferedRides(safeToken);
      const list = Array.isArray(data) ? data : data?.rides || [];
      setRides(list);
    } catch (e: any) {
      console.log("OFFERED RIDES ERROR:", e?.message || e);
      Alert.alert("Error", "Failed to load offered rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferedRides();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchOfferedRides();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (rideId: number) => {
    Alert.alert("Delete Ride", "Are you sure you want to delete this ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!safeToken) return;

            await deleteRide(safeToken, rideId);
            Alert.alert("Success", "Ride deleted");
            fetchOfferedRides();
          } catch (e: any) {
            console.log("DELETE ERROR:", e?.message || e);
            Alert.alert("Error", "Failed to delete ride");
          }
        },
      },
    ]);
  };

  const openDetails = (ride: OfferedRide) => {
    setSelectedRide(ride);
    setDetailsVisible(true);
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setSelectedRide(null);
  };

  const renderKeyValue = (label: string, value: any) => {
    const showValue =
      value === null || value === undefined || value === "" ? "-" : String(value);

    return (
      <View style={styles.kvRow} key={label}>
        <Text style={styles.kvLabel}>{label}</Text>
        <Text style={styles.kvValue}>{showValue}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading offered rides...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#111" />
          </Pressable>

          <Text style={styles.title}>My Offered Rides</Text>

          <View style={{ width: 38 }} />
        </View>

        {rides.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="car-outline" size={44} color="#555" />
            <Text style={styles.emptyTitle}>No offered rides</Text>
            <Text style={styles.emptySub}>
              You haven’t offered any rides yet. Create a ride to start.
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push("/(tabs)/create")}
            >
              <Text style={styles.primaryBtnText}>Offer a Ride</Text>
            </Pressable>
          </View>
        ) : (
          rides.map((ride) => {
            const from = getFrom(ride);
            const to = getTo(ride);
            const seats = getSeats(ride);
            const price = getPrice(ride);

            const dateStr = formatDate(ride.departureDate || ride.date || ride.rideDate);
            const timeStr = formatTime(ride.departureTime || ride.time || ride.rideTime);

            const completed = isRideCompleted(ride);

            return (
              <View key={ride.id} style={styles.ticketCard}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeText} numberOfLines={2}>
                      {from} <Text style={{ fontWeight: "900" }}>→</Text> {to}
                    </Text>
                  </View>

                  <View style={styles.rideIdPill}>
                    <Text style={styles.rideIdText}>RIDE</Text>
                    <Text style={styles.rideIdNumber}>#{ride.id}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="calendar-outline" size={16} color="#111" />
                    <Text style={styles.metaText}>{dateStr}</Text>
                  </View>

                  <View style={styles.metaPill}>
                    <Ionicons name="time-outline" size={16} color="#111" />
                    <Text style={styles.metaText}>{timeStr}</Text>
                  </View>
                </View>

                <View style={styles.dottedDivider} />

                {/* ✅ FIXED BOTTOM LAYOUT */}
                <View style={styles.bottomRow}>
                  {/* left stats fixed width */}
                  <View style={styles.leftStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Seats</Text>
                      <Text style={styles.statValue}>{seats}</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Price</Text>
                      <Text style={styles.statValue}>₹{price}</Text>
                    </View>
                  </View>

                  {/* right actions take only needed space */}
                  <View style={styles.actionsRow}>
                    <Pressable style={styles.detailsBtnSmall} onPress={() => openDetails(ride)}>
                      <Ionicons name="eye-outline" size={0.2} color="#111" />
                      <Text style={styles.detailsTextSmall}>Details</Text>
                    </Pressable>

                    {completed ? (
                      <View style={styles.confirmedPill}>
                        <Ionicons name="checkmark-circle" size={14} color="#0F7A3A" />
                        <Text style={styles.confirmedText} numberOfLines={1}>
                          COMPLETED
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.deleteBtnSmall}
                        onPress={() => handleDelete(ride.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#fff" />
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={detailsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>

              <Pressable onPress={closeDetails} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#111" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailsBox}>
                {selectedRide && (
                  <>
                    {renderKeyValue("Ride ID", selectedRide.id)}
                    {renderKeyValue("Driver Name", selectedRide.driverName)}
                    {renderKeyValue("Phone Number", selectedRide.phoneNumber)}
                    {renderKeyValue("Vehicle Number", selectedRide.vehicleNumber)}
                    {renderKeyValue("Departure", getFrom(selectedRide))}
                    {renderKeyValue("Destination", getTo(selectedRide))}
                    {renderKeyValue(
                      "Date",
                      formatDate(
                        selectedRide.departureDate ||
                          selectedRide.date ||
                          selectedRide.rideDate
                      )
                    )}
                    {renderKeyValue(
                      "Time",
                      formatTime(
                        selectedRide.departureTime ||
                          selectedRide.time ||
                          selectedRide.rideTime
                      )
                    )}
                    {renderKeyValue("Total Seats", selectedRide.totalSeats)}
                    {renderKeyValue("Available Seats", getSeats(selectedRide))}
                    {renderKeyValue("Price Per Seat", `₹${getPrice(selectedRide)}`)}
                    {renderKeyValue("From Latitude", selectedRide.fromLatitude)}
                    {renderKeyValue("From Longitude", selectedRide.fromLongitude)}
                    {renderKeyValue("To Latitude", selectedRide.toLatitude)}
                    {renderKeyValue("To Longitude", selectedRide.toLongitude)}
                    {renderKeyValue("Created By UUID", selectedRide.createdByUuid)}
                  </>
                )}
              </View>

              <Pressable style={styles.modalCloseBigBtn} onPress={closeDetails}>
                <Text style={styles.modalCloseBigText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F7" },
  container: { padding: 16, paddingBottom: 30 },

  center: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 10, color: "#666", fontWeight: "600" },

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

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    elevation: 2,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", marginTop: 10, color: "#111" },
  emptySub: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#111",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    elevation: 2,
    marginBottom: 14,
  },

  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeText: { fontSize: 18, fontWeight: "900", color: "#111", lineHeight: 22 },

  rideIdPill: {
    backgroundColor: "#F1F1F1",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
  },
  rideIdText: { fontSize: 11, fontWeight: "800", color: "#666" },
  rideIdNumber: { fontSize: 14, fontWeight: "900", color: "#111", marginTop: 2 },

  metaRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  metaText: { fontSize: 13, fontWeight: "800", color: "#111" },

  dottedDivider: {
    marginTop: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  // ✅ fixed stats width so price never hides
  leftStats: {
    flexDirection: "row",
    gap: 18,
    flex: 1,
    paddingRight: 10,
  },

  statBox: { width: 80 },
  statLabel: { fontSize: 12, color: "#777", fontWeight: "800" },
  statValue: { fontSize: 16, color: "#111", fontWeight: "900", marginTop: 3 },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },

  // ✅ smaller details so it won't overlap price
  detailsBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
  },
  detailsTextSmall: { fontWeight: "900", color: "#111", fontSize: 12 },

  deleteBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E53935",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  deleteText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F8EE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: 120,
  },
  confirmedText: {
    color: "#0F7A3A",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111" },
  modalCloseBtn: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsBox: { backgroundColor: "#F6F6F6", borderRadius: 14, padding: 12 },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  kvLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#444",
    marginRight: 10,
  },
  kvValue: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
    textAlign: "right",
  },

  modalCloseBigBtn: {
    marginTop: 14,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  modalCloseBigText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
