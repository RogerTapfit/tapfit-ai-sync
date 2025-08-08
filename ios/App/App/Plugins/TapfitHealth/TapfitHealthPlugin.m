#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(TapfitHealthPlugin, "TapfitHealth",
  CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(startWorkout, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(stopWorkout, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(latestHeartRate, CAPPluginReturnPromise);
)
