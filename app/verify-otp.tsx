import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { sendOtp, verifyOtp as verifyOtpService } from "../services/auth";

export default function VerifyOtp() {
  const router = useRouter();
  const { login } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [info, setInfo] = useState("");

  // ⏱️ countdown
  useEffect(() => {
    if (timer === 0) return;
    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleVerifyOtp = async () => {
    try {
      setError("");
      const token = await verifyOtpService({ email, otp });
      await login(token, { email });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      if (e.message?.includes("expired")) setError("OTP expired. Please resend.");
      else setError("Invalid OTP");
    }
  };

  const resendOtp = async () => {
    try {
      await sendOtp(email);
      setTimer(60);
      setInfo("OTP resent successfully");
      setError("");
    } catch {
      setError("Failed to resend OTP");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the OTP sent to {email}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}

      <Pressable
        style={[styles.primaryBtn, otp.length < 6 && styles.disabledBtn]}
        onPress={handleVerifyOtp}
        disabled={otp.length < 6}
      >
        <Text style={styles.primaryText}>Verify OTP</Text>
      </Pressable>

      {timer > 0 ? (
        <Text style={styles.timer}>Resend OTP in {timer}s</Text>
      ) : (
        <Pressable onPress={resendOtp}>
          <Text style={styles.resend}>Resend OTP</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: "#6B7280", marginBottom: 24, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
  },
  error: { color: "#DC2626", marginBottom: 8, textAlign: "center" },
  info: { color: "#059669", marginBottom: 8, textAlign: "center" },
  primaryBtn: { backgroundColor: "#1E40AF", padding: 16, borderRadius: 12, marginBottom: 12 },
  disabledBtn: { backgroundColor: "#93C5FD" },
  primaryText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  timer: { textAlign: "center", color: "#6B7280", marginBottom: 6 },
  resend: { textAlign: "center", color: "#2563EB", fontWeight: "600", marginBottom: 6 },
  backText: { color: "#6B7280", textAlign: "center", fontWeight: "600" },
});
