'use client'

/**
 * Harmony page toolbar — MIDI device picker, key selector, "Enable MIDI"
 * gate, and the unsupported-browser warning.
 *
 * Key list is the 12-fifths circle for major + the same 12 for minor so
 * commonly-adjacent keys are visually adjacent in the dropdown.
 */

import type { MidiDevice, MidiPermissionState } from '@/lib/useMidiInput'

const F = 'var(--font-jost), sans-serif'

const MAJOR_KEYS_CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const MINOR_KEYS_CIRCLE = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D']
const KEYS: string[] = [
  ...MAJOR_KEYS_CIRCLE.map(k => `${k} major`),
  ...MINOR_KEYS_CIRCLE.map(k => `${k} minor`),
]

type Props = {
  devices: MidiDevice[]
  activeDeviceId: string | null
  onDeviceChange: (id: string | null) => void
  currentKey: string
  onKeyChange: (key: string) => void
  isSupported: boolean
  permissionState: MidiPermissionState
  onRequestAccess: () => void
}

const SELECT_STYLE: React.CSSProperties = {
  fontFamily: F, fontSize: 13, color: '#2A2318',
  background: 'var(--cream-key)',
  border: '1px solid var(--brown-faint)',
  borderRadius: 8,
  padding: '8px 12px',
  cursor: 'pointer',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: F, fontSize: 11, fontWeight: 500,
  letterSpacing: '1.5px', textTransform: 'uppercase' as const,
  color: 'var(--brown-muted)',
  marginRight: 8,
}

export function DeviceControls({
  devices, activeDeviceId, onDeviceChange,
  currentKey, onKeyChange,
  isSupported, permissionState, onRequestAccess,
}: Props) {
  const noDevices = devices.length === 0
  const showEnableButton = isSupported && permissionState !== 'granted'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!isSupported && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--oxblood-tint)',
          border: '1px solid rgba(160, 56, 28, 0.32)',
          borderRadius: 10,
          fontFamily: F, fontSize: 13,
          color: 'var(--oxblood)',
          lineHeight: 1.5,
        }}>
          Web MIDI isn't supported in this browser. Try Chrome, Edge, or Opera.
          You can still use the QWERTY keyboard below.
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
        padding: '14px 18px',
        background: 'var(--cream-card-strong)',
        border: '1px solid var(--brown-faint)',
        borderRadius: 14,
      }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <span style={LABEL_STYLE}>MIDI device</span>
          <select
            value={activeDeviceId ?? ''}
            onChange={e => onDeviceChange(e.target.value === '' ? null : e.target.value)}
            disabled={noDevices}
            style={{
              ...SELECT_STYLE,
              color: noDevices ? '#B0ACA4' : '#2A2318',
              cursor: noDevices ? 'default' : 'pointer',
            }}
          >
            {noDevices ? (
              <option value="">Connect a controller</option>
            ) : (
              <>
                <option value="">All devices</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </>
            )}
          </select>
        </label>

        <span aria-hidden="true" style={{ color: 'var(--brown-faint)' }}>·</span>

        <label style={{ display: 'flex', alignItems: 'center' }}>
          <span style={LABEL_STYLE}>Key</span>
          <select
            value={currentKey}
            onChange={e => onKeyChange(e.target.value)}
            style={SELECT_STYLE}
          >
            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>

        {showEnableButton && (
          <button
            onClick={onRequestAccess}
            style={{
              marginLeft: 'auto',
              fontFamily: F, fontSize: 13,
              background: 'var(--oxblood)',
              color: 'var(--cream-key)',
              border: '1px solid var(--oxblood)',
              borderRadius: 10,
              padding: '8px 18px',
              cursor: 'pointer',
            }}
          >
            Enable MIDI →
          </button>
        )}
      </div>
    </div>
  )
}

export default DeviceControls
