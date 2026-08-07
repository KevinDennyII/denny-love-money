package com.dennylovemoney.app.bridge

import android.webkit.JavascriptInterface
import com.dennylovemoney.app.BuildConfig
import com.dennylovemoney.app.security.DeviceAuthStore

/**
 * Bridge between the web app and the Android shell.
 * Exposed in JS as window.DennyNative
 */
class DennyNativeBridge(
    private val store: DeviceAuthStore,
    private val onRememberRequested: (username: String) -> Unit,
    private val onLogout: () -> Unit,
    private val onBiometricLoginRequested: () -> Unit,
) {
    @JavascriptInterface
    fun isNativeApp(): Boolean = true

    @JavascriptInterface
    fun getVersion(): String = BuildConfig.VERSION_NAME

    @JavascriptInterface
    fun getVersionCode(): Int = BuildConfig.VERSION_CODE

    @JavascriptInterface
    fun canBiometricLogin(): Boolean = store.canBiometricLogin()

    @JavascriptInterface
    fun getRememberedUsername(): String = store.rememberedUsername.orEmpty()

    /**
     * After username/password login with "Remember this device".
     * Password is stored only in EncryptedSharedPreferences for later biometric unlock.
     */
    @JavascriptInterface
    fun onLoginSuccess(username: String, password: String, rememberDevice: Boolean) {
        if (rememberDevice && username.isNotBlank() && password.isNotBlank()) {
            store.rememberDevice(username, password)
            onRememberRequested(username)
        } else {
            store.clear()
        }
    }

    @JavascriptInterface
    fun requestBiometricLogin() {
        onBiometricLoginRequested()
    }

    @JavascriptInterface
    fun onLogout() {
        store.clear()
        onLogout()
    }
}
