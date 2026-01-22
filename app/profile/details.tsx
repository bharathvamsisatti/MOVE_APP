import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { userService, MeResponse } from "../../services/user";
import { API_BASE_URL } from "../../config/api";

export default function ProfileDetails() {
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMe = async () => {
    const data = await userService.getMe();
    setMe(data);
  };

  const fetchProfile = async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      await loadMe();
    } catch (e: any) {
      console.log("PROFILE DETAILS ERROR STATUS:", e?.response?.status);
      console.log("PROFILE DETAILS ERROR DATA:", e?.response?.data);
      console.log("PROFILE DETAILS ERROR MSG:", e?.message);

      const msg =
        e?.response?.data?.error ||
        e?.response?.data ||
        e?.message ||
        "Failed to load profile details";

      setErrorMsg(String(msg));
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      await loadMe();
    } catch (e: any) {
      console.log("REFRESH ERROR:", e?.response?.data || e?.message);
      Alert.alert("Error", "Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  // If backend returns relative path like "/uploads/abc.jpg"
  const profileImageUri =
    me?.profileImage && me.profileImage.startsWith("http")
      ? me.profileImage
      : me?.profileImage
      ? `${API_BASE_URL}${me.profileImage}`
      : null;

  const InfoRow = ({
    label,
    value,
    icon,
    isLast = false,
  }: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    isLast?: boolean;
  }) => {
    return (
      <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.rowLeft}>
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={18} color="#111" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} numberOfLines={2}>
              {value}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#E53935" />
          <Text style={styles.errorTitle}>Failed to load profile</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>

          <Pressable style={styles.retryBtn} onPress={fetchProfile}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>

          <Pressable
            style={[styles.retryBtn, { backgroundColor: "#fff" }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.retryText, { color: "#111" }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </Pressable>

          <Text style={styles.title}>Profile Details</Text>

          <Pressable
            onPress={() => router.push("/profile/edit")}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={20} color="#111" />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={{ height: 70, width: 70, borderRadius: 35 }}
              />
            ) : (
              <Ionicons name="person" size={34} color="#555" />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>
              {me?.name || "MOVE User"}
            </Text>

            <Text style={styles.email} numberOfLines={1}>
              {me?.email || "-"}
            </Text>

            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Ionicons
                  name={me?.verified ? "checkmark-circle" : "alert-circle"}
                  size={14}
                  color={me?.verified ? "#2E7D32" : "#E53935"}
                />
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
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <InfoRow
            label="User UUID"
            value={me?.userUuid || "-"}
            icon="key-outline"
          />

          <InfoRow
            label="Login Provider"
            value={me?.provider || "-"}
            icon="shield-checkmark-outline"
          />

          <InfoRow
            label="Alternate Phone"
            value={me?.alternatePhone || "-"}
            icon="call-outline"
          />

          <InfoRow
            label="Date of Birth"
            value={me?.dateOfBirth || "-"}
            icon="calendar-outline"
          />

          <InfoRow
            label="Email"
            value={me?.email || "-"}
            icon="mail-outline"
            isLast
          />
        </View>

        {/* Footer note */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={18} color="#444" />
          <Text style={styles.noteText}>
            This data is fetched directly from MOVE server.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 60, // ✅ note won't cut
  },

  center: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
    fontWeight: "700",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10, // ✅ proper gap below status bar
    paddingBottom: 12,
    marginBottom: 8,
  },

  backBtn: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },

  editBtn: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  avatar: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  name: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    lineHeight: 20,
  },

  email: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  badgesRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#333",
  },

  infoBox: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    elevation: 2,
  },

  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 12,
    color: "#777",
    fontWeight: "800",
  },

  value: {
    fontSize: 15,
    color: "#111",
    fontWeight: "900",
    marginTop: 4,
  },

  noteBox: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  noteText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
    color: "#111",
  },

  errorText: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },

  retryBtn: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#111",
    minWidth: 160,
    alignItems: "center",
  },

  retryText: {
    color: "#fff",
    fontWeight: "900",
  },
});
