import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerUser } from "../services/auth";
import { Ionicons } from "@expo/vector-icons";
import LoadingOverlay from "../components/LoadingOverlay";

export default function Register() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid =
    userName.length >= 2 &&
    email.includes("@") &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");

      await registerUser({ userName, email, password });

      setSuccess(true);

      setTimeout(() => {
        router.replace("/login"); // ✅ manual login after register
      }, 3000);
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>MOVE</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Join MOVE and start traveling smarter
        </Text>

        <TextInput
          placeholder="Full name"
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
        />

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#6B7280"
            />
          </Pressable>
        </View>

        <TextInput
          placeholder="Confirm password"
          style={styles.input}
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {success && (
          <Text style={styles.success}>
            ✅ Account created successfully! Redirecting to login…
          </Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[
            styles.primaryBtn,
            (!isValid || loading) && styles.disabledBtn,
          ]}
          disabled={!isValid || loading}
          onPress={handleRegister}
        >
          <Text style={styles.primaryText}>
            {loading ? "Creating account..." : "Create account"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.link}>Login</Text>
          </Text>
        </Pressable>
      </View>

      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 24, paddingTop: 12 },
  logo: { fontSize: 22, fontWeight: "800", color: "#1E40AF" },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 6,
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },

  success: {
    color: "#16A34A",
    marginBottom: 10,
    fontWeight: "600",
  },

  error: {
    color: "#DC2626",
    marginBottom: 10,
  },

  primaryBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },

  disabledBtn: {
    backgroundColor: "#93C5FD",
  },

  primaryText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  footerText: {
    textAlign: "center",
    color: "#6B7280",
  },

  link: {
    color: "#1E40AF",
    fontWeight: "600",
  },
});
