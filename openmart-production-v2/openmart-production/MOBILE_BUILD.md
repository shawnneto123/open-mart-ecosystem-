# OpenMart Mobile Build Guide

Build OpenMart as native Android APK or iOS app using Capacitor.

## Prerequisites

### For Android APK
- **Node.js** 16+ with npm
- **Java Development Kit (JDK)** 17+
  ```bash
  # macOS with Homebrew
  brew install openjdk@17
  
  # Or download from: https://www.oracle.com/java/technologies/downloads/
  ```
  
- **Android Studio** or **Android SDK Command Line Tools**
  ```bash
  # macOS
  brew install android-sdk
  
  # Or download Android Studio: https://developer.android.com/studio
  ```

- **Gradle** (usually comes with Android Studio)

### For iOS
- **Xcode** 14+ (macOS only)
  ```bash
  xcode-select --install
  ```
- **CocoaPods**
  ```bash
  sudo gem install cocoapods
  ```

## Quick Start - Android APK

### 1. **Install Dependencies**
```bash
cd /path/to/openmart-production
npm install
```

### 2. **Build Web Assets**
```bash
npm run build
```

### 3. **Initialize Capacitor Project**
```bash
npm run cap:add:android
```

### 4. **Sync Web Code to Native Project**
```bash
npm run cap:sync
```

### 5. **Build Debug APK**
```bash
npm run apk:debug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 6. **Install on Device or Emulator**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Production Android APK Release

### 1. **Generate Signing Key**
```bash
keytool -genkey -v -keystore openmart-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias openmart-key
```

### 2. **Configure Gradle Signing**
Edit `android/app/build.gradle`:
```gradle
android {
  ...
  signingConfigs {
    release {
      storeFile file('path/to/openmart-release-key.jks')
      storePassword 'YOUR_STORE_PASSWORD'
      keyAlias 'openmart-key'
      keyPassword 'YOUR_KEY_PASSWORD'
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

### 3. **Build Release APK**
```bash
npm run apk:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### 4. **Sign with jarsigner** (if needed)
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore openmart-release-key.jks \
  android/app/build/outputs/apk/release/app-release-unsigned.apk openmart-key
```

---

## iOS Build (macOS only)

### 1. **Initialize Capacitor for iOS**
```bash
npm run cap:add:ios
```

### 2. **Sync and Open in Xcode**
```bash
npm run cap:sync
npm run cap:open:ios
```

### 3. **Build in Xcode**
- Select **Generic iOS Device** or your connected iPhone
- Product → Build: `Cmd + B`
- Product → Archive: `Cmd + Shift + K`
- Distribute App

---

## Environment Configuration

Create `.env` file in project root with Capacitor-specific settings:
```env
VITE_BUSINESS_NAME=OpenMart Abuja
VITE_BUSINESS_PHONE=+234801234567
VITE_WHATSAPP_BUSINESS_NUMBER=2348091234567
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE_xxxxx
VITE_API_URL=https://api.yourdomain.com
```

---

## Testing the App

### Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_33

# Install app to running emulator
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep "com.openmart"
```

### Physical Device
```bash
# Enable USB Debugging on Android device
# Settings → Developer Options → USB Debugging

# Connect device
adb devices

# Install
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Test on device
```

---

## Troubleshooting

### "gradle: command not found"
```bash
# macOS
brew install gradle

# Or use Android Studio's bundled Gradle
export PATH="$PATH:/path/to/android-sdk/tools:/path/to/android-sdk/platform-tools"
```

### Java version mismatch
```bash
# Set JDK 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### "No module named 'gradle'" (Python issue)
```bash
# Reinstall gradle
rm -rf ~/.gradle
gradle clean
npm run apk:debug
```

### Capacitor sync errors
```bash
# Clean and resync
rm -rf android ios node_modules
npm install
npm run cap:sync
```

### APK signing errors
```bash
# Verify keystore
keytool -list -v -keystore openmart-release-key.jks
```

---

## Play Store Submission

1. **Create Google Play Developer Account** ($25 one-time fee)
2. **Generate Release APK** (see Production section above)
3. **Create App on Google Play Console**
4. **Upload APK** → Internal Testing → Production
5. **Fill Metadata**:
   - App name, description, screenshots
   - Category: Shopping
   - Content rating questionnaire
   - Privacy policy URL
6. **Review and publish** (24-48 hours for approval)

### Pre-Submission Checklist
- [ ] Minify and optimize build
- [ ] Test on multiple device sizes
- [ ] Verify all payment methods work
- [ ] Check offline functionality
- [ ] Confirm privacy policy compliance
- [ ] Set correct targetSdk (Android 13+)
- [ ] Include app icon (512x512 PNG)
- [ ] Add screenshots (2-8 per device type)

---

## App Store Submission (iOS)

1. **Enroll in Apple Developer Program** ($99/year)
2. **Create App ID and certificates** in Apple Developer Portal
3. **Archive in Xcode** → Product → Archive
4. **Upload via Xcode or Transporter**
5. **Fill App Store metadata** and screenshots
6. **Submit for review** (24-48 hours typical)

---

## Performance Optimization

### Before Release
```bash
# Analyze bundle size
npm run build -- --analyze

# Test production build locally
npm run preview

# Minify images in public/
```

### Android-Specific
Edit `android/app/build.gradle`:
```gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true  # Remove unused resources
    }
  }
}
```

---

## Continuous Integration/Deployment

### GitHub Actions Example
```yaml
name: Build APK

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run cap:sync
      - uses: actions/upload-artifact@v3
        with:
          name: apk
          path: android/app/build/outputs/apk/debug/
```

---

## Key Capacitor Commands

| Command | Purpose |
|---------|---------|
| `cap add android` | Initialize Android project |
| `cap add ios` | Initialize iOS project |
| `cap sync` | Sync web code to native projects |
| `cap open android` | Open Android Studio |
| `cap open ios` | Open Xcode |
| `cap run android` | Build and run on Android |
| `cap copy` | Copy web build to native projects (without sync) |

---

## Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Build Guide**: https://developer.android.com/build
- **Gradle Documentation**: https://docs.gradle.org
- **Play Store Guidelines**: https://developer.android.com/distribute/best-practices
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/

---

## Support

For issues:
1. Check Capacitor docs
2. Review native project logs
3. Test on physical device
4. Check GitHub issues for similar problems

Good luck with your OpenMart mobile app! 🎉
