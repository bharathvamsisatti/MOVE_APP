import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GuestHome() {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 🔹 HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>MOVE</Text>

        <Pressable onPress={() => setShowProfile(true)}>
          <Text style={styles.profile}>👤</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔹 HERO */}
        <View style={styles.hero}>
          <LottieView
            source={require("../assets/lottie/Car insurance offers loading page.json")}
            autoPlay
            loop
            style={styles.lottie}
          />

          <Text style={styles.heroTitle}>
            Find rides. Offer rides.
          </Text>

          <Text style={styles.heroSubtitle}>
            Travel together. Save money. Stay safe.
          </Text>
        </View>

        {/* 🔹 WHY TRUST */}
        <Text style={styles.sectionTitle}>Why trust MOVE?</Text>

        {[
          {
            title: "✅ Verified users",
            text: "Phone number & profile verification for every rider.",
          },
          {
            title: "🔒 Safe rides",
            text: "Community ratings & trusted profiles.",
          },
          {
            title: "💰 Save money",
            text: "Share fuel costs and travel smarter.",
          },
        ].map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>{item.text}</Text>
          </View>
        ))}

        {/* 🔹 HOW IT WORKS */}
        <Text style={styles.sectionTitle}>How it works</Text>

        {[
          "Search for a ride going your way",
          "Choose a verified driver or passenger",
          "Travel together & split the cost",
        ].map((step, index) => (
          <View key={index} style={styles.step}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        {/* 🔹 CTA */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryText}>Login To 🔍 Search ride</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.loginText}>
            Login or create an account for more features
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 🔹 PROFILE MODAL */}
      <Modal transparent animationType="fade" visible={showProfile}>
        <Pressable
          style={styles.overlay}
          onPress={() => setShowProfile(false)}
        >
          <View style={styles.modal}>
            <Pressable
              style={styles.modalBtn}
              onPress={() => {
                setShowProfile(false);
                router.push("/login");
              }}
            >
              <Text style={styles.modalText}>Login</Text>
            </Pressable>

            <Pressable
              style={styles.modalBtn}
              onPress={() => {
                setShowProfile(false);
                router.push("/register");
              }}
            >
              <Text style={styles.modalText}>Sign Up</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E40AF",
  },

  profile: {
    fontSize: 24,
  },

  container: {
    paddingHorizontal: 20,
  },

  hero: {
    marginTop: 20,
    alignItems: "center",
  },

  lottie: {
    width: "100%",
    height: 240,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  heroSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 36,
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  cardText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1E40AF",
    color: "#fff",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "700",
    marginRight: 12,
  },

  stepText: {
    fontSize: 15,
  },

  primaryBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 30,
  },

  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  loginText: {
    textAlign: "center",
    marginTop: 14,
    color: "#1E40AF",
    fontWeight: "600",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "70%",
    padding: 20,
  },

  modalBtn: {
    paddingVertical: 12,
  },

  modalText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
