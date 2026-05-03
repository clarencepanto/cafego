import { Platform } from "react-native";

// Replace YOUR_LOCAL_IP with your Mac's WiFi IP
// Find it: System Settings > WiFi > Details > IP Address
const LOCAL_IP = "10.0.0.7";

export const API_BASE =
  Platform.OS === "web" ? "http://localhost:3001" : `http://${LOCAL_IP}:3001`;
