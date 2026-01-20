import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { appLock } from "../utils/BiometricAuth";

export default function Index() {
  const auth = useAuth();              // ⬅ full auth object
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await appLock();      // 🔐 fingerprint / PIN
      setUnlocked(ok);
    })();
  }, []);

  // Wait until auth context is ready
  if (!auth || auth.loading || unlocked === null) return null;

  if (!unlocked) return <Redirect href="/unlock" />;

  return auth.token ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/welcome" />
  );
}
