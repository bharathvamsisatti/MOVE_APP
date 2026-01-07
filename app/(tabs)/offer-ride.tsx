import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

export default function OfferRide() {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // STEP-1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // STEP-2
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader />

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

        {step === 2 && (
          <RouteStep
            fromLocation={fromLocation}
            toLocation={toLocation}
            setFromLocation={setFromLocation}
            setToLocation={setToLocation}
            onContinue={() => {
              if (!fromLocation || !toLocation) return;
              alert("Step-2 completed → Step-3 next");
            }}
          />
        )}
      </KeyboardAvoidingView>
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
  const isValid = name.length > 0 && phone.length >= 10;

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
          onChangeText={setPhone}
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

/* ───────── STEP-2 ROUTE ───────── */

function RouteStep({
  fromLocation,
  toLocation,
  setFromLocation,
  setToLocation,
  onContinue,
}: any) {
  const [fromCoords, setFromCoords] = useState<any>(null);
  const [toCoords, setToCoords] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // 1️⃣ Get device location and auto-fill FROM
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync(loc.coords);

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
    })();
  }, []);

  // 2️⃣ Fetch route once both coords exist
  useEffect(() => {
    if (!fromCoords || !toCoords) return;

    (async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.longitude},${fromCoords.latitude};${toCoords.longitude},${toCoords.latitude}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      const route = json.routes[0];
      setDistanceKm(route.distance / 1000);

      setRouteCoords(
        route.geometry.coordinates.map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0],
        }))
      );
    })();
  }, [fromCoords, toCoords]);

  // 3️⃣ Convert TO text → coordinates
  const resolveToLocation = async (text: string) => {
    setToLocation(text);
    if (text.length < 3) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        text
      )}&format=json&limit=1`
    );
    const data = await res.json();

    if (data.length) {
      setToCoords({
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      });
    }
  };

  const isValid = fromCoords && toCoords;

  return (
    <View style={styles.container}>
      <Text style={styles.bigTitle}>Let’s create your ride</Text>
      <Text style={styles.subtitle}>Your address is kept private</Text>

      {/* FROM (AUTO) */}
      <TextInput
      placeholderTextColor="#9CA3AF"
        value={fromLocation}
        editable={false}
        style={[styles.input, { backgroundColor: "#F9FAFB" }]}
      />

      {/* TO */}
      <TextInput
      placeholderTextColor="#9CA3AF"
        placeholder="Set drop location"
        value={toLocation}
        onChangeText={resolveToLocation}
        style={styles.input}
      />

      {/* MAP */}
      {fromCoords && (
        <MapView
          style={styles.map}
          initialRegion={{
            ...fromCoords,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          <Marker coordinate={fromCoords} />
          {toCoords && <Marker coordinate={toCoords} />}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="#1E40AF"
            />
          )}
        </MapView>
      )}

      {distanceKm && (
        <Text style={{ marginBottom: 12, fontWeight: "700" }}>
          Distance: {distanceKm.toFixed(1)} km
        </Text>
      )}

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

  mapPlaceholder: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  map: {
    height: 220,
    borderRadius: 16,
    marginBottom: 20,
  },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  primaryText: { color: "#fff", fontWeight: "800" },
});