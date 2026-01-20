import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MOVE</Text>
      </View>

      {/* 🔹 Center content */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to MOVE</Text>
        <Text style={styles.subtitle}>
          Find rides. Offer rides. Travel together.
        </Text>

        <View style={styles.buttonGroup}>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginText}>Login</Text>
          </Pressable>

          <Pressable
            style={styles.signupButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.signupText}>Sign Up</Text>
          </Pressable>


          <Pressable
            onPress={() =>
              router.replace("/transition?next=/home-guest")
            }
          >
            <Text style={styles.skipText}>Skip for now →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E40AF",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
  },

  buttonGroup: {
    width: "100%",
  },

  loginButton: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },

  loginText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  signupButton: {
    borderWidth: 1,
    borderColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  signupText: {
    color: "#1E40AF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  skipText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },
});