import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { userService, MeResponse } from "../../services/user";
import { API_BASE_URL } from "../../config/api";

export default function Profile() {
  const { logout } = useAuth();
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Put your official MOVE social links here
  const MOVE_SOCIALS = {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    twitter: "https://twitter.com/",
  };

  const getProfileImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
    return `${API_BASE_URL}/${path}`;
  };

  const profileImageUri = getProfileImageUrl(me?.profileImage);

  const loadMe = async () => {
    const data = await userService.getMe();
    setMe(data);
  };

  const fetchMe = async () => {
    try {
      setLoading(true);
      await loadMe();
    } catch (e: any) {
      console.log("PROFILE LOAD ERROR:", e?.response?.data || e?.message);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadMe();
    } catch (e: any) {
      Alert.alert("Error", "Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Error", "Cannot open this link");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening the link");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/welcome");
        },
      },
    ]);
  };

  const MenuItem = ({
    title,
    icon,
    onPress,
    danger = false,
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    danger?: boolean;
  }) => {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuItem,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.menuLeft}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? "#E53935" : "#333"}
          />
          <Text style={[styles.menuText, danger && { color: "#E53935" }]}>
            {title}
          </Text>
        </View>

        {!danger && (
          <Ionicons name="chevron-forward" size={20} color="#777" />
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Small gap from status bar */}
      <View style={styles.topGap} />

      {/* Title */}
      <Text style={styles.title}>Profile</Text>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {loading ? (
            <ActivityIndicator />
          ) : profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={30} color="#555" />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.nameText}>
            {me?.name?.trim() ? me.name : "MOVE USER"}
          </Text>

          <Text style={styles.emailText}>
            {me?.email?.trim() ? me.email : "No email"}
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
              <Text style={styles.badgeText}>
                {me?.verified ? "Verified" : "Not Verified"}
              </Text>
            </View>

            <View style={styles.badge}>
              <Ionicons
                name={me?.provider === "GOOGLE" ? "logo-google" : "shield"}
                size={14}
                color="#1976D2"
              />
              <Text style={styles.badgeText}>{me?.provider || "LOCAL"}</Text>
            </View>
          </View>
        </View>

        {/* Edit profile */}
        <Pressable
          onPress={() => router.push("/profile/edit")}
          style={styles.editBtn}
        >
          <Ionicons name="create-outline" size={18} color="#111" />
        </Pressable>
      </View>

      {/* Menu Tabs */}
      <View style={styles.menuBox}>
        <MenuItem
          title="Profile Details"
          icon="person-outline"
          onPress={() => router.push("/profile/details")}
        />

        <MenuItem
          title="My Rides"
          icon="car-outline"
          onPress={() => router.push("/rides/myrides")}
        />

        <MenuItem
          title="My Offered Rides"
          icon="swap-horizontal-outline"
          onPress={() => router.push("/rides/offered")}
        />

        <MenuItem
          title="Safety"
          icon="shield-checkmark-outline"
          onPress={() => router.push("/safety")}
        />

        <MenuItem
          title="Help"
          icon="help-circle-outline"
          onPress={() => router.push("/help")}
        />
      </View>

      {/* Social Media Section */}
      <View style={styles.socialBox}>
        <Text style={styles.socialTitle}>Follow MOVE</Text>

        <View style={styles.socialRow}>
          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openUrl(MOVE_SOCIALS.facebook)}
          >
            <Ionicons name="logo-facebook" size={22} color="#1877F2" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openUrl(MOVE_SOCIALS.instagram)}
          >
            <Ionicons name="logo-instagram" size={22} color="#E1306C" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openUrl(MOVE_SOCIALS.twitter)}
          >
            <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
          </Pressable>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutBox}>
        <MenuItem
          title="Logout"
          icon="log-out-outline"
          danger
          onPress={handleLogout}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ by MOVE Team</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F7" },
  container: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 25 },

  topGap: {
    height: Platform.OS === "android" ? (StatusBar.currentHeight || 10) : 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginTop: 10,
    marginBottom: 14,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },

  avatar: {
    height: 55,
    width: 55,
    borderRadius: 27.5,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  avatarImg: {
    height: 55,
    width: 55,
    borderRadius: 27.5,
  },

  nameText: { fontSize: 16, fontWeight: "700", color: "#111" },
  emailText: { fontSize: 13, color: "#666", marginTop: 2 },

  badgesRow: { flexDirection: "row", gap: 10, marginTop: 8 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeText: { fontSize: 12, color: "#333", fontWeight: "600" },

  editBtn: { padding: 8, borderRadius: 10, backgroundColor: "#F2F2F2" },

  menuBox: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", elevation: 2 },

  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

  menuText: { fontSize: 15, fontWeight: "600", color: "#222" },

  socialBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    elevation: 2,
  },

  socialTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 10 },

  socialRow: { flexDirection: "row", gap: 14 },

  socialBtn: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutBox: { marginTop: 14, backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", elevation: 2 },

  footer: { marginTop: 18, alignItems: "center" },
  footerText: { fontSize: 12, color: "#888", marginTop: 4 },
});
