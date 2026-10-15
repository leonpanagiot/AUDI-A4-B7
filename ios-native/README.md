# AUDI Live iOS native OBD bridge

Run on macOS (or macOS GitHub Actions runner) after npm install:

1. npm run build
2. npx cap add ios (once only)
3. Copy IosObdPlugin.swift and AudiBridgeViewController.swift into ios/App/App/
4. Add both Swift files to the App target in Xcode (not merely on disk).
5. Change Main.storyboard's CAPBridgeViewController custom class to AudiBridgeViewController and module to App.
6. Add NSLocalNetworkUsageDescription to ios/App/App/Info.plist: "Η εφαρμογή συνδέεται στο WiFi OBD2 του αυτοκινήτου για ανάγνωση δεδομένων ECU."
7. npx cap sync ios; build and sign with Xcode on macOS.

iPhone must join the Vgate WiFi network; TCP endpoint defaults to 192.168.0.10:35000.
The iOS bridge supports WiFi TCP, NOT Bluetooth Classic SPP. Keep ATSP4/ATSPA4 logic unchanged.
A real-device test is required before TestFlight release. Never claim ECU connectivity without testing.
