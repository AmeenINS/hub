# Mobile App Setup

This project now ships with [Capacitor](https://capacitorjs.com/) tooling so you can generate native Android and iOS shells for the existing Next.js application.

## Prerequisites
- Node.js and npm installed on your workstation.
- Android Studio (for the Android project).
- Xcode and an Apple developer account (for the iOS project).
- A running backend endpoint that the mobile shell can reach (the mobile app loads the existing Next.js build).

## Initial setup
1. Install dependencies (if you have not already):
   ```bash
   npm install
   ```
2. Create a production-ready web build that Capacitor will serve:
   ```bash
   npm run build:mobile
   ```
   This runs `next build` followed by `next export` to populate the `out/` directory, which Capacitor expects as the web assets folder.
3. Add the native platforms (run each command once):
   ```bash
   npm run cap:add:android
   npm run cap:add:ios
   ```
4. Copy the latest web assets into the native projects:
   ```bash
   npm run cap:sync
   ```

## Development workflow
1. Whenever you change the web app, rebuild and sync:
   ```bash
   npm run build:mobile
   npm run cap:sync
   ```
2. Open the native IDE projects:
   ```bash
   npm run cap:open:android  # opens Android Studio
   npm run cap:open:ios      # opens the Xcode workspace
   ```
3. Use Android Studio or Xcode to run on simulators or physical devices.

### Using a remote development server
If you prefer to serve the web app from a running dev instance, set `CAPACITOR_SERVER_URL` in your environment (and `.env`) to a reachable URL, for example:
```
CAPACITOR_SERVER_URL=http://192.168.1.100:4000
```
When this variable is present Capacitor will load that URL instead of the exported static bundle. Remember to enable cleartext traffic (`http`) only on trusted networks.

## Location permissions
The live tracking feature depends on foreground location access.

- **Android:** after adding the platform, edit `android/app/src/main/AndroidManifest.xml` and ensure the following permissions exist inside the `<manifest>` element:
  ```xml
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  ```
  Android 13+ also requires a runtime permission dialog that Capacitor handles when you call the geolocation plugin.

- **iOS:** update `ios/App/App/Info.plist` with usage descriptions:
  ```xml
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>This app tracks employee locations to display them on the live map.</string>
  ```
  If you plan to track in the background, add `NSLocationAlwaysAndWhenInUseUsageDescription` and configure background modes.

## Live location APIs
- `POST /api/locations` — watches device coordinates and persists the last known location for the authenticated user.
- `GET /api/locations?maxAgeMinutes=60` — returns all active user locations (including the caller) updated within the provided window.

Both routes rely on the existing JWT middleware, so the native shells must include the same authentication flow as the web app.
