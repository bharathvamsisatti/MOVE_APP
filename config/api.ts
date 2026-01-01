import { Platform } from "react-native";

const LOCAL_IP = "172.16.3.94"; // ✅ your correct IP // 🔴 replace with your PC IP   //office -  172.16.3.94


export const API_BASE_URL =
  Platform.OS === "android"
    ? `http://${LOCAL_IP}:8080`
    : "http://localhost:8080";
