import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { PanelState } from '../components/PanelState'

/**
 * Rule 21, enforced at the boundary between the two modes.
 *
 * A monitoring console that white-screens is worse than one that shows a degraded
 * panel: the operator loses the alarms *and* loses the ability to tell that they lost
 * them. Wrapping each mode means one broken render is contained to that mode.
 *
 * Still a class component in React 19 — there is no hook equivalent of
 * `componentDidCatch`, so this is one of the few places a class is the correct tool
 * rather than a legacy one.
 */

interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly title: string
  readonly detail: string
}

interface ErrorBoundaryState {
  readonly message: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { message: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: error instanceof Error ? error.message : 'Unknown rendering error' }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    /* Deliberate: this is a real fault the developer needs, and it is the only console
       output the app produces. It is not diagnostic noise. */
    console.error('[BlackTeal] render failed', error, info.componentStack)
  }

  override render(): ReactNode {
    const { message } = this.state
    const { children, title, detail } = this.props

    if (message === null) return children

    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <PanelState kind="error" title={title} detail={`${detail} (${message})`} />
      </div>
    )
  }
}
