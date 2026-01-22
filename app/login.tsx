import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/auth";


WebBrowser.maybeCompleteAuthSession();

// 🔴 CHANGE this to your backend IP
const BACKEND_URL = "https://dev-moveservices.mroads.com";


export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailAnim = useState(new Animated.Value(0))[0];
const passwordAnim = useState(new Animated.Value(0))[0];




  const isValid = identifier.length > 3 && password.length >= 6;



  const animateIn = (anim: Animated.Value) => {
  Animated.spring(anim, {
    toValue: 1,
    useNativeDriver: false,
    friction: 6,
  }).start();
};

const animateOut = (anim: Animated.Value) => {
  Animated.spring(anim, {
    toValue: 0,
    useNativeDriver: false,
    friction: 6,
  }).start();
};


  // 🔐 Email / Password Login
  const handleLogin = async () => {
    try {
      setError("");

      const token = await loginUser({
        email: identifier, // backend expects "email"
        password,
      });

      await login(token, { email: identifier });
      router.replace("/(tabs)/home"); // go through index auth gate
    } catch (e) {
      setError("Invalid login details");
    }
  };

  // 🔵 Google OAuth Login
  const handleGoogleLogin = async () => {
    try {
      setError("");

      // Deep link handled by app/oauth.tsx
      const redirectUri = Linking.createURL("oauth");

      const authUrl =
        `${BACKEND_URL}/oauth2/authorization/google` +
        `?redirect_uri=${encodeURIComponent(redirectUri)}`;

      await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      // ✅ Backend will redirect to:
      // moveapp://oauth?token=JWT
      // Token handling is done in /oauth screen
    } catch (e) {
      setError("Google login failed");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MOVE</Text>
      </View>

      {/* 🔹 Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>
            Welcome back <Text style={styles.wave}>👋</Text>
          </Text>
          <Text style={styles.subtitle}>
            Login to continue using MOVE
          </Text>
        </View>

        <Animated.View
  style={[
    styles.animatedWrapper,
    {
      borderColor: emailAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#E5E7EB", "#1E40AF"],
      }),
      transform: [
        {
          scale: emailAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.03],
          }),
        },
      ],
    },
  ]}
>
  <TextInput
    placeholderTextColor="#9CA3AF"
    placeholder="Phone number or Email"
    style={styles.animatedInput}
    value={identifier}
    onChangeText={setIdentifier}
    autoCapitalize="none"
    onFocus={() => animateIn(emailAnim)}
    onBlur={() => animateOut(emailAnim)}
  />
</Animated.View>


        <Animated.View
  style={[
    styles.animatedWrapper,
    {
      borderColor: passwordAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#E5E7EB", "#1E40AF"],
      }),
      transform: [
        {
          scale: passwordAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.03],
          }),
        },
      ],
    },
  ]}
>
  <View style={styles.passwordRow}>
    <TextInput
      placeholderTextColor="#9CA3AF"
      placeholder="Password"
      style={styles.passwordInput}
      secureTextEntry={!showPassword}
      value={password}
      onChangeText={setPassword}
      onFocus={() => animateIn(passwordAnim)}
      onBlur={() => animateOut(passwordAnim)}
    />

    <Pressable onPress={() => setShowPassword(!showPassword)}>
      <Ionicons
        name={showPassword ? "eye-off-outline" : "eye-outline"}
        size={22}
        color="#6B7280"
      />
    </Pressable>
  </View>
</Animated.View>



        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* 🔹 Login button */}
        <Pressable
          style={[
            styles.primaryBtn,
            !isValid && styles.disabledBtn,
          ]}
          onPress={handleLogin}
          disabled={!isValid}
        >
          <Text style={styles.primaryText}>Login</Text>
        </Pressable>
        {/* 🔹 Login with OTP */}
    <Pressable onPress={() => router.push("/login-otp")}>
       <Text style={{
        textAlign: "center",
        color: "#2563EB",
        marginBottom: 14,
        fontWeight: "600"
    }}>
    Login with OTP
  </Text>
</Pressable>


        {/* 🔹 Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* 🔹 Google Login */}
        <Pressable style={styles.googleBtn} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={18} color="#DB4437" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        {/* 🔹 Register */}
        <Pressable onPress={() => router.push("/register")}>
          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text style={styles.link}>Sign up</Text>
          </Text>
        </Pressable>
      </View>

      {/* 🔹 Bottom info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.trustText}>
          🔒 Your data is safe with MOVE
        </Text>
        <Text style={styles.trustSubText}>
          Verified users • Secure rides • Trusted community
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
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
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  welcomeSection: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },

  wave: {
    fontSize: 28,
  },

  subtitle: {
    color: "#6B7280",
    fontSize: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },

  error: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 8,
  },

  primaryBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 6,
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

  bottomInfo: {
    paddingBottom: 24,
    alignItems: "center",
  },

  trustText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },

  trustSubText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  animatedWrapper: {
  borderWidth: 1,
  borderRadius: 12,
  marginBottom: 14,
},

animatedInput: {
  padding: 14,
  fontSize: 16,
  color: "#111827",
},

passwordRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 14,
},

passwordInput: {
  flex: 1,
  paddingVertical: 14,
  fontSize: 16,
  color: "#111827",
},


}); 