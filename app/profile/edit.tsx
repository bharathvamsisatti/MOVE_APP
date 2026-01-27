import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

const API_BASE_URL = "https://dev-moveservices.mroads.com";

export default function EditProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  // Backend expects LocalDate => YYYY-MM-DD
  const [dateOfBirth, setDateOfBirth] = useState<string>(""); // "YYYY-MM-DD"
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState("");

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showDobPicker, setShowDobPicker] = useState(false);

  // Token helper
  const getAuthToken = async (): Promise<string | null> => {
    const keys = ["auth_token", "token", "userToken", "jwt", "access_token"];
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k);
      if (v) return v;
    }
    return null;
  };

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          Alert.alert("Login required", "Please login again.");
          router.replace("/login");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.log("GET /me error:", txt);
          throw new Error(txt || "Failed to load profile");
        }

        const data = await res.json();

        setUserName(data?.name ?? "");
        setEmail(data?.email ?? "");
        setProfileImage(data?.profileImage ?? null);

        // dateOfBirth can be null
        setDateOfBirth(data?.dateOfBirth ?? "");
        setAlternatePhoneNumber(data?.alternatePhone ?? "");
      } catch (e: any) {
        Alert.alert("Error", e.message || "Could not load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Upload profile image
  const handlePickImage = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Login required", "Please login again.");
        return;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setUploading(true);

      const form = new FormData();
      form.append("image", {
        uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_BASE_URL}/api/users/profile-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ don't set Content-Type manually for multipart
        },
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log("UPLOAD PHOTO ERROR:", txt);
        throw new Error(txt || "Photo upload failed");
      }

      const json = await res.json();
      setProfileImage(json?.profileImage ?? null);

      Alert.alert("Success", "Profile photo updated ✅");
    } catch (e: any) {
      Alert.alert("Upload failed", e.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // Save text profile
  const handleSave = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Login required", "Please login again.");
        return;
      }

      if (!userName.trim()) {
        Alert.alert("Invalid name", "Please enter your name.");
        return;
      }

      if (alternatePhoneNumber && alternatePhoneNumber.length !== 10) {
        Alert.alert("Invalid phone", "Alternate phone must be 10 digits.");
        return;
      }

      setSaving(true);

      // ✅ MUST MATCH BACKEND FIELDS
      const payload = {
        userName: userName.trim(),
        dateOfBirth: dateOfBirth ? dateOfBirth : null, // YYYY-MM-DD
        alternatePhoneNumber: alternatePhoneNumber
          ? alternatePhoneNumber.trim()
          : null,
      };

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log("UPDATE PROFILE ERROR:", txt);
        throw new Error(txt || "Update failed");
      }

      Alert.alert("Success", "Profile updated successfully ✅");
      router.back();
    } catch (e: any) {
      Alert.alert("Update failed", e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const formatDobToDisplay = (dob: string) => {
    // from YYYY-MM-DD to DD-MM-YYYY (only for UI display)
    if (!dob || !dob.includes("-")) return "";
    const [yyyy, mm, dd] = dob.split("-");
    return `${dd}-${mm}-${yyyy}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <View style={{ width: 34 }} />
      </View>

      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <View style={styles.avatar}>
          {profileImage ? (
            <Image
              source={{
                uri: profileImage.startsWith("http")
                  ? profileImage
                  : `${API_BASE_URL}${profileImage}`,
              }}
              style={styles.avatarImg}
            />
          ) : (
            <Ionicons name="person" size={42} color="#9CA3AF" />
          )}
        </View>

        <Pressable
          style={[styles.photoBtn, uploading && { opacity: 0.6 }]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          <Ionicons name="camera" size={18} color="#fff" />
          <Text style={styles.photoBtnText}>
            {uploading ? "Uploading..." : "Change Photo"}
          </Text>
        </Pressable>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          placeholder="Enter name"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#F3F4F6" }]}
          value={email}
          editable={false}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <Pressable style={styles.input} onPress={() => setShowDobPicker(true)}>
          <Text style={{ color: dateOfBirth ? "#111827" : "#9CA3AF" }}>
            {dateOfBirth ? formatDobToDisplay(dateOfBirth) : "Select date"}
          </Text>
        </Pressable>

        {showDobPicker && (
          <DateTimePicker
            value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()} // cannot pick future DOB
            onChange={(_, selectedDate) => {
              setShowDobPicker(false);
              if (!selectedDate) return;

              // ✅ backend expects LocalDate => YYYY-MM-DD
              const formatted =
                selectedDate.getFullYear() +
                "-" +
                String(selectedDate.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(selectedDate.getDate()).padStart(2, "0");

              setDateOfBirth(formatted);
            }}
          />
        )}

        <Text style={styles.label}>Alternate Phone</Text>
        <TextInput
          style={styles.input}
          value={alternatePhoneNumber}
          onChangeText={(t) => setAlternatePhoneNumber(t.replace(/\D/g, ""))}
          placeholder="10 digit number"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={10}
        />

        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  photoSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 18,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },

  avatarImg: { width: "100%", height: "100%" },

  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E40AF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  photoBtnText: { color: "#fff", marginLeft: 8, fontWeight: "700" },

  form: {
    paddingHorizontal: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },

  saveBtn: {
    marginTop: 18,
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
