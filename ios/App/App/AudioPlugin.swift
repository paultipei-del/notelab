import AVFoundation
import Capacitor

@objc(AudioPlugin)
public class AudioPlugin: CAPPlugin {
    private var audioEngine: AVAudioEngine?
    private var isRunning = false

    @objc func start(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true)
        } catch {
            call.reject("Audio session failed: \(error)")
            return
        }

        let engine = AVAudioEngine()
        let input = engine.inputNode
        let format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!

        input.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, _ in
            guard let channelData = buffer.floatChannelData?[0] else { return }
            let frameLength = Int(buffer.frameLength)
            let samples = Array(UnsafeBufferPointer(start: channelData, count: frameLength))
            self.notifyListeners("audioBuffer", data: ["samples": samples])
        }

        do {
            try engine.start()
            self.audioEngine = engine
            self.isRunning = true
            call.resolve()
        } catch {
            call.reject("Engine failed: \(error)")
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        isRunning = false
        try? AVAudioSession.sharedInstance().setActive(false)
        call.resolve()
    }
}
