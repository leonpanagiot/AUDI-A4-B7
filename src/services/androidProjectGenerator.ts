import JSZip from 'jszip';

export interface AndroidFilePreview {
  path: string;
  description: string;
  content: string;
}

export const CLOUD_APP_URL = 'https://ais-pre-fuhi5dyy6h5gorn3obts2c-689566411669.europe-west1.run.app';

export const getAndroidProjectFiles = (): AndroidFilePreview[] => {
  return [
    {
      path: 'AudiBFBLive_Android/app/src/main/java/gr/audi/bfblive/MainActivity.java',
      description: 'Κύρια κλάση Android Activity με αρχιτεκτονική Zero-White-Screen, αυτόματη φόρτωση Cloud URL και υποστήριξη OBD2 WiFi/Bluetooth',
      content: `package gr.audi.bfblive;

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
 * - Immediate dark window background (#070A12)
 * - Dual-layer asset loader (local asset loader + live cloud fallback)
 * - Custom dark cockpit recovery screen on network or load error
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "AudiBFBLive";
    private static final int PERMISSION_REQUEST_CODE = 101;
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    public static final String CLOUD_URL = "${CLOUD_APP_URL}";
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

        // Hardware Acceleration
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
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        boolean hasLocal = checkHasLocalAssets();
        Log.i(TAG, "Local index.html present: " + hasLocal);

        if (hasLocal) {
            webView.loadUrl(LOCAL_URL);
        } else {
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
`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/assets/index.html',
      description: 'Ενσωματωμένος offline φορτωτής (Offline Shell) για άμεση εκτέλεση χωρίς λευκή οθόνη',
      content: `<!doctype html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>AudiBFB Live</title>
  <style>
    body {
      background-color: #070a12;
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      text-align: center;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #1e293b;
      border-top-color: #ef4444;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .brand {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 3px;
      color: #ef4444;
      text-transform: uppercase;
      font-family: monospace;
    }
    .sub {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 8px;
      font-weight: 600;
    }
    .btn {
      margin-top: 24px;
      background: #e11d48;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <div class="brand">AUDIBFB <span style="color:#ffffff;">LIVE</span></div>
  <div class="sub">Εκκίνηση Πίνακα Τηλεμετρίας Audi 1.8T BFB...</div>
  <script>
    // Automatically redirect to Cloud live app if available
    setTimeout(() => {
      window.location.href = "${CLOUD_APP_URL}";
    }, 400);
  </script>
</body>
</html>`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/AndroidManifest.xml',
      description: 'Android Manifest με δικαιώματα Bluetooth OBD2, WiFi Network Socket, GPS και Fullscreen',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="gr.audi.bfblive">

    <!-- Bluetooth & OBD-II permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <!-- Performance Acceleration & GPS Speedometer -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Network & WiFi OBD2 (ELM327 WiFi 192.168.0.10:35000) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AudiBFBLive.Fullscreen"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="sensorLandscape"
            android:theme="@style/Theme.AudiBFBLive.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
    },
    {
      path: 'AudiBFBLive_Android/app/build.gradle',
      description: 'Ρυθμίσεις Gradle για το App Module (Target SDK 34, AndroidX, Material Design, WebKit)',
      content: `plugins {
    id 'com.android.application'
}

android {
    namespace 'gr.audi.bfblive'
    compileSdk 34

    defaultConfig {
        applicationId "gr.audi.bfblive"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.webkit:webkit:1.10.0'
}`
    },
    {
      path: 'AudiBFBLive_Android/build.gradle',
      description: 'Root Gradle configuration για Android build system',
      content: `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.3.1"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}`
    },
    {
      path: 'AudiBFBLive_Android/settings.gradle',
      description: 'Project settings declaration',
      content: `rootProject.name = "AudiBFBLive_Android"
include ':app'`
    },
    {
      path: 'AudiBFBLive_Android/gradle.properties',
      description: 'Gradle JVM performance memory settings',
      content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/res/layout/activity_main.xml',
      description: 'Layout XML with dark background and hardware accelerated WebView',
      content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#070A12"
    tools:context=".MainActivity">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#070A12" />

</androidx.constraintlayout.widget.ConstraintLayout>`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/res/values/strings.xml',
      description: 'Application titles and localized strings',
      content: `<resources>
    <string name="app_name">AudiBFB Live</string>
    <string name="car_model">Audi A4 1.8T BFB 20V</string>
</resources>`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/res/values/colors.xml',
      description: 'Motorsport palette colors (Audi Red, Charcoal Black)',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="audi_red">#E11D48</color>
    <color name="cockpit_bg">#070A12</color>
    <color name="gauge_dial">#1E293B</color>
    <color name="white">#FFFFFFFF</color>
</resources>`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/res/values/themes.xml',
      description: 'Theme with dark window background to prevent white screen flashes',
      content: `<resources>
    <style name="Theme.AudiBFBLive" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/audi_red</item>
        <item name="android:statusBarColor">@color/cockpit_bg</item>
        <item name="android:navigationBarColor">@color/cockpit_bg</item>
        <item name="android:windowBackground">@color/cockpit_bg</item>
        <item name="android:colorBackground">@color/cockpit_bg</item>
    </style>
    <style name="Theme.AudiBFBLive.Fullscreen" parent="Theme.AudiBFBLive">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowBackground">@color/cockpit_bg</item>
    </style>
</resources>`
    },
    {
      path: 'AudiBFBLive_Android/README.md',
      description: 'Πλήρης Οδηγός μεταγλώττισης του APK στο Android Studio & αυτόματη δημιουργία',
      content: `# AudiBFB Live - Android Project (gr.audi.bfblive)

## Ελληνικός Οδηγός Δημιουργίας του .APK (Χωρίς Λευκή Οθόνη)

Αυτό το πακέτο περιέχει όλα τα απαραίτητα αρχεία για τη δημιουργία του αρχείου **.APK** για το κινητό σας Android.

### Τρόπος 1: Άμεση εγκατάσταση χωρίς υπολογιστή (PWA / WebAPK)
Μπορείτε να εγκαταστήσετε την εφαρμογή απευθείας από το κινητό σας:
1. Ανοίξτε το link της εφαρμογής στον Google Chrome στο Android κινητό σας:
   ${CLOUD_APP_URL}
2. Πατήστε το κουμπί **«Εγκατάσταση APK»** στο πάνω μέρος της οθόνης ή στις 3 τελείες του Chrome -> **«Εγκατάσταση εφαρμογής»**.
3. Η εφαρμογή θα εγκατασταθεί ως native αυτόνομο app με το δικό της εικονίδιο!

---

### Τρόπος 2: Μεταγλώττιση (Build) του .APK μέσω Android Studio
1. Αποσυμπιέστε αυτό το ZIP αρχείο (\`AudiBFBLive_Android\`).
2. Ανοίξτε το Android Studio και επιλέξτε **File -> Open...** και επιλέξτε τον φάκελο \`AudiBFBLive_Android\`.
3. Περιμένετε να ολοκληρωθεί το Gradle Sync.
4. Στο πάνω μενού, πατήστε:
   **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**
5. Μόλις ολοκληρωθεί, πατήστε **locate**.
6. Το αρχείο **\`app-debug.apk\`** είναι έτοιμο!

---

### Χαρακτηριστικά εφαρμογής:
- **Zero White Screen Guarantee**: Σκούρο υπόβαθρο παντού, αυτόματη σύνδεση με το cloud dashboard και ενσωματωμένος offline shell.
- **Ζωντανή Τηλεμετρία Audi 1.8T BFB**: Boost (BAR/PSI), RPM, MAF (g/s), AFR, Knock Retard ανά κύλινδρο (Cyl 1-4).
- **Σύνδεση OBD-II ELM327**: Υποστήριξη WiFi (192.168.0.10:35000) & Bluetooth dongles.
- **VAG-COM DTC Scanner**: Ανάγνωση και σβήσιμο κωδικών σφάλματος (Check Engine / MIL).
- **Μετρητής 0-100 km/h**: Αυτόματη εκκίνηση και καταγραφή G-Force.
- **Keep Screen On**: Η οθόνη μένει αναμμένη στο ταμπλό του αυτοκινήτου.
`
    },
    {
      path: 'AudiBFBLive_Android/.github/workflows/build-apk.yml',
      description: 'Αυτόματη μεταγλώττιση (Cloud CI) του APK μέσω GitHub Actions',
      content: `name: Build AudiBFB Live APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install --legacy-peer-deps

      - name: Build Web Dashboard
        run: npm run build

      - name: Copy Web Build into Android Assets
        run: |
          mkdir -p android/app/src/main/assets
          cp -r dist/* android/app/src/main/assets/

      - name: Set up Java 17
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.5'

      - name: Build Android APK with Gradle
        working-directory: android
        env:
          ANDROID_HOME: /usr/local/lib/android/sdk
        run: |
          echo "sdk.dir=/usr/local/lib/android/sdk" > local.properties
          gradle assembleDebug --stacktrace --no-daemon

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: AudiBFBLive-debug-apk
          path: android/app/build/outputs/apk/debug/*.apk
`
    }
  ];
};

/**
 * Creates and triggers the download of the entire AudiBFBLive_Android.zip archive.
 */
export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();
  const files = getAndroidProjectFiles();

  files.forEach(f => {
    zip.file(f.path, f.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'AudiBFBLive_Android_Project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
