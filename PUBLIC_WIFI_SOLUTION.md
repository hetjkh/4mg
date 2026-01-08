# Solution for Public Wi-Fi (Starbucks, etc.)

## Problem
Public Wi-Fi networks block device-to-device communication for security. Your phone can't reach your computer's IP address.

## Solution 1: Use Phone's Mobile Hotspot (Easiest)

### Steps:
1. **Enable Hotspot on Your Phone:**
   - Android: Settings → Network & Internet → Hotspot & Tethering
   - iPhone: Settings → Personal Hotspot

2. **Connect Your Computer to Phone's Hotspot:**
   - Look for your phone's network name in Wi-Fi list
   - Connect to it

3. **Find Your Computer's IP on Hotspot:**
   ```bash
   ipconfig
   ```
   - Look for the adapter connected to your phone's hotspot
   - Note the IPv4 address (usually starts with 192.168.x.x)

4. **Update API Configuration:**
   - Edit `constants/api.ts`
   - Change IP to the new one from hotspot

5. **Test:**
   - Backend should still run on port 3000
   - Phone and computer are now on same private network

## Solution 2: Use ngrok (Tunnel Service)

### Install ngrok:
1. Download from: https://ngrok.com/download
2. Extract and add to PATH, or use npx

### Setup:
1. **Start your backend:**
   ```bash
   cd backend
   npm start
   ```

2. **In another terminal, start ngrok:**
   ```bash
   npx ngrok http 3000
   ```
   Or if installed globally:
   ```bash
   ngrok http 3000
   ```

3. **Copy the Forwarding URL:**
   - You'll see something like: `https://abc123.ngrok.io`
   - Copy this URL

4. **Update API Configuration:**
   - Edit `constants/api.ts`:
   ```typescript
   export const API_BASE_URL = __DEV__ 
     ? 'https://abc123.ngrok.io/api'  // Your ngrok URL
     : 'https://your-production-api.com/api';
   ```

5. **Restart Expo:**
   ```bash
   npx expo start --tunnel
   ```

### Note:
- Free ngrok URLs change each time you restart
- You'll need to update the URL each time
- Paid ngrok plans offer static URLs

## Solution 3: Use LocalTunnel (Free Alternative)

### Install:
```bash
npm install -g localtunnel
```

### Usage:
1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start tunnel:**
   ```bash
   lt --port 3000
   ```

3. **Copy the URL and update `constants/api.ts`**

## Solution 4: Use Expo's Tunnel (For Expo Only)

Expo tunnel only works for Expo, not your custom backend. You still need one of the above solutions for the backend API.

## Recommendation

**For Development:** Use your phone's mobile hotspot - it's free, easy, and works perfectly.

**For Testing/Demo:** Use ngrok if you need a public URL that works from anywhere.

