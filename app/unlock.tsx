import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { appLock } from "../utils/BiometricAuth";

export default function Unlock() {
  const router = useRouter();

  const unlockNow = async () => {
    const ok = await appLock();
    if (ok) router.replace("/");
  };

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ fontSize:22, marginBottom:12 }}>Unlock Move App</Text>
      <Pressable onPress={unlockNow} style={{ backgroundColor:"#1E40AF", padding:16, borderRadius:12 }}>
        <Text style={{ color:"#fff" }}>Unlock Now</Text>
      </Pressable>
    </View>
  );
}
