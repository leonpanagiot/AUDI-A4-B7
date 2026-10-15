import Foundation
import Network
import Capacitor

@objc(IosObdPlugin)
public class IosObdPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IosObdPlugin"
    public let jsName = "IosObd"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "command", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise)
    ]

    private let queue = DispatchQueue(label: "gr.audilive.obd.tcp")
    private var connection: NWConnection?
    private var activeCall: CAPPluginCall?
    private var buffer = Data()
    private var timeout: DispatchWorkItem?

    @objc public func connect(_ call: CAPPluginCall) {
        guard let host = call.getString("host"), let port = call.getInt("port"),
              (1...65535).contains(port), let nwPort = NWEndpoint.Port(rawValue: UInt16(port)) else {
            call.reject("Invalid OBD host or port"); return
        }
        queue.async {
            self.closeSocket()
            let conn = NWConnection(host: NWEndpoint.Host(host), port: nwPort, using: .tcp)
            self.connection = conn
            var finished = false
            let deadline = DispatchWorkItem {
                if !finished {
                    finished = true
                    self.closeSocket()
                    call.reject("TCP connect timeout")
                }
            }
            self.queue.asyncAfter(deadline: .now() + 8, execute: deadline)
            conn.stateUpdateHandler = { state in
                self.queue.async {
                    guard !finished else { return }
                    switch state {
                    case .ready:
                        finished = true; deadline.cancel()
                        self.receive(conn)
                        call.resolve(["connected": true])
                    case .failed(let error):
                        finished = true; deadline.cancel()
                        self.closeSocket()
                        call.reject("TCP connection failed: \(error.localizedDescription)")
                    case .cancelled:
                        finished = true; deadline.cancel()
                        call.reject("TCP connection cancelled")
                    default: break
                    }
                }
            }
            conn.start(queue: self.queue)
        }
    }

    @objc public func command(_ call: CAPPluginCall) {
        guard let cmd = call.getString("command"), !cmd.isEmpty else {
            call.reject("Missing OBD command"); return
        }
        queue.async {
            guard let conn = self.connection, self.activeCall == nil else {
                call.reject("OBD socket disconnected or command busy"); return
            }
            self.activeCall = call
            self.buffer.removeAll()
            let deadline = DispatchWorkItem { [weak self] in
                guard let self = self, self.activeCall != nil else { return }
                self.activeCall?.reject("OBD response timeout")
                self.activeCall = nil
                self.buffer.removeAll()
                self.closeSocket()
            }
            self.timeout = deadline
            self.queue.asyncAfter(deadline: .now() + 10, execute: deadline)
            conn.send(content: Data((cmd + "\r").utf8), completion: .contentProcessed { error in
                if let error = error {
                    self.queue.async {
                        self.timeout?.cancel()
                        self.activeCall?.reject(error.localizedDescription)
                        self.activeCall = nil
                        self.closeSocket()
                    }
                }
            })
        }
    }

    private func receive(_ conn: NWConnection) {
        conn.receive(minimumIncompleteLength: 1, maximumLength: 4096) { data, _, complete, error in
            self.queue.async {
                guard self.connection === conn else { return }
                if let data = data { self.buffer.append(data) }
                if self.activeCall != nil, self.buffer.contains(62) {
                    self.timeout?.cancel()
                    let result = String(data: self.buffer, encoding: .utf8) ?? ""
                    self.buffer.removeAll()
                    self.activeCall?.resolve(["response": result])
                    self.activeCall = nil
                }
                if complete || error != nil {
                    self.activeCall?.reject(error?.localizedDescription ?? "TCP socket closed")
                    self.activeCall = nil
                    self.closeSocket()
                } else {
                    self.receive(conn)
                }
            }
        }
    }

    @objc public func disconnect(_ call: CAPPluginCall) {
        queue.async {
            self.closeSocket()
            call.resolve()
        }
    }

    private func closeSocket() {
        timeout?.cancel()
        timeout = nil
        activeCall?.reject("OBD disconnected")
        activeCall = nil
        connection?.stateUpdateHandler = nil
        connection?.cancel()
        connection = nil
        buffer.removeAll()
    }
}
