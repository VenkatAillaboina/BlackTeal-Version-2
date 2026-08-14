import { useState } from 'react'
import { Flame, PlugZap, RotateCcw, Siren, WifiOff } from 'lucide-react'
import type { SimulatorControls, SiteCommand } from '../../simulation/telemetrySimulator'
import { DEMO_OFFLINE_SKID } from '../../simulation/telemetrySimulator'
import { GlassCard } from '../../components/GlassCard'
import { cn } from '../../utils/cn'

/**
 * Makes every edge case reachable on purpose.
 *
 * Rule 14 asks the console to handle stale, disconnected and offline states. A panel
 * that can only be seen by waiting for a real failure is a panel nobody ever checks —
 * so the failures are made available as buttons, which is also how the console gets
 * tested honestly rather than by reasoning about code paths.
 *
 * Local state mirrors what has been commanded, since the simulator is imperative and
 * does not notify React when its scenario changes.
 */

interface DemoControlsProps {
  readonly controls: SimulatorControls | null
}

const COMMANDS: readonly { value: SiteCommand; label: string }[] = [
  { value: 'discharge', label: 'Discharge' },
  { value: 'charge', label: 'Charge' },
  { value: 'idle', label: 'Idle' },
]

export function DemoControls({ controls }: DemoControlsProps) {
  const [command, setCommand] = useState<SiteCommand>('discharge')
  const [isFeedDropped, setIsFeedDropped] = useState(false)
  const [isSkidOffline, setIsSkidOffline] = useState(false)
  const [isOverheating, setIsOverheating] = useState(false)

  const isReady = controls !== null

  return (
    <GlassCard title="Scenario controls">
      <fieldset disabled={!isReady} className="space-y-4 disabled:opacity-50">
        <legend className="sr-only">Simulated site scenarios</legend>

        <div>
          <p className="eyebrow mb-2">Dispatch command</p>
          <div className="inline-flex rounded-full border border-ink-700 bg-ink-900 p-0.5">
            {COMMANDS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={command === option.value}
                className={cn(
                  'rounded-full px-3 py-1 font-mono text-eyebrow uppercase transition-colors duration-quick ease-apple',
                  command === option.value
                    ? 'bg-teal-core text-ink-void'
                    : 'text-ink-300 hover:text-ink-100',
                )}
                onClick={() => {
                  setCommand(option.value)
                  controls?.setCommand(option.value)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ScenarioButton
            icon={WifiOff}
            label={isFeedDropped ? 'Restore telemetry feed' : 'Drop telemetry feed'}
            detail="Stops all frames. The console must notice the silence itself."
            isActive={isFeedDropped}
            onClick={() => {
              if (isFeedDropped) controls?.restoreFeed()
              else controls?.dropFeed()
              setIsFeedDropped((dropped) => !dropped)
            }}
          />

          <ScenarioButton
            icon={PlugZap}
            label={isSkidOffline ? 'Reconnect skid 5' : 'Take skid 5 offline'}
            detail="One asset goes dark while the rest of the site keeps reporting."
            isActive={isSkidOffline}
            onClick={() => {
              controls?.toggleSkidComms(DEMO_OFFLINE_SKID)
              setIsSkidOffline((offline) => !offline)
            }}
          />

          <ScenarioButton
            icon={Flame}
            label={isOverheating ? 'Restore skid 2 cooling' : 'Fail skid 2 cooling'}
            detail="The pack heats, derates, then trips. Watch the headroom bar fall."
            isActive={isOverheating}
            onClick={() => {
              controls?.toggleHeatEvent()
              setIsOverheating((hot) => !hot)
            }}
          />

          <ScenarioButton
            icon={Siren}
            label="Fire alarm burst"
            detail="Fails cooling on every skid at once, to test alarm grouping."
            isActive={false}
            onClick={() => {
              controls?.fireAlarmBurst()
              setIsOverheating(true)
            }}
          />
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-1.5 font-mono text-eyebrow uppercase text-ink-200 transition-colors duration-quick ease-apple hover:border-teal-core hover:text-teal-live"
          onClick={() => {
            controls?.clearAllFaults()
            setIsFeedDropped(false)
            setIsSkidOffline(false)
            setIsOverheating(false)
          }}
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          Reset site to normal
        </button>
      </fieldset>
    </GlassCard>
  )
}

interface ScenarioButtonProps {
  readonly icon: typeof Flame
  readonly label: string
  readonly detail: string
  readonly isActive: boolean
  readonly onClick: () => void
}

function ScenarioButton({ icon: Icon, label, detail, isActive, onClick }: ScenarioButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'rounded-panel border px-3 py-2.5 text-left transition-colors duration-quick ease-apple',
        isActive
          ? 'border-status-warning/40 bg-status-warning/10'
          : 'border-ink-800 bg-ink-900/60 hover:border-ink-600',
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-status-warning' : 'text-ink-300')} aria-hidden />
        <span className={cn('text-caption font-medium', isActive ? 'text-status-warning' : 'text-ink-100')}>
          {label}
        </span>
      </span>
      <span className="mt-1 block text-caption text-ink-400">{detail}</span>
    </button>
  )
}
