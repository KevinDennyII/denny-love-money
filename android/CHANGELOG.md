# Android release changelog

Track every APK we hand to Jamie / Kevin here. Bump both values in `app/build.gradle.kts` when cutting a build:

| Field | Where | Rule |
| --- | --- | --- |
| `versionName` | `defaultConfig.versionName` | Human-facing, e.g. `1.1.0` |
| `versionCode` | `defaultConfig.versionCode` | Integer that **must increase** every installable build (Play or sideload) |

App display name is always **Denny Love Money** (`res/values/strings.xml` → `app_name`).

---

## 1.2.0 (versionCode 3) — 2026-08-06

- Login page: **Unlock with fingerprint or PIN** button when this device was remembered
- Login page: clearer **Remember this device** after username/password
- Securely store credentials (EncryptedSharedPreferences) only when Remember is checked
- Biometric unlock wired from the web login screen via `DennyNative`

## 1.1.0 (versionCode 2) — 2026-08-06

- Fingerprint / face / device PIN unlock after “Remember this device”
- Encrypted on-device remember flag (password is never stored)
- Official launcher name: **Denny Love Money** (debug builds no longer append “(Debug)”)
- Native ↔ web bridge for login / logout

## 1.0.0 (versionCode 1) — 2026-08-06

- First companion APK
- WebView shell loading `https://couple-budget.replit.app`
- Brand icons + splash matching the web app
