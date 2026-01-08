# Setup Guide - Authentication System

## Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **The server will run on:**
   - Local: `http://localhost:3000`
   - Network: `http://10.44.1.66:3000` (for your phone)

## Frontend Setup

1. **Make sure your IP address is correct:**
   - Check your current IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update `constants/api.ts` if your IP changes:
     ```typescript
     export const API_BASE_URL = __DEV__ 
       ? 'http://YOUR_IP_ADDRESS:3000/api' 
       : 'https://your-production-api.com/api';
     ```

2. **Start Expo:**
   ```bash
   npx expo start --tunnel
   ```

## Testing

1. **Start the backend server first** (in one terminal)
2. **Start Expo** (in another terminal)
3. **Test on your phone:**
   - Open Expo Go app
   - Scan the QR code
   - Navigate to Login/Register pages
   - Test registration and login

## Important Notes

- **Firewall**: Make sure Windows Firewall allows connections on port 3000
- **Same Network**: Your phone and computer must be on the same Wi-Fi network
- **IP Address**: If your IP changes, update `constants/api.ts`

## Troubleshooting

### Can't connect from phone?
1. Check if backend is running: Visit `http://localhost:3000/api/health` in browser
2. Check your IP address matches in `constants/api.ts`
3. Try disabling Windows Firewall temporarily to test
4. Make sure phone and computer are on same Wi-Fi

### MongoDB connection issues?
- The connection string is already configured in `server.js`
- Make sure your MongoDB Atlas cluster is running
- Check if your IP is whitelisted in MongoDB Atlas (if required)

