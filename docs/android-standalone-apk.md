# Android Standalone APK

Use this flow to build an internal APK that can run on Android phones without `npm start`, Metro, or Expo Go.

## GitHub Release Build

Official transfer APKs are published from the public GitHub repository:

```text
https://github.com/jr-itdeveloper1/jr-shelf-life-label-app/releases
```

## GitHub Repository Setup

Log in to GitHub CLI as `jr-itdeveloper1`:

```powershell
gh auth login
gh auth status
```

The local repository should keep the old `jr-jhshen` remote as a backup and use `jr-itdeveloper1` as `origin`:

```powershell
git remote rename origin jr-jhshen
git remote add origin https://github.com/jr-itdeveloper1/jr-shelf-life-label-app.git
git push -u origin main
```

GitHub builds are triggered by semver tags:

```powershell
git tag v0.1.1
git push origin v0.1.1
```

The tag controls the APK version. For example, `v0.1.1` becomes Android `versionName` `0.1.1` and a generated monotonic `versionCode`.

Before the first release, log GitHub CLI in as `jr-itdeveloper1` and configure these repository secrets:

```text
ANDROID_UPLOAD_KEYSTORE_BASE64
ANDROID_UPLOAD_KEYSTORE_PASSWORD
ANDROID_UPLOAD_KEY_ALIAS
ANDROID_UPLOAD_KEY_PASSWORD
```

To create `ANDROID_UPLOAD_KEYSTORE_BASE64` from an upload keystore:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks")) | Set-Clipboard
```

Paste the clipboard value into the GitHub secret. Do not commit the keystore file.

## Build

For a local fallback build from the project root:

```powershell
npm run build:android:apk
```

The APK is generated at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

This release build embeds the JavaScript bundle/assets and includes the native GPrinter Bluetooth module.

To test a specific version locally:

```powershell
cd android
.\gradlew.bat assembleRelease "-PAPP_VERSION_NAME=0.1.1" "-PAPP_VERSION_CODE=1001"
```

## Install On A Phone

Connect the Android phone with USB debugging enabled, then run:

```powershell
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

If Android refuses to replace an existing app because the signing certificate differs, uninstall the existing app first and run the install command again.

## Notes

- This APK uses the app id `com.jrfoods.shelflifelabels`.
- GitHub release APKs are signed with the internal upload keystore stored in GitHub secrets.
- Local fallback builds use the existing debug keystore unless upload signing properties are provided.
- The app uses the production API fallback in `src/services/cloudApi.ts`: `http://labelprinter.jrgroup.com.sg:4000`.
- You do not need to run `npm start` after installing this APK.
- For a clean rebuild, run:

```powershell
npm run clean:android
npm run build:android:apk
```
