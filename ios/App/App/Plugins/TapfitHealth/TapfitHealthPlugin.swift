import Foundation
import Capacitor
import HealthKit
import WatchConnectivity
import os.log

@objc(TapfitHealthPlugin)
public class TapfitHealthPlugin: CAPPlugin, WCSessionDelegate {
    private let healthStore = HKHealthStore()
    private var lastBPM: Double? = nil
    private var wcSession: WCSession? = nil
    private let logger = Logger(subsystem: "com.tapfit.app", category: "TapfitHealth")
    
    // MARK: - Lifecycle
    public override func load() {
        super.load()
        Task {
            await setupWatchConnectivity()
        }
    }
    
    @MainActor
    private func setupWatchConnectivity() async {
        guard WCSession.isSupported() else {
            logger.info("WatchConnectivity not supported on this device")
            return
        }
        
        let session = WCSession.default
        session.delegate = self
        session.activate()
        self.wcSession = session
        logger.info("WatchConnectivity session activated")
    }

    // MARK: - Plugin API
    @objc func isAvailable(_ call: CAPPluginCall) {
        Task {
            await checkWatchAvailability(call)
        }
    }
    
    @MainActor
    private func checkWatchAvailability(_ call: CAPPluginCall) async {
        guard WCSession.isSupported() else {
            call.resolve(["watchPaired": false])
            return
        }
        
        let session = WCSession.default
        let paired = session.isPaired
        let installed = session.isWatchAppInstalled
        let available = paired && installed
        
        logger.info("Watch availability check - Paired: \(paired), Installed: \(installed)")
        call.resolve(["watchPaired": available])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        Task {
            await requestHealthAuthorization(call)
        }
    }
    
    private func requestHealthAuthorization(_ call: CAPPluginCall) async {
        guard HKHealthStore.isHealthDataAvailable() else {
            logger.error("HealthKit not available on this device")
            call.reject("Health data not available on this device")
            return
        }
        
        let toRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .oxygenSaturation)!,
            HKObjectType.quantityType(forIdentifier: .bodyTemperature)!,
            HKObjectType.quantityType(forIdentifier: .respiratoryRate)!,
            HKObjectType.workoutType(),
            HKObjectType.activitySummaryType()
        ]
        
        let toShare: Set<HKSampleType> = [
            HKObjectType.workoutType()
        ]
        
        do {
            let success = try await healthStore.requestAuthorization(toShare: toShare, read: toRead)
            logger.info("HealthKit authorization completed: \(success)")
            call.resolve(["authorized": success])
        } catch {
            logger.error("HealthKit authorization failed: \(error.localizedDescription)")
            call.reject(error.localizedDescription)
        }
    }

    @objc func startWorkout(_ call: CAPPluginCall) {
        let activityType = call.getString("activityType") ?? "functionalStrengthTraining"
        
        Task {
            await sendCommandToWatch(["cmd": "startWorkout", "activityType": activityType], call: call, successKey: "started")
        }
    }

    @objc func stopWorkout(_ call: CAPPluginCall) {
        Task {
            await sendCommandToWatch(["cmd": "stopWorkout"], call: call, successKey: "stopped")
        }
    }

    @objc func latestHeartRate(_ call: CAPPluginCall) {
        logger.info("Returning latest heart rate: \(lastBPM?.description ?? "nil")")
        call.resolve(["bpm": lastBPM as Any])
    }

    // MARK: - WCSession helpers
    @MainActor
    private func sendCommandToWatch(_ message: [String: Any], call: CAPPluginCall, successKey: String) async {
        guard let session = wcSession else {
            logger.error("WCSession not available")
            call.reject("WCSession not available")
            return
        }
        
        guard session.isPaired else {
            logger.error("No paired Apple Watch")
            call.reject("No paired Apple Watch")
            return
        }
        
        guard session.isWatchAppInstalled else {
            logger.error("Watch app not installed")
            call.reject("Watch app not installed")
            return
        }
        
        do {
            if session.isReachable {
                logger.info("Sending message to watch: \(message)")
                try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                    session.sendMessage(message, replyHandler: { _ in
                        continuation.resume()
                    }, errorHandler: { error in
                        continuation.resume(throwing: error)
                    })
                }
                call.resolve([successKey: true])
            } else {
                // Fallback: queue a background transfer
                logger.info("Watch not reachable, using background transfer")
                let transfer = session.transferCurrentComplicationUserInfo(message)
                logger.info("Background transfer initiated: \(transfer)")
                call.resolve([successKey: true])
            }
        } catch {
            logger.error("Failed to send command to watch: \(error.localizedDescription)")
            call.reject(error.localizedDescription)
        }
    }

    // MARK: - WCSessionDelegate
    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            logger.error("WatchConnectivity activation failed: \(error.localizedDescription)")
        } else {
            logger.info("WatchConnectivity activated with state: \(activationState.rawValue)")
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {
        logger.info("WatchConnectivity session became inactive")
    }
    
    public func sessionDidDeactivate(_ session: WCSession) {
        logger.info("WatchConnectivity session deactivated, reactivating...")
        session.activate()
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        logger.info("Received message from watch: \(message)")
        
        if let hr = message["hr"] as? Double {
            lastBPM = hr
            let timestamp = Date().timeIntervalSince1970 * 1000
            
            DispatchQueue.main.async {
                self.notifyListeners("heartRate", data: [
                    "bpm": hr, 
                    "timestamp": timestamp
                ])
            }
            
            logger.info("Heart rate updated: \(hr) bpm")
        }
    }
    
    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        logger.info("Received application context from watch: \(applicationContext)")
    }
    
    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        logger.info("Received user info from watch: \(userInfo)")
        
        // Handle background data transfers
        if let hr = userInfo["hr"] as? Double {
            lastBPM = hr
            let timestamp = Date().timeIntervalSince1970 * 1000
            
            DispatchQueue.main.async {
                self.notifyListeners("heartRate", data: [
                    "bpm": hr, 
                    "timestamp": timestamp
                ])
            }
        }
    }
}
