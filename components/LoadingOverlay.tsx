import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

export default function LoadingOverlay() {
  return (
    <View style={styles.overlay}>
      <LottieView
        source={require("../assets/lottie/carr.json")} // 🔁 replace later
        autoPlay
        loop
        style={{ width: 180, height: 180 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
