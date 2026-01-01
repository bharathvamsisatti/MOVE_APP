import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { token, loading } = useAuth();

  if (loading) return null;

  // ✅ Auth gate → Tabs Home
  return token ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/welcome" />
  );
}
