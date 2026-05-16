import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor wraps the live NoteLab web app in a native iOS shell.
 *
 * `server.url` is set to the production deployment, so the app is a
 * webview that loads notelab.studio. Pros: every web change ships
 * instantly without an iOS rebuild, all server features (Supabase auth,
 * Stripe, Resend, API routes) keep working. Cons: requires network on
 * first load. For a fully offline-capable build we'd need to refactor
 * the Next.js app to support `output: 'export'` (currently not viable
 * because of server actions, API routes, and dynamic auth callbacks).
 *
 * `webDir` still has to point somewhere because Capacitor uses it as
 * the fallback bundle if `server.url` is unreachable; we point it at
 * `public/` which contains the static logo + manifest. To replace this
 * with a real fallback bundle, run `next export` (after the refactor)
 * and point `webDir` at `out/`.
 */
const config: CapacitorConfig = {
  appId: 'studio.notelab.app',
  appName: 'NoteLab',
  webDir: 'public',
  server: {
    url: 'https://notelab.studio',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#dbd3be',
  },
}

export default config
