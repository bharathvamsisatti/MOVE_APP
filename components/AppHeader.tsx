import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";

type Props = {
  location?: string | null;
  onPressLocation?: () => void;
  onBack?: () => void;
};

export default function AppHeader({ location, onPressLocation, onBack }: Props) {
  const shake = useRef(new Animated.Value(0)).current;
  const [showGift, setShowGift] = useState(false);

  const shakeGift = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setShowGift(true));
  };

  return (
    <View style={styles.container}>
      {/* Left: Back (optional) + Logo + Location */}
      <View style={styles.leftRow}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color="#1E40AF" />
          </Pressable>
        )}

        <View>
          <Text style={styles.logo}>MOVE</Text>

          <Pressable style={styles.locationPill} onPress={onPressLocation}>
            <Ionicons name="location-outline" size={14} color="#1E40AF" />
            <Text style={styles.locationText}>
              {location || "Enable location"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Gift */}
      <Pressable onPress={shakeGift} accessibilityLabel="Gift">
        <Animated.View
          style={{
            transform: [
              {
                rotate: shake.interpolate({
                  inputRange: [-20, 20],
                  outputRange: ["-20deg", "20deg"],
                }) as any,
              },
            ],
          }}
        >
          <Ionicons name="gift-outline" size={26} color="#1E40AF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
  },

  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    marginRight: 10,
    padding: 6,
    borderRadius: 8,
  },

  logo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E40AF",
    letterSpacing: 1,
  },

  locationPill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  locationText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
});