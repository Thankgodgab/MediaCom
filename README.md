# MediaCom 🎙️

A professional LAN-based real-time intercom app designed for church media teams. Coordinate sound, camera, and directing seamlessly without internet.

## ✨ Features
- **Low Latency Audio**: Powered by WebRTC (Mesh Networking).
- **LAN-Only**: Works purely on your local Wi-Fi.
- **Push-To-Talk (PTT)**: Minimize background noise with classic walkie-talkie functionality.
- **Group Intercom**: Everyone hears everyone else (echo-free).
- **Professional UI**: Modern dark theme with high-fidelity animations and status tracking.
- **Role Management**: Specialized modes for Directors and Team Members.

## 🚀 Getting Started

### 1. Start the Signaling Server
The server coordinates connections between devices on the network.
```bash
cd mediacom-server
npm install
node server.js
```
*Tip: Run this on a laptop that stays on during the service.*

### 2. Connect Your Devices
1. Ensure all phones are on the same Wi-Fi as the server.
2. Open the MediaCom app.
3. Enter your **Name** and the **Local IP Address** of the server (e.g., `192.168.1.15`).
4. Tap **JOIN CHANNEL**.

### 3. Usage
- **Hold the Big Mic** to speak.
- Other team members will see you "TRANSMITTING".
- Audio is routed through the phone speaker by default.

## 🛠 Tech Stack
- **Frontend**: React Native via Expo.
- **Real-time Audio**: `react-native-webrtc`.
- **Signaling**: `socket.io` (running on Node.js).
- **Animations**: `react-native-reanimated`.

## ⚙️ Requirements
- All devices must be on the same local network subnet.
- Microphone permissions must be granted.
- The signaling server port (`3001`) must be open in any local firewalls.

---
Built with ❤️ for Media Teams.
