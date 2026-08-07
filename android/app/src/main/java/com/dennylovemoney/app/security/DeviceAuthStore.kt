package com.dennylovemoney.app.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * Long-lived "remember this device" state for the companion app.
 * Username/password are stored only in EncryptedSharedPreferences (Android Keystore)
 * and are only used after a successful fingerprint / face / device PIN unlock.
 */
class DeviceAuthStore(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        PREFS_NAME,
        MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    var isDeviceRemembered: Boolean
        get() = prefs.getBoolean(KEY_REMEMBERED, false)
        set(value) = prefs.edit().putBoolean(KEY_REMEMBERED, value).apply()

    var rememberedUsername: String?
        get() = prefs.getString(KEY_USERNAME, null)
        set(value) = prefs.edit().putString(KEY_USERNAME, value).apply()

    var rememberedPassword: String?
        get() = prefs.getString(KEY_PASSWORD, null)
        set(value) = prefs.edit().putString(KEY_PASSWORD, value).apply()

    var biometricUnlockEnabled: Boolean
        get() = prefs.getBoolean(KEY_BIOMETRIC, false)
        set(value) = prefs.edit().putBoolean(KEY_BIOMETRIC, value).apply()

    fun canBiometricLogin(): Boolean {
        return isDeviceRemembered &&
            biometricUnlockEnabled &&
            !rememberedUsername.isNullOrBlank() &&
            !rememberedPassword.isNullOrBlank()
    }

    fun rememberDevice(username: String, password: String) {
        prefs.edit()
            .putBoolean(KEY_REMEMBERED, true)
            .putBoolean(KEY_BIOMETRIC, true)
            .putString(KEY_USERNAME, username)
            .putString(KEY_PASSWORD, password)
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "denny_device_auth"
        private const val KEY_REMEMBERED = "remembered"
        private const val KEY_USERNAME = "username"
        private const val KEY_PASSWORD = "password"
        private const val KEY_BIOMETRIC = "biometric_enabled"
    }
}
