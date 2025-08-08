import Foundation
import HealthKit
import WatchConnectivity
import Combine

final class WatchHealthController: NSObject, ObservableObject, WCSessionDelegate, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
    @Published var bpm: Double? = nil
    @Published var status: String = "Idle"

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    override init() {
        super.init()
        if WCSession.isSupported() {
            let s = WCSession.default
            s.delegate = self
            s.activate()
        }
        requestAuthorizationIfNeeded()
    }

    var displayBPM: String { bpm != nil ? String(Int(round(bpm!))) + " bpm" : "--" }

    // MARK: - Auth
    func requestAuthorizationIfNeeded() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let toRead: Set = [HKObjectType.quantityType(forIdentifier: .heartRate)!, HKObjectType.workoutType()]
        let toShare: Set = [HKObjectType.workoutType()]
        healthStore.requestAuthorization(toShare: toShare, read: toRead) { [weak self] ok, err in
            DispatchQueue.main.async { self?.status = ok ? "Authorized" : (err?.localizedDescription ?? "Not authorized") }
        }
    }

    // MARK: - Commands from iPhone
    private func handleCommand(_ cmd: String, activity: String?) {
        switch cmd {
        case "startWorkout": startWorkout(activityType: activity)
        case "stopWorkout": stopWorkout()
        default: break
        }
    }

    // MARK: - Workout
    func startWorkout(activityType: String?) {
        guard session == nil else { return }
        DispatchQueue.main.async { self.status = "Starting…" }

        let config = HKWorkoutConfiguration()
        config.activityType = self.activityType(from: activityType)
        config.locationType = .indoor
        do {
            let s = try HKWorkoutSession(healthStore: healthStore, configuration: config)
            let b = s.associatedWorkoutBuilder()
            b.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)
            s.delegate = self
            b.delegate = self
            self.session = s
            self.builder = b
            s.startActivity(with: Date())
            b.beginCollection(withStart: Date()) { (success, error) in }
            DispatchQueue.main.async { self.status = "Running" }
        } catch {
            DispatchQueue.main.async { self.status = "Error: \(error.localizedDescription)" }
        }
    }

    func stopWorkout() {
        session?.end()
        builder?.endCollection(withEnd: Date()) { _, _ in
            self.builder?.finishWorkout(completion: { _, _ in })
        }
        session = nil
        builder = nil
        DispatchQueue.main.async { self.status = "Stopped" }
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
        guard let hrType = HKObjectType.quantityType(forIdentifier: .heartRate), types.contains(hrType) else { return }
        if let stats = workoutBuilder.statistics(for: hrType), let quantity = stats.mostRecentQuantity() {
            let unit = HKUnit.count().unitDivided(by: HKUnit.minute())
            let value = quantity.doubleValue(for: unit)
            DispatchQueue.main.async { self.bpm = value }
            // Send to iPhone live
            if WCSession.default.isReachable {
                WCSession.default.sendMessage(["hr": value], replyHandler: nil, errorHandler: nil)
            } else {
                _ = WCSession.default.transferCurrentComplicationUserInfo(["hr": value])
            }
        }
    }

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    // MARK: - HKWorkoutSessionDelegate
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {}
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        DispatchQueue.main.async { self.status = "Error: \(error.localizedDescription)" }
    }

    // MARK: - WCSessionDelegate
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        let cmd = message["cmd"] as? String
        let activity = message["activityType"] as? String
        handleCommand(cmd ?? "", activity: activity)
    }
}
