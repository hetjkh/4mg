# EAS Build Gradle Timeout Fix

## Problem
EAS Build fails with 504 Gateway Timeout when trying to fetch `org.jfrog.buildinfo:build-info-extractor-gradle:5.2.5` from the internal EAS Artifactory:
```
Could not GET 'http://maven.production.caches.eas-build.internal/artifactory/libs-release/...'
Received status code 504 from server: Gateway Timeout
```

## Solutions Implemented

### 1. Expo Config Plugin (`plugins/with-gradle-repositories.js`)
This plugin automatically modifies Gradle configuration during EAS Build:

**Features:**
- ✅ Adds public Maven repositories (Maven Central, JFrog) as fallbacks
- ✅ Configures repositories to check public repos FIRST before EAS internal repo
- ✅ Increases network timeouts (60 seconds)
- ✅ Adds retry mechanisms (5 retries for failed downloads)
- ✅ Limits concurrent Gradle workers (max 4) to reduce network strain
- ✅ Configures pluginManagement in settings.gradle

**How it works:**
The plugin runs during the EAS Build process and modifies:
- `android/build.gradle` - Adds fallback repositories
- `android/settings.gradle` - Configures pluginManagement repositories
- `android/gradle.properties` - Adds timeout, retry, and worker settings

### 2. Custom Gradle Files (Backup Solution)
We also created custom Gradle files in the `android/` directory:
- `android/build.gradle` - Fallback repositories
- `android/gradle.properties` - Timeout and retry settings
- `android/gradle/init.gradle` - Init script for repository configuration

These files are committed to the repository and will be merged with Expo's generated files.

## Configuration Details

### Repository Order (Most Important!)
Public repositories are now checked **FIRST** before the EAS internal repository:
1. Maven Central (`https://repo1.maven.org/maven2`)
2. JFrog OSS (`https://oss.jfrog.org/artifactory/oss-snapshot-local`)
3. JFrog Public (`https://jfrog.io/artifactory/libs-release`)
4. Google & Maven Central (standard)
5. EAS Internal (may timeout)

### Timeout Settings
```properties
systemProp.http.connectionTimeout=60000
systemProp.http.socketTimeout=60000
org.gradle.internal.http.connectionTimeout=60000
org.gradle.internal.http.socketTimeout=60000
```

### Retry Mechanisms
```properties
maven.wagon.http.retryHandler.count=5
maven.wagon.http.readTimeout=60000
```

### Worker Limits
```properties
org.gradle.workers.max=4
```

## How to Use

1. **The plugin is already configured** in `app.json`:
   ```json
   "plugins": [
     "./plugins/with-gradle-repositories"
   ]
   ```

2. **Run your EAS Build**:
   ```bash
   eas build --platform android --profile preview
   ```

3. **The plugin will automatically:**
   - Modify Gradle files during the build
   - Add fallback repositories
   - Configure retry and timeout settings

## Alternative Solutions (If Issue Persists)

### Option 1: Contact EAS Support
This appears to be an EAS Build infrastructure issue. Contact Expo support:
- Email: support@expo.dev
- Forums: https://forums.expo.dev/
- GitHub: https://github.com/expo/expo/issues

### Option 2: Retry the Build
Sometimes this is a temporary network issue. Simply retry:
```bash
eas build --platform android --profile preview
```

### Option 3: Use Different Build Profile
Try a different profile:
```bash
eas build --platform android --profile development
# or
eas build --platform android --profile production
```

### Option 4: Wait and Retry Later
If it's an EAS infrastructure issue, waiting a few hours and retrying might help.

## Files Modified

- ✅ `app.json` - Added plugin configuration
- ✅ `plugins/with-gradle-repositories.js` - Main plugin file
- ✅ `android/build.gradle` - Custom Gradle config (backup)
- ✅ `android/gradle.properties` - Custom properties (backup)
- ✅ `android/gradle/init.gradle` - Init script (backup)
- ✅ `.gitignore` - Updated to allow custom Gradle files

## Testing

After pushing these changes, the next EAS Build should:
1. Check public repositories first
2. Retry failed downloads up to 5 times
3. Use longer timeouts (60 seconds)
4. Have better success rate even if EAS Artifactory times out

## Notes

- The plugin runs automatically during EAS Build - no manual steps needed
- Public repositories are checked first, so dependencies should be found even if EAS repo times out
- Retry mechanisms help with transient network issues
- Worker limits prevent overwhelming the network

## Status

✅ **Solution Implemented** - Ready for testing
🔄 **Next Step** - Run EAS Build and verify it works

