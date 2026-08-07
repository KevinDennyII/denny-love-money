# Denny Love Money — Android companion

A Jetpack Compose Android shell that opens the same **Denny Love Money** web app Jamie and Kevin already use (`https://couple-budget.replit.app`), with the same green piggy-bank branding and icons.

This is intentional: the phone app stays an **extension** of the web app (same screens, auth, data, look & feel). Mobile UX polish (thumb-friendly bottom nav, readable type) lives in the shared React UI so the website and the APK stay in sync.

Pattern mirrors our other Android companion work (Compose `MainActivity`, Material theme, bottom-friendly navigation), plus Josh Comeau’s mobile guidance from CSS for JS Devs (viewport meta, ≥16px / 1rem body & form text, don’t lock pinch-zoom, test on a real phone).

> Not published on Google Play. We install the APK directly (sideload).

---

## For Jamie (install on a phone)

### Option A — Install an APK Kevin sends you (easiest)

1. Kevin builds the APK (see below) and shares `app-release.apk` (Drive, Signal, email, AirDrop-to-Android tools, etc.).
2. On your Android phone, open the file.
3. If Android says **“For your security, your phone is not allowed to install unknown apps from this source”**:
   - Tap **Settings** on that prompt.
   - Allow installs from that app (Chrome, Files, Drive, Messenger, etc.).
   - Go back and tap **Install**.
4. Open **Denny Love Money** from your app drawer / home screen.
5. Sign in with the same username and password you use on the website.
6. Leave **Remember this device** checked (default). Next launches can unlock with fingerprint, face, or your phone PIN — we never store your password on the phone.

That’s it — same budget, same accounts, same green piggy.

### Option B — Install over USB from a computer (developers)

1. On the phone: **Settings → About phone →** tap **Build number** seven times to enable Developer options.
2. **Settings → Developer options →** turn on **USB debugging**.
3. Plug the phone into the computer; accept the “Allow USB debugging?” prompt.
4. From the `android/` folder (after a successful build):

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

Or in Android Studio: **Run ▶** with the phone selected.

---

## For Kevin (build the APK)

### Prerequisites

- [Android Studio](https://developer.android.com/studio) (Ladybug / recent stable is fine) — includes the JDK Android needs
- Android SDK Platform **35** (Studio will prompt to install)
- This repo cloned locally

### Open & run

1. Open Android Studio → **Open** → select the `android/` folder in this repo (not the repo root).
2. Let Gradle sync finish (first sync downloads dependencies).
3. If asked for `local.properties`, Studio usually creates it. Otherwise create `android/local.properties`:

```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

4. Pick a device or emulator, then click **Run**.

Debug builds load the production site by default and append `.debug` to the application id (`com.dennylovemoney.app.debug`) so they can sit next to a release install.

### Build a release APK to share with Jamie

In Android Studio:

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. When finished, click **locate** — you’ll get something like:

`android/app/build/outputs/apk/release/app-release.apk`

Or from a terminal (with Studio’s JDK on your `PATH` / using Studio’s embedded JBR):

```bash
cd android
./gradlew assembleRelease
```

If `./gradlew` is missing the first time you clone, open the project once in Android Studio (it generates the wrapper), or run **Gradle → wrapper** from Studio.

Share that APK with Jamie using Option A above.

### Point the app at a different server (optional)

Default server URL is production:

`https://couple-budget.replit.app`

Override when building:

```bash
./gradlew assembleRelease -PserverUrl=https://YOUR_REPLIT_OR_TUNNEL_URL
```

For local UI work on a physical phone, Josh Comeau’s notes apply: prefer a tunnel such as [ngrok](https://ngrok.com/) (`ngrok http 5001`) over fighting LAN/router quirks. Then pass that `https://….ngrok-free.app` URL as `-PserverUrl=…`.

---

## App name & versions

- Launcher name is always **Denny Love Money**.
- Every shippable build bumps versions in `app/build.gradle.kts` and gets a note in [`CHANGELOG.md`](./CHANGELOG.md).
- Current: **1.2.0** (`versionCode` 3) — login-page fingerprint / PIN + remember device.

When you cut a new APK for Jamie:

1. Bump `versionName` / `versionCode` in `app/build.gradle.kts`
2. Add a section at the top of `CHANGELOG.md`
3. Build → share the APK

---

## Unlock & “Remember this device”

On the **login screen**:

1. Sign in with username + password
2. Leave **Remember this device** checked
3. Next time (after logout or a fresh install session), tap **Unlock with fingerprint or PIN**

| Step | What happens |
| --- | --- |
| Remember checked on sign-in | Credentials saved in encrypted phone storage; biometric unlock enabled |
| Unlock with fingerprint or PIN | Android prompt → signs you back into the same account |
| Remember unchecked / Log out | Clears saved credentials and biometric unlock |

Credentials only leave encrypted storage after a successful fingerprint, face, or device PIN.

---

## What’s inside

| Piece | Role |
| --- | --- |
| `MainActivity` + Compose theme | Native chrome, status bar, brand colors matching the web primary green |
| `LockScreen` + biometrics | Fingerprint / face / PIN gate when the device is remembered |
| `WebAppScreen` | Full-screen WebView loading the live Denny Love Money app |
| `DennyNative` bridge | Web login/logout talks to the Android shell |
| Launcher icons | Same piggy / apple-touch artwork as the website |
| Web mobile UI | Bottom tab bar, safe-area padding, fluid headings, 1rem inputs, Remember this device |

Back button goes back inside the WebView history when possible.

---

## Updating the app later

- **Website / feature changes** — deploy the web app (Replit). Jamie’s installed companion picks them up on next launch / refresh. No new APK required.
- **Native shell changes** (icons, package name, offline screen, default URL) — rebuild the APK and reinstall (Option A or B).

---

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| Install blocked | Enable “Install unknown apps” for the app you used to open the APK |
| Blank / error screen | Confirm `https://couple-budget.replit.app` loads in Chrome on the phone |
| Stuck on old UI | Pull down to refresh isn’t wired; force-close the app and reopen, or clear WebView cache in Android Settings → Apps → Denny Love Money → Storage |
| Can’t sign in | Use the same credentials as the website; check phone network |

---

## Privacy note

The companion only loads your family’s hosted budget app over HTTPS. It is not listed on Google Play; only people you send the APK to can install it.
