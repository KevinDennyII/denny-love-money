package com.dennylovemoney.app.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.fragment.app.FragmentActivity
import com.dennylovemoney.app.R
import com.dennylovemoney.app.bridge.DennyNativeBridge
import com.dennylovemoney.app.security.BiometricUnlock
import com.dennylovemoney.app.security.DeviceAuthStore
import com.dennylovemoney.app.ui.theme.BrandPrimary
import org.json.JSONObject

private val AllowedHosts = setOf(
    "couple-budget.replit.app",
    "replit.app",
    "replit.dev",
    "localhost",
    "127.0.0.1",
    "10.0.2.2",
)

private fun isAllowedUrl(url: Uri?): Boolean {
    if (url == null) return false
    val host = url.host ?: return false
    if (host in AllowedHosts) return true
    if (host.endsWith(".replit.app") || host.endsWith(".replit.dev")) return true
    if (host.startsWith("192.168.") || host.startsWith("10.")) return true
    return false
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebAppScreen(
    serverUrl: String,
    authStore: DeviceAuthStore,
    activity: FragmentActivity,
    onDeviceRemembered: () -> Unit = {},
    onNativeLogout: () -> Unit = {},
) {
    val context = LocalContext.current
    var isLoading by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }
    var webView by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }
    val mainHandler = remember { Handler(Looper.getMainLooper()) }

    fun deliverBiometricCredentials(view: WebView) {
        val username = authStore.rememberedUsername.orEmpty()
        val password = authStore.rememberedPassword.orEmpty()
        if (username.isBlank() || password.isBlank()) {
            view.evaluateJavascript(
                "window.__dennyOnBiometricError && window.__dennyOnBiometricError('No saved sign-in on this device.');",
                null,
            )
            return
        }
        val payload = JSONObject()
            .put("username", username)
            .put("password", password)
            .toString()
        view.evaluateJavascript(
            "window.__dennyOnBiometricUnlock && window.__dennyOnBiometricUnlock($payload);",
            null,
        )
    }

    fun promptBiometricLogin(view: WebView) {
        if (!BiometricUnlock.canAuthenticate(activity)) {
            view.evaluateJavascript(
                "window.__dennyOnBiometricError && window.__dennyOnBiometricError('Set up a fingerprint, face unlock, or PIN in Android Settings first.');",
                null,
            )
            return
        }
        BiometricUnlock.prompt(
            activity = activity,
            title = activity.getString(R.string.unlock_prompt_title),
            subtitle = activity.getString(R.string.unlock_prompt_subtitle),
            onSuccess = { deliverBiometricCredentials(view) },
            onError = { message ->
                val safe = JSONObject.quote(message)
                view.evaluateJavascript(
                    "window.__dennyOnBiometricError && window.__dennyOnBiometricError($safe);",
                    null,
                )
            },
        )
    }

    BackHandler(enabled = canGoBack) {
        webView?.goBack()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.databaseEnabled = true
                    settings.cacheMode = WebSettings.LOAD_DEFAULT
                    settings.mediaPlaybackRequiresUserGesture = false
                    settings.builtInZoomControls = false
                    settings.displayZoomControls = false
                    settings.setSupportZoom(true)
                    settings.useWideViewPort = true
                    settings.loadWithOverviewMode = true
                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                    settings.textZoom = 100

                    addJavascriptInterface(
                        DennyNativeBridge(
                            store = authStore,
                            onRememberRequested = {
                                mainHandler.post { onDeviceRemembered() }
                            },
                            onLogout = {
                                mainHandler.post { onNativeLogout() }
                            },
                            onBiometricLoginRequested = {
                                mainHandler.post { promptBiometricLogin(this) }
                            },
                        ),
                        "DennyNative",
                    )

                    webChromeClient = WebChromeClient()
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            view: WebView,
                            request: WebResourceRequest,
                        ): Boolean {
                            val uri = request.url
                            return if (isAllowedUrl(uri)) {
                                false
                            } else {
                                context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                                true
                            }
                        }

                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            isLoading = true
                            hasError = false
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            isLoading = false
                            canGoBack = view?.canGoBack() == true
                            val canBio = authStore.canBiometricLogin()
                            val rememberedUser = JSONObject.quote(authStore.rememberedUsername.orEmpty())
                            view?.evaluateJavascript(
                                """
                                (function(){
                                  try {
                                    window.__DENNY_NATIVE__ = true;
                                    window.__DENNY_CAN_BIOMETRIC__ = ${canBio};
                                    window.__DENNY_REMEMBERED_USER__ = $rememberedUser;
                                    window.dispatchEvent(new Event('denny-native-ready'));
                                  } catch (e) {}
                                })();
                                """.trimIndent(),
                                null,
                            )
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?,
                        ) {
                            if (request?.isForMainFrame == true) {
                                isLoading = false
                                hasError = true
                            }
                        }
                    }

                    webView = this
                    loadUrl(serverUrl)
                }
            },
            update = { view ->
                webView = view
            },
        )

        if (isLoading && !hasError) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_piggy_bank),
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(72.dp),
                )
                Spacer(modifier = Modifier.height(20.dp))
                CircularProgressIndicator(color = BrandPrimary)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = stringResource(R.string.loading_message),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground,
                )
            }
        }

        if (hasError) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(
                    imageVector = Icons.Rounded.CloudOff,
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(56.dp),
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = stringResource(R.string.offline_title),
                    style = MaterialTheme.typography.titleLarge,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.offline_body),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = {
                    hasError = false
                    isLoading = true
                    webView?.loadUrl(serverUrl)
                }) {
                    Icon(Icons.Rounded.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.size(8.dp))
                    Text(stringResource(R.string.retry))
                }
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(serverUrl)))
                }) {
                    Text(stringResource(R.string.open_in_browser))
                }
            }
        }
    }
}
