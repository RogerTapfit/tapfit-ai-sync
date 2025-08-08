import SwiftUI

struct ContentView: View {
    @EnvironmentObject var controller: WatchHealthController
    var body: some View {
        VStack(spacing: 8) {
            Text("TapFit")
                .font(.headline)
            Text(controller.displayBPM)
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.red)
            Text(controller.status)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}
