import * as LocalAuthentication from "expo-local-authentication";

export async function appLock() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    alert("No fingerprint or PIN set on this phone");
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Move App",
    fallbackLabel: "Use Phone PIN",
    disableDeviceFallback: false,
  });

  return result.success;
}
