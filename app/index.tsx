import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { appLock } from "../utils/BiometricAuth";
import Splash from "./splash"; // ✅ import your splash component

export default function Index() {
  const auth = useAuth();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await appLock();
      setUnlocked(ok);
    })();
  }, []);

  // ✅ show splash while waiting
  if (!auth || auth.loading || unlocked === null) {
    return <Splash />;
  }

  if (!unlocked) return <Redirect href="/unlock" />;

  return auth.token ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/welcome" />
  );
}
