import Capacitor

@objc(AudiBridgeViewController)
public class AudiBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(IosObdPlugin())
    }
}
