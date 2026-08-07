package com.dennylovemoney.app

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import com.dennylovemoney.app.security.DeviceAuthStore
import com.dennylovemoney.app.ui.WebAppScreen
import com.dennylovemoney.app.ui.theme.DennyLoveMoneyTheme

class MainActivity : FragmentActivity() {
    private lateinit var authStore: DeviceAuthStore
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        authStore = DeviceAuthStore(applicationContext)
        enableEdgeToEdge()

        setContent {
            DennyLoveMoneyTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .safeDrawingPadding(),
                ) {
                    // Unlock UX lives on the web login page (fingerprint / PIN + Remember device).
                    WebAppScreen(
                        serverUrl = BuildConfig.SERVER_URL,
                        authStore = authStore,
                        activity = this@MainActivity,
                        onDeviceRemembered = {
                            mainHandler.post {
                                Toast.makeText(
                                    this@MainActivity,
                                    R.string.device_remembered,
                                    Toast.LENGTH_LONG,
                                ).show()
                            }
                        },
                        onNativeLogout = {},
                    )
                }
            }
        }
    }
}
