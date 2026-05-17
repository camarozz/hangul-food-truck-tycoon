/**
 * ErrorBoundary.tsx
 *
 * Three layered React error boundaries for K-Bite Tycoon.
 *
 * React error boundaries MUST be class components — hooks cannot catch
 * render-phase errors. Each boundary has a distinct recovery strategy:
 *
 *   GameBoundary    — outermost, wraps <GameProvider>
 *                     catastrophic crash → wipe localStorage + reload
 *
 *   ScreenBoundary  — per-screen, key={gameScreen} resets it on navigation
 *                     screen crash → show error, let player click back to menu
 *
 *   ServingBoundary — tightest, wraps <ServingStation> only
 *                     shift crash → exit serving cleanly, preserve progress
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

// ─── Shared terminal-style error display helpers ──────────────────────────────

const GLITCH_FRAMES = ['▓▒░', '░▒▓', '▓░▒', '▒▓░'];

interface TerminalErrorBoxProps {
  title: string;
  code: string;
  message: string;
  trace?: string;
  actions: Array<{ label: string; ko: string; onClick: () => void; primary?: boolean }>;
}

/** Pure function component — safe to use inside class render() */
function TerminalErrorBox({ title, code, message, trace, actions }: TerminalErrorBoxProps) {
  return (
    <div
      className="font-mono text-red-500 bg-black border-2 border-red-600 p-6 space-y-4 shadow-[0_0_40px_rgba(255,0,0,0.15)] max-w-xl w-full"
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="border-b border-red-600/40 pb-3 space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tighter animate-pulse">!</span>
          <span className="text-xs font-bold tracking-[0.25em] uppercase opacity-60">{code}</span>
        </div>
        <div className="text-lg font-black tracking-tight uppercase">{title}</div>
      </div>

      {/* Error message */}
      <div className="text-xs leading-relaxed opacity-80 whitespace-pre-wrap">{message}</div>

      {/* Stack trace (collapsed visually) */}
      {trace && (
        <details className="group">
          <summary className="text-[10px] opacity-40 cursor-pointer hover:opacity-70 tracking-widest uppercase">
            [ STACK TRACE ]
          </summary>
          <pre className="mt-2 text-[9px] opacity-30 whitespace-pre-wrap break-all leading-tight max-h-24 overflow-y-auto">
            {trace}
          </pre>
        </details>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        {actions.map(({ label, ko, onClick, primary }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 border font-bold text-xs tracking-widest uppercase transition-all ${primary
                ? 'border-red-500 bg-red-500/10 hover:bg-red-500 hover:text-black'
                : 'border-red-800 text-red-700 hover:border-red-500 hover:text-red-400'
              }`}
          >
            [ {label} ] <span className="opacity-60 font-normal text-[10px]">({ko})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 1. GameBoundary ──────────────────────────────────────────────────────────
// Outermost boundary. Catches provider-level crashes or errors that escape
// ScreenBoundary. Recovery wipes localStorage and does a hard reload.

interface GameBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GameBoundary extends Component<{ children: ReactNode }, GameBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<GameBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[GameBoundary] Caught critical error:', error, errorInfo);
    // Log to an external service here if you add Sentry/Datadog later
  }

  private handleWipeAndReload = () => {
    try {
      localStorage.removeItem('kbite_save_data');
    } catch {
      // If localStorage itself is broken, just reload
    }
    window.location.reload();
  };

  private handleReloadOnly = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono">
        {/* Glitch header */}
        <div className="mb-8 text-center space-y-2">
          <div className="text-red-600 text-4xl font-black tracking-tighter animate-pulse select-none">
            {GLITCH_FRAMES[Math.floor(Date.now() / 500) % GLITCH_FRAMES.length]}
            &nbsp;SYSTEM FAILURE&nbsp;
            {GLITCH_FRAMES[Math.floor(Date.now() / 500) % GLITCH_FRAMES.length]}
          </div>
          <div className="text-red-800 text-[10px] tracking-[0.3em] uppercase">
            K-Bite Tycoon — Critical Runtime Exception
          </div>
        </div>

        <TerminalErrorBox
          title="The game engine has crashed."
          code="CRITICAL / UNRECOVERABLE"
          message={[
            'An unhandled error reached the top-level boundary.',
            '',
            `ERROR: ${this.state.error?.message ?? 'Unknown error'}`,
            '',
            'Your save data is stored separately and should be safe.',
            'You can reload and continue, or wipe the save if the crash',
            'is caused by corrupted save data.',
          ].join('\n')}
          trace={this.state.errorInfo?.componentStack ?? undefined}
          actions={[
            { label: 'RELOAD', ko: '새로고침', onClick: this.handleReloadOnly, primary: true },
            { label: 'WIPE SAVE & RELOAD', ko: '저장 초기화', onClick: this.handleWipeAndReload },
          ]}
        />
      </div>
    );
  }
}

// ─── 2. ScreenBoundary ────────────────────────────────────────────────────────
// Wraps individual screens in AppShell. The parent passes `resetKey={gameScreen}`
// so the boundary automatically resets when the player navigates to a new screen.
// Recovery: show error in-frame → player clicks "Return to Menu" which changes
// gameScreen → key changes → boundary resets automatically.

interface ScreenBoundaryProps {
  children: ReactNode;
  /** Pass gameScreen here. Changing this key resets the boundary. */
  resetKey: string;
  /** Called when the player clicks "Return to Menu" */
  onReturnToMenu: () => void;
  /** Human-readable screen name for the error message */
  screenName?: string;
}

interface ScreenBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ScreenBoundary extends Component<ScreenBoundaryProps, ScreenBoundaryState> {
  constructor(props: ScreenBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ScreenBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[ScreenBoundary:${this.props.screenName ?? 'unknown'}] Error:`, error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const screen = this.props.screenName ?? 'Unknown Screen';

    return (
      <div className="w-full h-full flex items-center justify-center p-6 font-mono bg-black/90">
        <TerminalErrorBox
          title={`${screen} — Render Error`}
          code="SCREEN / RECOVERABLE"
          message={[
            `The [ ${screen.toUpperCase()} ] screen encountered an error and could not render.`,
            '',
            `ERROR: ${this.state.error?.message ?? 'Unknown error'}`,
            '',
            'Your progress has NOT been affected.',
            'Return to the main menu to continue your shift.',
          ].join('\n')}
          trace={this.state.errorInfo?.componentStack ?? undefined}
          actions={[
            {
              label: 'RETURN TO MENU',
              ko: '메인 메뉴',
              onClick: this.props.onReturnToMenu,
              primary: true,
            },
          ]}
        />
      </div>
    );
  }
}

// ─── 3. ServingBoundary ───────────────────────────────────────────────────────
// Tight boundary that wraps only <ServingStation>.
// ServingStation is the densest crash surface: null customer, missing location,
// bad recipe lookup, audio failures, and complex stateful animations.
//
// Recovery strategy: abort the shift cleanly, navigate to CALENDAR (same as a
// normal shift end) so the player doesn't lose their day progression.

interface ServingBoundaryProps {
  children: ReactNode;
  /** Called on recovery — navigate away from SERVING */
  onAbortShift: () => void;
}

interface ServingBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ServingBoundary extends Component<ServingBoundaryProps, ServingBoundaryState> {
  constructor(props: ServingBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ServingBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ServingBoundary] Shift crashed:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 font-mono bg-black/95 border-2 border-red-600/40">
        {/* Broken truck ASCII */}
        <pre className="text-red-600/40 text-[10px] leading-tight mb-6 select-none">
          {[
            '   ______[=!!!!!=]______',
            '  |  K - B I T E  X_X   |',
            '  |   /[XXXXXXXXX]\\   |___',
            '  |    |         |    |   \\',
            '  |____[ERROR!!!]____|___o|\\_',
            '   (%%)                 (%%) ',
          ].join('\n')}
        </pre>

        <TerminalErrorBox
          title="Shift Terminated — Engine Fault"
          code="SERVING / SHIFT ABORTED"
          message={[
            'The serving engine encountered an unexpected error.',
            'The current shift has been aborted to protect your save data.',
            '',
            `FAULT: ${this.state.error?.message ?? 'Unknown error'}`,
            '',
            'Tip: This can happen if a customer spawns with a missing recipe,',
            'or if the location data is unavailable. Try a different district.',
          ].join('\n')}
          trace={this.state.errorInfo?.componentStack ?? undefined}
          actions={[
            {
              label: 'ABORT SHIFT',
              ko: '영업 중단',
              onClick: this.props.onAbortShift,
              primary: true,
            },
          ]}
        />
      </div>
    );
  }
}
