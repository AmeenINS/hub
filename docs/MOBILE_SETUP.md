# Mobile App Setup (Capacitor)

This project uses [Capacitor](https://capacitorjs.com/) to generate native Android and iOS apps that connect to your Next.js server.

## Architecture

**Important:** The mobile apps do NOT use static export. They connect to a running Next.js server (development or production) to access all features including API routes, authentication, and real-time updates.

## Prerequisites
- Node.js and npm installed
- Android Studio (for Android)
- Xcode and Apple Developer account (for iOS)
- A running Next.js server (local dev server or production deployment)

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add native platforms (one time only):**
   ```bash
   npm run cap:add:android
   npm run cap:add:ios
   ```

3. **Sync Capacitor configuration:**
   ```bash
   npm run cap:sync
   ```

## Development Workflow

### Option 1: Local Development Server (Default)

1. **Start Next.js dev server:**
   ```bash
   npm run dev
   ```
   By default runs on `http://localhost:4000`

2. **Open native IDE:**
   ```bash
   npm run cap:open:android  # Android Studio
   npm run cap:open:ios      # Xcode
   ```

3. **Run on device/simulator** from Android Studio or Xcode

The app will connect to `http://localhost:4000` automatically.

### Option 2: Connect to Different Server

Set `CAPACITOR_SERVER_URL` environment variable:

```bash
# .env.local
CAPACITOR_SERVER_URL=http://192.168.1.100:4000
```

Or for production:
```bash
CAPACITOR_SERVER_URL=https://ameenhub.sbc.om
```

Then sync again:
```bash
npm run cap:sync
```

## Platform-Specific Configuration

### Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <!-- Location permissions for live tracking -->
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  
  <!-- Internet permission (should already exist) -->
  <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

### iOS Permissions

Edit `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app tracks employee locations to display them on the live map.</string>

<!-- Optional: for background tracking -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app tracks employee locations even in the background.</string>
```

## Features

### Live Location Tracking
- Real-time GPS tracking of authenticated users
- Updates sent to `/api/locations` endpoint
- View all users on map at `/dashboard/live-tracking`
- Requires location permissions on device

### Authentication
- Uses JWT cookies (same as web)
- Login at `/login`
- Automatic session management

### Offline Behavior
- App requires internet connection to function
- No offline data caching (connects to live server)

## API Endpoints Used by Mobile

- `POST /api/locations` - Submit user location
- `GET /api/locations?maxAgeMinutes=60` - Get all active locations
- All other dashboard API routes work as normal

## Troubleshooting

### Cannot connect to server
- Make sure Next.js server is running
- Check firewall allows connections on port 4000
- For network access, use computer's IP not `localhost`
- Verify `CAPACITOR_SERVER_URL` in `.env`

### Location not updating
- Check location permissions in device settings
- Verify `AndroidManifest.xml` / `Info.plist` permissions
- Check browser console in app for errors

### Build errors
- Run `npm run cap:sync` after any config changes
- Clean and rebuild in Android Studio / Xcode
- Check native logs for detailed errors

## Production Deployment

For production mobile apps:

1. **Deploy Next.js server** to production (e.g., https://ameenhub.sbc.om)

2. **Update Capacitor config** for production:
   ```bash
   # .env.production
   CAPACITOR_SERVER_URL=https://ameenhub.sbc.om
   NODE_ENV=production
   ```

3. **Sync and build:**
   ```bash
   npm run cap:sync
   npm run cap:open:android  # or :ios
   ```

4. **Generate release builds** in Android Studio / Xcode

5. **Publish to stores:**
   - Google Play Store (Android)
   - App Store (iOS)

## Notes

- Mobile apps are essentially native wrappers that load your web app
- All business logic runs on the server
- No need to rebuild native apps for code changes (just restart server)
- Native rebuild only needed for Capacitor config or plugin changes
