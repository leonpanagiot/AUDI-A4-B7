package gr.audi.bfblive;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.UUID;

/**
 * AudiBFB Live - Telemetry & OBD2 Android Application
 * Package: gr.audi.bfblive
 * Purpose: Real-time telemetry, boost gauge, MAF, and DTC diagnostics for Audi 1.8T BFB engines.
 * Zero-White-Screen Architecture:
 * - Immediate dark window background
 * - Dual-layer asset loader (local asset loader + live cloud fallback)
 * - Custom dark cockpit recovery screen on network or load error
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "AudiBFBLive";
    private static final int PERMISSION_REQUEST_CODE = 101;
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    // URLs
    public static final String CLOUD_URL = "https://ais-pre-fuhi5dyy6h5gorn3obts2c-689566411669.europe-west1.run.app";
    public static final String LOCAL_URL = "https://appassets.androidplatform.net/assets/index.html";

    private WebView webView;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket obdSocket;
    private OutputStream obdOutputStream;
    private InputStream obdInputStream;
    private boolean isObdConnected = false;

    // WiFi OBD-II configuration (Default ELM327 WiFi: 192.168.0.10:35000)
    private String wifiHost = "192.168.0.10";
    private int wifiPort = 35000;
    private Socket wifiSocket;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immediate dark window canvas before rendering to eliminate white screen flash
        if (getWindow() != null) {
            getWindow().setBackgroundDrawable(new ColorDrawable(Color.parseColor("#070A12")));
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            
            // Immersive full-screen automotive cockpit mode
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        setupWebView();
        checkPermissions();
    }

    private boolean checkHasLocalAssets() {
        try {
            InputStream is = getAssets().open("index.html");
            if (is != null) {
                is.close();
                return true;
            }
        } catch (IOException e) {
            Log.d(TAG, "No local index.html found in assets: " + e.getMessage());
        }
        return false;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        // Enforce dark background on WebView viewport
        webView.setBackgroundColor(Color.parseColor("#070A12"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(false);
        }

        // Hardware Acceleration for 60fps gauge animations
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Asset Loader for local offline assets
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.w(TAG, "WebView load error: " + errorCode + " [" + description + "] URL: " + failingUrl);

                // If local assets failed, automatically fallback to live cloud server
                if (failingUrl != null && (failingUrl.contains("appassets.androidplatform.net") || failingUrl.startsWith("file:"))) {
                    Log.i(TAG, "Falling back to Live Cloud Web App: " + CLOUD_URL);
                    view.loadUrl(CLOUD_URL);
                } else if (failingUrl != null && failingUrl.equals(CLOUD_URL)) {
                    // If cloud also failed, render dark cockpit error screen (NEVER white)
                    showErrorRecoveryScreen(view, description);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("AudiBFB_JS", consoleMessage.message() + " [" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + "]");
                return true;
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Grant Web Bluetooth / Audio / Sensor permissions
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        // Determine launch target
        boolean hasLocal = checkHasLocalAssets();
        Log.i(TAG, "Local index.html present in assets: " + hasLocal);

        if (hasLocal) {
            webView.loadUrl(LOCAL_URL);
        } else {
            // Local assets not yet compiled into apk -> load cloud URL directly
            webView.loadUrl(CLOUD_URL);
        }
    }

    private void showErrorRecoveryScreen(WebView view, String errorDetail) {
        String html = "<!DOCTYPE html><html><head><meta charset='utf-8'/>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1'/>"
                + "<style>"
                + "body{background-color:#070a12;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;box-sizing:border-box;text-align:center;}"
                + ".rings{display:flex;gap:4px;margin-bottom:16px;opacity:0.8;}"
                + ".ring{width:18px;height:18px;border:2px solid #cbd5e1;border-radius:50%;margin-left:-6px;}"
                + ".ring:first-child{margin-left:0;}"
                + ".title{font-size:24px;font-weight:900;letter-spacing:2px;color:#ef4444;text-transform:uppercase;margin-bottom:6px;font-family:monospace;}"
                + ".subtitle{font-size:13px;color:#94a3b8;margin-bottom:24px;font-weight:600;}"
                + ".btn-group{display:flex;flex-direction:column;gap:12px;width:100%;max-width:280px;}"
                + ".btn{background:#e11d48;color:#fff;border:none;padding:14px;border-radius:12px;font-size:14px;font-weight:bold;cursor:pointer;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 14px rgba(225,29,72,0.4);}"
                + ".btn-sec{background:#1e293b;border:1px solid #334155;color:#e2e8f0;box-shadow:none;}"
                + ".status{margin-top:20px;font-size:11px;color:#64748b;font-family:monospace;background:#0f172a;padding:8px 14px;border-radius:8px;border:1px solid #1e293b;max-width:90%;word-break:break-all;}"
                + "</style></head><body>"
                + "<div class='rings'><div class='ring'></div><div class='ring'></div><div class='ring'></div><div class='ring'></div></div>"
                + "<div class='title'>AUDIBFB <span style='color:#ffffff;'>LIVE</span></div>"
                + "<div class='subtitle'>Τηλεμετρία & OBD2 Audi 1.8T BFB (ME7.5)</div>"
                + "<div class='btn-group'>"
                + "<button class='btn' onclick=\"location.href='" + CLOUD_URL + "'\">Συνδεση Online (Cloud)</button>"
                + "<button class='btn btn-sec' onclick=\"location.href='" + LOCAL_URL + "'\">Δοκιμη Τοπικων Assets</button>"
                + "</div>"
                + "<div class='status'>Κατάσταση: " + (errorDetail != null ? errorDetail : "Αναμονή δικτύου...") + "</div>"
                + "</body></html>";
        view.loadDataWithBaseURL("https://appassets.androidplatform.net/", html, "text/html", "UTF-8", null);
    }

    private void checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{
                        Manifest.permission.BLUETOOTH_CONNECT,
                        Manifest.permission.BLUETOOTH_SCAN,
                        Manifest.permission.ACCESS_FINE_LOCATION
                }, PERMISSION_REQUEST_CODE);
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION
                }, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int res : grantResults) {
                if (res != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(this, "Απαιτούνται δικαιώματα για σύνδεση με το OBD2 dongle", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            if (obdSocket != null) {
                obdSocket.close();
            }
            if (wifiSocket != null) {
                wifiSocket.close();
            }
        } catch (IOException ignored) {}
    }
}
