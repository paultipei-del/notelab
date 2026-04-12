#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AudioPlugin, "AudioPlugin",
    CAP_PLUGIN_METHOD(start, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
)
