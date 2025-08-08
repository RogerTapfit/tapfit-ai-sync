import Foundation
import Capacitor
import HealthKit
import WatchConnectivity

@objc(TapfitHealthPlugin)
public class TapfitHealthPlugin: CAPPlugin, WCSessionDelegate {
    private let healthStore = HKHealthStore()
    private var lastBPM: Double? = nil
    private var wcSession: WCSession? = nil

    // MARK: - Lifecycle
    public override func load() {
        super.load()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
            self.wcSession = session
        }
    }

    // MARK: - Plugin API
    @objc func isAvailable(_ call: CAPPluginCall) {
        let paired = WCSession.isSupported() ? WCSession.default.isPaired : false
        let installed = WCSession.isSupported() ? WCSession.default.isWatchAppInstalled : false
        call.resolve(["watchPaired": paired && installed])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Health data not available on this device")
            return
        }
        let toRead: Set = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.workoutType()
        ]
        let toShare: Set = [HKObjectType.workoutType()]
        healthStore.requestAuthorization(toShare: toShare, read: toRead) { success, error in
            if let error = error { call.reject(error.localizedDescription); return }
            call.resolve(["authorized": success])
        }
    }

    @objc func startWorkout(_ call: CAPPluginCall) {
        let activityType = call.getString("activityType") ?? "functionalStrengthTraining"
        sendToWatch(["cmd": "startWorkout", "activityType": activityType]) { [weak self] ok, err in
            guard let _ = self else { return }
            if let err = err { call.reject(err); return }
            call.resolve(["started": ok])
        }
    }

    @objc func stopWorkout(_ call: CAPPluginCall) {
        sendToWatch(["cmd": "stopWorkout"]) { ok, err in
            if let err = err { call.reject(err); return }
            call.resolve(["stopped": ok])
        }
    }

    @objc func latestHeartRate(_ call: CAPPluginCall) {
        call.resolve(["bpm": lastBPM as Any])
    }

    // MARK: - WCSession helpers
    private func sendToWatch(_ message: [String: Any], completion: @escaping (Bool, String?) -> Void) {
        guard let session = wcSession else { completion(false, "WCSession not available"); return }
        guard session.isPaired else { completion(false, "No paired Apple Watch"); return }
        guard session.isWatchAppInstalled else { completion(false, "Watch app not installed"); return }

        if session.isReachable {
            session.sendMessage(message, replyHandler: { _ in
                completion(true, nil)
            }, errorHandler: { error in
                completion(false, error.localizedDescription)
            })
        } else {
            // Fallback: queue a background transfer
            session.transferCurrentComplicationUserInfo(message)
            completion(true, nil)
        }
    }

    // MARK: - WCSessionDelegate
    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            NSLog("[TapfitHealth] WC activation error: \(error.localizedDescription)")
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {}
    public func sessionDidDeactivate(_ session: WCSession) { session.activate() }

    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if let hr = message["hr"] as? Double {
            lastBPM = hr
            self.notifyListeners("heartRate", data: ["bpm": hr, "timestamp": Date().timeIntervalSince1970 * 1000])
        }
    }
}
