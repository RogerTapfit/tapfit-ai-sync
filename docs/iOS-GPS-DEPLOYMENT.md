# iOS GPS Run Tracking Deployment Guide

## Prerequisites
- macOS with Xcode 15+ installed
- Apple Developer account (for physical device testing)
- iOS device running iOS 16.0+

## Building for iOS

### 1. Clone Your Project
```bash
git clone [your-repo-url]
cd tapfit
npm install
```

### 2. Build the Web Assets
```bash
npm run build
```

### 3. Sync to Native iOS
```bash
npx cap sync ios
```

### 4. Open in Xcode
```bash
npx cap open ios
```

### 5. Configure Signing (in Xcode)
1. Select the **App** target
2. Go to **Signing & Capabilities**
3. Select your team
4. Xcode will automatically create a provisioning profile

### 6. Test on Physical Device
1. Connect your iPhone via USB
2. Select your device in Xcode's device dropdown
3. Click **Run** (▶️) button
4. On first launch, iOS will prompt for location permissions:
   - Tap "Allow While Using App"
   - Then go to Settings > TapFit > Location
   - Change to "Always" for background tracking

### 7. Verify GPS Tracking
1. Start a run in the app
2. Lock your iPhone screen
3. Walk/run for 2-3 minutes
4. Unlock and check - the route should have continued tracking

## Expected Performance

### Accuracy Metrics
- **GPS Accuracy**: 5-15 meters (best conditions)
- **Update Frequency**: Every 5 meters of movement
- **Background Tracking**: ✅ Works with screen locked
- **Battery Usage**: ~5-10% per hour of active tracking

### Features Enabled
- ✅ Continuous route mapping
- ✅ Auto-pause detection (when standing still)
- ✅ Split notifications with haptic feedback
- ✅ Background location updates
- ✅ Blue status bar indicator on iOS

## Troubleshooting

### "Location services not authorized"
**Solution:**
- Go to Settings > Privacy & Security > Location Services
- Ensure TapFit is set to "Always"
- Verify Location Services is enabled system-wide

### GPS not updating in background
**Solution:**
- Check that `UIBackgroundModes` includes "location" in Info.plist
- Verify `NSLocationAlwaysAndWhenInUseUsageDescription` is set
- Ensure user granted "Always" permission (not just "While Using")

### Poor accuracy (>50m)
**Solution:**
- Ensure you're outdoors with clear sky view
- Wait 30-60 seconds for GPS to acquire satellites
- Check that `desiredAccuracy` is set to 0 (best)
- Avoid starting indoors or in urban canyons

### App crashes on location update
**Solution:**
- Check Xcode console for specific error messages
- Verify all Capacitor dependencies are synced: `npx cap sync ios`
- Clean build folder in Xcode: Product > Clean Build Folder

## Testing Checklist

Before releasing to production, test these scenarios:

### ✅ Permission Flow
- [ ] App requests "When In Use" permission first
- [ ] User can upgrade to "Always" in Settings
- [ ] App gracefully handles denied permissions
- [ ] Proper error messages shown for permission issues

### ✅ Background Tracking
- [ ] Start run, lock screen → GPS continues
- [ ] Start run, switch to another app → GPS continues
- [ ] Blue status bar indicator shows when tracking
- [ ] Route continues to update in background

### ✅ Accuracy
- [ ] GPS accuracy < 20 meters in open areas
- [ ] Route matches actual path taken
- [ ] Splits trigger at correct distances (1km/1mi)
- [ ] Distance calculation is accurate

### ✅ Battery & Performance
- [ ] Reasonable battery drain (~5-10%/hour)
- [ ] No excessive wake-ups or crashes
- [ ] App remains responsive during tracking
- [ ] Location updates stop properly after finishing run

### ✅ Edge Cases
- [ ] Handles poor GPS signal gracefully
- [ ] Auto-pause works when standing still
- [ ] Resume works correctly after pause
- [ ] Session data persists after app restart

## App Store Submission

Before submitting to the App Store, ensure:

1. **Privacy Manifest** (`PrivacyInfo.xcprivacy`) is included
2. **Location Usage Descriptions** are clear and accurate
3. **Background Modes** are properly declared
4. **Test on multiple devices** (various iOS versions)
5. **Review Apple's Location Services Guidelines**: https://developer.apple.com/design/human-interface-guidelines/location

### Location Permission Best Practices
- Request "When In Use" permission first
- Only ask for "Always" permission when user starts a run
- Clearly explain why continuous location is needed
- Provide value before requesting permissions

## Comparison with Strava

After proper implementation, TapFit achieves:

| Feature | TapFit (Native) | Strava |
|---------|-----------------|--------|
| GPS Accuracy | 5-15m | 5-15m |
| Background Tracking | ✅ Yes | ✅ Yes |
| Auto-Pause | ✅ Yes | ✅ Yes |
| Split Notifications | ✅ Yes | ✅ Yes |
| Battery Usage | ~5-10%/hr | ~5-10%/hr |
| Route Export | 🚧 Coming | ✅ GPX |

## Next Steps

After successful deployment:

1. **Add Route Export**: Implement GPX file export for route sharing
2. **Apple Watch Integration**: Sync heart rate data from Apple Watch
3. **Strava API**: Direct integration for syncing workouts to Strava
4. **Offline Maps**: Cache map tiles for offline use
5. **Social Features**: Share routes and compete with friends

## Support

For issues or questions:
- Check Capacitor docs: https://capacitorjs.com/docs/ios
- Review background geolocation plugin: https://github.com/capacitor-community/background-geolocation
- Apple Location Services: https://developer.apple.com/documentation/corelocation
