import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Car } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in AudiBFB Live:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-500 mb-4 shadow-xl shadow-red-900/30">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-3.5 h-4 bg-red-600 rounded-sm skew-x-[-12deg]" />
            <h1 className="text-xl font-black tracking-widest text-white uppercase font-mono">
              AudiBFB <span className="text-red-500">Live</span>
            </h1>
          </div>

          <h2 className="text-base font-bold text-slate-200 mb-2">
            Σφάλμα Φόρτωσης Πίνακα Οργάνων
          </h2>

          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Παρουσιάστηκε πρόβλημα κατά την αρχικοποίηση της τηλεμετρίας. Πατήστε επαναφόρτωση για άμεση επανεκκίνηση.
          </p>

          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-left max-w-lg w-full mb-6 text-[11px] font-mono text-red-300 break-all overflow-x-auto">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Επαναφορτωση Εφαρμογης
            </button>

            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition cursor-pointer"
            >
              <Car className="w-4 h-4" />
              Επαναφορα Προεπιλογων
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
