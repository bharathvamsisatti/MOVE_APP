import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerUser } from "../services/auth";
import { Ionicons } from "@expo/vector-icons";
import LoadingOverlay from "../components/LoadingOverlay";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

// 🔴 CHANGE ONLY IF BACKEND URL CHANGES
const BACKEND_URL = "https://dev-moveservices.mroads.com";

const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.com"];

export default function Register() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const isValid =
    userName.length >= 2 &&
    email.includes("@") &&
    email.includes(".") &&
    password.length >= 6 &&
    password === confirmPassword;

  // ---- Email suggestion logic ----
  const emailHasAt = email.includes("@");
  const [emailNamePart, emailDomainPart] = email.split("@");

  const shouldSuggestDomains =
    showEmailSuggestions &&
    emailHasAt &&
    emailNamePart?.length > 0 &&
    (!emailDomainPart || !emailDomainPart.includes(".")); // suggest until domain completed

  const filteredDomains = EMAIL_DOMAINS.filter((d) =>
    (emailDomainPart || "").length === 0
      ? true
      : d.startsWith(emailDomainPart.toLowerCase())
  );

  /* =========================
     EMAIL / PASSWORD REGISTER
     ========================= */
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");

      if (passwordMismatch) {
        setError("Passwords do not match");
        return;
      }

      await registerUser({ userName, email, password });

      setSuccess("Account created successfully. Redirecting to login…");

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GOOGLE SIGNUP / LOGIN
     ========================= */
  const handleGoogleSignup = async () => {
    try {
      setError("");
      setSuccess("");

      const redirectUri = Linking.createURL("oauth");

      const authUrl =
        `${BACKEND_URL}/oauth2/authorization/google` +
        `?redirect_uri=${encodeURIComponent(redirectUri)}`;

      await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      setSuccess(
        "No account found with this email. We’ve created one for you and signed you in."
      );
    } catch (e) {
      setError("Google signup failed. Please try again.");
    }
  };

  const applyEmailSuggestion = (domain: string) => {
    if (!emailNamePart) return;
    setEmail(`${emailNamePart}@${domain}`);
    setShowEmailSuggestions(false);
    Keyboard.dismiss();
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

        {/* -------- Full Name -------- */}
        <TextInput
          placeholder="Full name"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
        />

        {/* -------- Email -------- */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={email}
          onFocus={() => setShowEmailSuggestions(true)}
          onBlur={() => {
            // small delay so press on suggestion still works
            setTimeout(() => setShowEmailSuggestions(false), 150);
          }}
          onChangeText={(text) => {
            setEmail(text);
            setShowEmailSuggestions(true);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Email suggestions */}
        {shouldSuggestDomains && filteredDomains.length > 0 && (
          <View style={styles.suggestionsBox}>
            {filteredDomains.map((domain) => (
              <Pressable
                key={domain}
                style={styles.suggestionItem}
                onPress={() => applyEmailSuggestion(domain)}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#1E40AF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.suggestionText}>
                  {emailNamePart}@{domain}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* -------- Password -------- */}
        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
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

        {/* -------- Confirm Password -------- */}
        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Password mismatch message */}
        {passwordMismatch ? (
          <Text style={styles.error}>Passwords do not match</Text>
        ) : null}

        {/* -------- Messages -------- */}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* -------- Create Account -------- */}
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

        {/* -------- Divider -------- */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* -------- Google Signup -------- */}
        <Pressable style={styles.googleBtn} onPress={handleGoogleSignup}>
          <Ionicons name="logo-google" size={18} color="#DB4437" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        {/* -------- Footer -------- */}
        <Pressable onPress={() => router.back()}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Login</Text>
          </Text>
        </Pressable>
      </View>

      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

/* =========================
   STYLES
   ========================= */
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
    color: "#111827",
  },

  // Email suggestions dropdown
  suggestionsBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    marginTop: -8,
    marginBottom: 14,
    overflow: "hidden",
  },

  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  suggestionText: {
    color: "#1E40AF",
    fontWeight: "700",
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
    color: "#111827",
  },

  success: {
    color: "#16A34A",
    marginBottom: 10,
    fontWeight: "600",
  },

  error: {
    color: "#DC2626",
    marginBottom: 10,
    fontWeight: "600",
  },

  primaryBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 18,
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

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  or: {
    marginHorizontal: 10,
    color: "#6B7280",
    fontSize: 12,
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 18,
  },

  googleText: {
    marginLeft: 10,
    fontWeight: "600",
    color: "#111827",
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
