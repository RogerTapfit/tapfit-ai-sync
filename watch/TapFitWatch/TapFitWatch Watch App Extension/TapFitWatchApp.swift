import SwiftUI

@main
struct TapFitWatchApp: App {
    @StateObject private var controller = WatchHealthController()
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(controller)
        }
    }
}
