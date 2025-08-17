import Foundation
import HealthKit
import WatchConnectivity
import Combine
import os.log

final class WatchHealthController: NSObject, ObservableObject, WCSessionDelegate, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
    @Published var bpm: Double? = nil
    @Published var status: String = "Idle"

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private let logger = Logger(subsystem: "com.tapfit.watchapp", category: "WatchHealth")

    override init() {
        super.init()
        Task {
            await setupWatchConnectivity()
            await requestAuthorizationIfNeeded()
        }
    }
    
    @MainActor
    private func setupWatchConnectivity() async {
        guard WCSession.isSupported() else {
            logger.info("WatchConnectivity not supported")
            return
        }
        
        let s = WCSession.default
        s.delegate = self
        s.activate()
        logger.info("WatchConnectivity session activated")
    }

    var displayBPM: String { bpm != nil ? String(Int(round(bpm!))) + " bpm" : "--" }

    // MARK: - Auth
    @MainActor
    private func requestAuthorizationIfNeeded() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            status = "HealthKit not available"
            return
        }
        
        let toRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .oxygenSaturation)!,
            HKObjectType.quantityType(forIdentifier: .bodyTemperature)!,
            HKObjectType.workoutType()
        ]
        let toShare: Set<HKSampleType> = [HKObjectType.workoutType()]
        
        do {
            let success = try await healthStore.requestAuthorization(toShare: toShare, read: toRead)
            status = success ? "Authorized" : "Authorization failed"
            logger.info("HealthKit authorization result: \(success)")
        } catch {
            status = "Error: \(error.localizedDescription)"
            logger.error("HealthKit authorization error: \(error.localizedDescription)")
        }
    }

    // MARK: - Commands from iPhone
    @MainActor
    private func handleCommand(_ cmd: String, activity: String?) {
        logger.info("Handling command: \(cmd), activity: \(activity ?? "nil")")
        
        switch cmd {
        case "startWorkout": 
            Task { await startWorkout(activityType: activity) }
        case "stopWorkout": 
            stopWorkout()
        default: 
            logger.warning("Unknown command: \(cmd)")
        }
    }

    // MARK: - Workout
    @MainActor
    private func startWorkout(activityType: String?) async {
        guard session == nil else { 
            logger.info("Workout already in progress")
            return 
        }
        
        status = "Starting…"
        logger.info("Starting workout with activity type: \(activityType ?? "default")")

        let config = HKWorkoutConfiguration()
        config.activityType = activityType(from: activityType)
        config.locationType = .indoor
        
        do {
            let s = try HKWorkoutSession(healthStore: healthStore, configuration: config)
            let b = s.associatedWorkoutBuilder()
            b.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)
            s.delegate = self
            b.delegate = self
            session = s
            builder = b
            
            s.startActivity(with: Date())
            
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                b.beginCollection(withStart: Date()) { success, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                    } else {
                        continuation.resume()
                    }
                }
            }
            
            status = "Running"
            logger.info("Workout started successfully")
        } catch {
            status = "Error: \(error.localizedDescription)"
            logger.error("Failed to start workout: \(error.localizedDescription)")
        }
    }

    @MainActor
    func stopWorkout() {
        logger.info("Stopping workout")
        
        session?.end()
        
        let endDate = Date()
        builder?.endCollection(withEnd: endDate) { [weak self] _, _ in
            self?.builder?.finishWorkout { [weak self] _, error in
                if let error = error {
                    self?.logger.error("Failed to finish workout: \(error.localizedDescription)")
                } else {
                    self?.logger.info("Workout finished successfully")
                }
            }
        }
        
        session = nil
        builder = nil
        status = "Stopped"
        logger.info("Workout stopped")
    }

    private func activityType(from raw: String?) -> HKWorkoutActivityType {
        switch raw ?? "functionalStrengthTraining" {
        case "running": return .running
        case "cycling": return .cycling
        case "walking": return .walking
        default: return .functionalStrengthTraining
        }
    }

    // MARK: - HKLiveWorkoutBuilderDelegate
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf types: Set<HKSampleType>) {
        guard let hrType = HKObjectType.quantityType(forIdentifier: .heartRate), 
              types.contains(hrType) else { return }
              
        if let stats = workoutBuilder.statistics(for: hrType), 
           let quantity = stats.mostRecentQuantity() {
            let unit = HKUnit.count().unitDivided(by: HKUnit.minute())
            let value = quantity.doubleValue(for: unit)
            
            DispatchQueue.main.async {
                self.bpm = value
                self.logger.info("Heart rate collected: \(value) bpm")
            }
            
            // Send to iPhone with improved error handling
            let message = ["hr": value, "timestamp": Date().timeIntervalSince1970]
            
            if WCSession.default.isReachable {
                WCSession.default.sendMessage(message, replyHandler: { reply in
                    self.logger.info("Heart rate sent successfully, reply: \(reply)")
                }, errorHandler: { error in
                    self.logger.error("Failed to send heart rate: \(error.localizedDescription)")
                    // Fallback to background transfer
                    _ = WCSession.default.transferCurrentComplicationUserInfo(message)
                })
            } else {
                logger.info("iPhone not reachable, using background transfer")
                _ = WCSession.default.transferCurrentComplicationUserInfo(message)
            }
        }
    }

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    // MARK: - HKWorkoutSessionDelegate
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        logger.info("Workout session state changed from \(fromState.rawValue) to \(toState.rawValue)")
        
        DispatchQueue.main.async {
            switch toState {
            case .running:
                self.status = "Running"
            case .ended:
                self.status = "Ended"
            case .paused:
                self.status = "Paused"
            case .prepared:
                self.status = "Prepared"
            case .stopped:
                self.status = "Stopped"
            @unknown default:
                self.status = "Unknown"
            }
        }
    }
    
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        logger.error("Workout session failed: \(error.localizedDescription)")
        DispatchQueue.main.async { 
            self.status = "Error: \(error.localizedDescription)" 
        }
    }

    // MARK: - WCSessionDelegate
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            logger.error("WC session activation failed: \(error.localizedDescription)")
        } else {
            logger.info("WC session activated with state: \(activationState.rawValue)")
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        logger.info("Received message from iPhone: \(message)")
        
        let cmd = message["cmd"] as? String
        let activity = message["activityType"] as? String
        
        DispatchQueue.main.async {
            self.handleCommand(cmd ?? "", activity: activity)
        }
    }
}
