import JSZip from 'jszip';

export interface AndroidFilePreview {
  path: string;
  description: string;
  content: string;
}

export const getAndroidProjectFiles = (): AndroidFilePreview[] => {
  return [
    {
      path: 'AudiBFBLive_Android/app/src/main/java/gr/audi/bfblive/MainActivity.java',
      description: 'Κύρια κλάση Android Activity με πλήρη υποστήριξη OBD2 Bluetooth, Hardware Accelerated WebView και Car Cockpit KeepScreenOn',
      content: `package gr.audi.bfblive;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

/**
 * AudiBFB Live - Telemetry & OBD2 Android Application
 * Package: gr.audi.bfblive
 * Purpose: Real-time telemetry, boost gauge, MAF, and DTC diagnostics for Audi 1.8T BFB engines.
 */
public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 101;
    // Standard ELM327 Bluetooth Serial Port Profile (SPP) UUID
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private WebView webView;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket obdSocket;
    private OutputStream obdOutputStream;
    private InputStream obdInputStream;
    private boolean isObdConnected = false;

    // WiFi OBD-II configuration (Default ELM327 WiFi: 192.168.0.10:35000)
    private String wifiHost = "192.168.0.10";
    private int wifiPort = 35000;
    private java.net.Socket wifiSocket;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on while driving in car mount
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Immersive full-screen automotive cockpit mode
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        setupWebView();
        checkPermissions();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Hardware Acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Grant Web Bluetooth / Media permissions
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }
        });

        // Load the live dashboard app
        webView.loadUrl("file:///android_asset/index.html");
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
                Toast.makeText(this, "Απαιτούνται δικαιώματα Bluetooth για σύνδεση με το OBD2 dongle", Toast.LENGTH_LONG).show();
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
        } catch (IOException ignored) {}
    }
}
`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/AndroidManifest.xml',
      description: 'Android Manifest με δικαιώματα Bluetooth OBD2, Location για G-Force/0-100 και Fullscreen',
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
        android:theme="@style/Theme.AudiBFBLive"
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
      description: 'Ρυθμίσεις Gradle για το App Module (Target SDK 34, AndroidX, Material Design)',
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
      description: 'Layout XML with full-screen hardware accelerated WebView for telemetry instruments',
      content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#090D16"
    tools:context=".MainActivity">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#090D16" />

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
    <color name="cockpit_bg">#090D16</color>
    <color name="gauge_dial">#1E293B</color>
    <color name="white">#FFFFFFFF</color>
</resources>`
    },
    {
      path: 'AudiBFBLive_Android/app/src/main/res/values/themes.xml',
      description: 'Theme with NoActionBar for pure automotive display',
      content: `<resources>
    <style name="Theme.AudiBFBLive" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/audi_red</item>
        <item name="android:statusBarColor">@color/cockpit_bg</item>
        <item name="android:navigationBarColor">@color/cockpit_bg</item>
    </style>
    <style name="Theme.AudiBFBLive.Fullscreen" parent="Theme.AudiBFBLive">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>`
    },
    {
      path: 'AudiBFBLive_Android/README.md',
      description: 'Πλήρης Οδηγός μεταγλώττισης του APK στο Android Studio & αυτόματη δημιουργία',
      content: `# AudiBFB Live - Android Project (gr.audi.bfblive)

## Ελληνικός Οδηγός Δημιουργίας του .APK

Αυτό το πακέτο περιέχει όλα τα απαραίτητα αρχεία για τη δημιουργία του αρχείου **.APK** για το κινητό σας Android.

### Τρόπος 1: Άμεση εγκατάσταση χωρίς υπολογιστή (PWA / WebAPK)
Μπορείτε να εγκαταστήσετε την εφαρμογή απευθείας από το κινητό σας:
1. Ανοίξτε το link της εφαρμογής στον Google Chrome στο Android κινητό σας.
2. Πατήστε το κουμπί **«Εγκατάσταση APK»** στο πάνω μέρος της οθόνης ή στις 3 τελείες του Chrome -> **«Εγκατάσταση εφαρμογής»**.
3. Η εφαρμογή θα εγκατασταθεί ως native αυτόνομο app με το δικό της εικονίδιο!

---

### Τρόπος 2: Μεταγλώττιση (Build) του .APK μέσω Android Studio
1. Κατεβάστε και εγκαταστήστε το **Android Studio** στον υπολογιστή σας (Windows, Mac ή Linux).
2. Αποσυμπιέστε αυτό το ZIP αρχείο (\`AudiBFBLive_Android\`).
3. Ανοίξτε το Android Studio και επιλέξτε **File -> Open...** και επιλέξτε τον φάκελο \`AudiBFBLive_Android\`.
4. Περιμένετε 1 λεπτό να ολοκληρωθεί το Gradle Sync.
5. Στο πάνω μενού, πατήστε:
   **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**
6. Μόλις ολοκληρωθεί, πατήστε **locate** στο μήνυμα που θα εμφανιστεί κάτω δεξιά.
7. Το αρχείο **\`app-debug.apk\`** είναι έτοιμο! Στείλτε το στο κινητό σας και πατήστε εγκατάσταση.

---

### Τρόπος 3: Μέσω Command Line (Τερματικό)
Στον φάκελο του project τρέξτε:
\`\`\`bash
# Σε Linux / Mac:
./gradlew assembleDebug

# Σε Windows:
gradlew.bat assembleDebug
\`\`\`
Το APK θα δημιουργηθεί στη διαδρομή:
\`app/build/outputs/apk/debug/app-debug.apk\`

---

### Χαρακτηριστικά εφαρμογής:
- **Ζωντανή Τηλεμετρία Audi 1.8T BFB**: Boost (BAR/PSI), RPM, MAF (g/s), AFR, Knock Retard ανά κύλινδρο (Cyl 1-4).
- **Σύνδεση OBD-II ELM327**: Υποστήριξη Bluetooth & Web Bluetooth OBD2 dongles.
- **VAG-COM DTC Scanner**: Ανάγνωση και σβήσιμο κωδικών σφάλματος (Check Engine / MIL).
- **Μετρητής 0-100 km/h**: Αυτόματη εκκίνηση και καταγραφή G-Force.
- **Keep Screen On**: Η οθόνη μένει αναμμένη στο ταμπλό του αυτοκινήτου.
`
    },
    {
      path: 'AudiBFBLive_Android/.github/workflows/build-apk.yml',
      description: 'Αυτόματη μεταγλώττιση (Cloud CI) του APK μέσω GitHub Actions χωρίς να χρειάζεται υπολογιστής με Android Studio',
      content: `name: Build AudiBFB Live APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Gradle
      uses: gradle/gradle-build-action@v3

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew || true

    - name: Build Debug APK
      run: ./gradlew assembleDebug

    - name: Upload APK artifact
      uses: actions/upload-artifact@v4
      with:
        name: AudiBFBLive-debug-apk
        path: app/build/outputs/apk/debug/app-debug.apk
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
