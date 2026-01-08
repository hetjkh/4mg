# Troubleshooting Network Connection Issues

## Error: "Network request failed"

This error means your phone cannot connect to the backend server. Follow these steps:

### 1. Check if Backend is Running

Open a browser on your computer and visit:
```
http://localhost:3000/api/test
```

You should see: `{"message":"api is working"}`

If you see an error, start the backend:
```bash
cd backend
npm start
```

### 2. Verify Your IP Address

1. Open Command Prompt (Windows)
2. Run: `ipconfig`
3. Find your Wi-Fi adapter's IPv4 address
4. Update `constants/api.ts` with the correct IP:
   ```typescript
   export const API_BASE_URL = __DEV__ 
     ? 'http://YOUR_IP_HERE:3000/api' 
     : 'https://your-production-api.com/api';
   ```

### 3. Check Firewall Settings

Windows Firewall might be blocking port 3000:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "3000"
6. Allow the connection
7. Apply to all profiles
8. Name it "Node.js Backend"

Or temporarily disable firewall to test.

### 4. Same Network Check

- Your phone and computer MUST be on the same Wi-Fi network
- Don't use mobile data on your phone
- Don't use a VPN on either device

### 5. Test Connection

On your phone's browser (while on same Wi-Fi), try:
```
http://10.44.1.66:3000/api/test
```

If this works in browser but not in app, it's an app configuration issue.

### 6. Restart Everything

1. Stop backend (Ctrl+C)
2. Stop Expo (Ctrl+C)
3. Restart backend: `cd backend && npm start`
4. Restart Expo: `npx expo start --tunnel`
5. Reload app on phone

### 7. Check Backend Logs

When you make a request, you should see logs in the backend terminal. If you don't see any logs, the request isn't reaching the server.

### 8. Alternative: Use Tunnel Mode

If local network doesn't work, you can use ngrok or similar:
```bash
# Install ngrok
# Run: ngrok http 3000
# Use the ngrok URL in constants/api.ts
```

### Common Issues:

- **Wrong IP**: IP address changes when you reconnect to Wi-Fi
- **Firewall**: Windows Firewall blocking connections
- **Different Networks**: Phone on mobile data, computer on Wi-Fi
- **Backend Not Running**: Forgot to start the server
- **Port Already in Use**: Another app using port 3000

