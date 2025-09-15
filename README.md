# TapFit — The Future of Fitness & Wellness  

**TapFit transforms any gym into a smart gym.**  
Using AI-powered sensors, body scanners, and a food analyzer, TapFit delivers real-time, hardware-verified workout and biometric insights — making fitness personalized, measurable, and engaging like never before.  

---

## 🚀 Vision  
TapFit is building the first **all-in-one fitness ecosystem** that connects:  
- **Smart Sensors** — Retrofit any gym machine with TapFit sensors for real-time rep, weight, and form tracking.  
- **AI Food Analyzer** — Scan and log meals instantly with machine learning–powered nutrition insights.  
- **3D Body Scanner** — Track progress visually with precise body composition scans.  
- **Wearable Integration** — Connect Apple Watch, Garmin, and other wearables for seamless biometric data sync.  

Our mission: to end the **80% fitness dropout crisis** with AI personalization and make TapFit the new global standard in health & wellness.  

---

## 🛠️ Tech Stack  
- **iOS App**: Swift + Capacitor (with BLE + NFC support)  
- **Hardware**: Puck.js v2.1 sensors (BLE/NFC), accelerometer + gyroscope  
- **Backend**: Supabase + PostgreSQL  
- **Frontend**: Vite + React + Tailwind + shadcn/ui  
- **AI/ML**: Food analyzer & biometric prediction engine (in development)  

---

## ✨ Features (Current & Upcoming)  
✅ NFC tap → instant device connection  
✅ BLE handshake with smart sensors  
✅ Rep counting with accelerometer (>2G force threshold)  
✅ Green LED feedback for reps  
✅ Blue LED NFC confirmation  
🔄 AI food analyzer (in progress)  
🔄 3D body scanner integration (in progress)  
🔄 Full wearable + nutrition sync (coming soon)  

---

## 📸 Screenshots / Demo  
*(Add screenshots or short GIFs of your app here so non-technical reviewers see progress immediately.)*  

---

## 📂 Repository Structure  
- `firmware/` → Puck.js firmware code (BLE/NFC + motion detection)  
- `ios/App/` → iOS app source code  
- `supabase/` → Database + API backend  
- `watch/TapFitWatch/` → Apple Watch companion app  
- `scripts/` → Build & setup scripts  

---

## 🧑‍💻 Getting Started (Developers)  
```bash
# Clone the repo
git clone https://github.com/RogerTapfit/tapfit-ai-sync.git

# Install dependencies
pnpm install

# iOS Setup
npx cap sync ios
open ios/App/App.xcworkspace
