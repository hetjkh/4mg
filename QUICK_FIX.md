# Quick Fix for Network Connection

## ✅ Your IP Address is Correct: 10.44.1.66

The configuration is already correct. Here's what to check:

## Step-by-Step Fix:

### 1. Verify Backend is Running
The backend should be running. Check the terminal where you ran `npm start` in the backend folder.

You should see:
```
Server running on http://0.0.0.0:3000
Network access: http://10.44.1.66:3000
```

### 2. Test in Browser First
On your computer, open a browser and go to:
```
http://localhost:3000/api/test
```

You should see: `{"message":"api is working"}`

If this doesn't work, the backend isn't running properly.

### 3. Test from Phone Browser
On your phone (same Wi-Fi), open a browser and go to:
```
http://10.44.1.66:3000/api/test
```

If this works in browser but not in app, it's an app configuration issue.

### 4. Check Windows Firewall
Windows Firewall might be blocking port 3000:

**Quick Test:**
1. Temporarily disable Windows Firewall
2. Try the app again
3. If it works, re-enable firewall and add an exception

**Add Firewall Exception:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 3000
4. Allow connection → All profiles
5. Name: "Node.js Backend"

### 5. Restart Everything
1. Stop backend (Ctrl+C in backend terminal)
2. Stop Expo (Ctrl+C in Expo terminal)
3. Restart backend: `cd backend && npm start`
4. Restart Expo: `npx expo start --tunnel`
5. Reload app on phone (shake device → Reload)

### 6. Check Network
- Phone and computer MUST be on same Wi-Fi
- Don't use mobile data
- Don't use VPN
- Make sure phone Wi-Fi is connected (not mobile data)

### 7. Try the Retry Button
On the home page, there's now a "Retry Connection" button. Tap it to test again.

## Still Not Working?

1. Check backend terminal for any error messages
2. Check Expo terminal for any error messages
3. Make sure you rebuilt the app after adding `usesCleartextTraffic` in app.json
4. Try restarting your Wi-Fi router

