import { registerPlugin, WebPlugin } from '@capacitor/core'

export interface AudioPlugin {
  start(): Promise<void>
  stop(): Promise<void>
  addListener(
    event: 'audioBuffer',
    handler: (data: { samples: number[] }) => void
  ): Promise<{ remove: () => void }>
}

// Web fallback — uses existing getUserMedia path
class AudioPluginWeb extends WebPlugin implements AudioPlugin {
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
}

export const NativeAudio = registerPlugin<AudioPlugin>('AudioPlugin', {
  web: () => new AudioPluginWeb(),
})
