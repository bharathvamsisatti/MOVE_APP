import { View, Text, Pressable } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{user?.email}</Text>

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/welcome");
        }}
      >
        <Text style={{ color: "red", marginTop: 20 }}>Logout</Text>
      </Pressable>
    </View>
  );
}
