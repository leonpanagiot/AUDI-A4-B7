import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Apple, AlertCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  className?: string;
  variant?: 'compact' | 'full';
  onNavigateToApkTab?: () => void;
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'compact', onNavigateToApkTab }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>Εγκατεστημένο στο κινητό (Native App)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else if (isIOS) {
      setShowGuideModal(true);
    } else {
      // Browser didn't trigger prompt yet or desktop browser; open helper modal
      setShowGuideModal(true);
    }
  };

  if (variant === 'full') {
    return (
      <>
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900/90 to-red-950/40 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-red-950/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                  Εγκατασταση Εφαρμογης στο Android / Κινητο
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">APK / PWA</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Λειτουργεί ως πλήρης native εφαρμογή στο κινητό σας, χωρίς να χρειάζεται Google Play Store.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-red-600/30 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>{isInstallable ? 'Εγκατάσταση Τώρα (1-Click)' : 'Οδηγός Εγκατάστασης APK'}</span>
            </button>
            {onNavigateToApkTab && (
              <button
                onClick={onNavigateToApkTab}
                className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                title="Προβολή αρχείων Android Project & APK"
              >
                Κώδικας Android
              </button>
            )}
          </div>
        </div>

        {/* Modal Guide */}
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0f1422] border border-slate-700 p-6 shadow-2xl relative text-left">
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Πώς να εγκαταστήσετε το AudiBFB Live</h3>
                  <p className="text-xs text-slate-400">Απευθείας στην αρχική οθόνη του κινητού σας</p>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                      <Apple className="w-4 h-4 text-slate-200" /> Σε iPhone / Safari:
                    </span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 ml-1">
                      <li>Πατήστε το κουμπί <strong>Κοινοποίηση (Share)</strong> στο κάτω μέρος του Safari.</li>
                      <li>Κάντε κύλιση προς τα κάτω και πατήστε <strong>Προσθήκη στην οθόνη αφετηρίας (Add to Home Screen)</strong>.</li>
                      <li>Πατήστε <strong>Προσθήκη</strong> πάνω δεξιά.</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                      <Smartphone className="w-4 h-4 text-emerald-400" /> Σε Android (Chrome / Edge / Samsung Internet):
                    </span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 ml-1">
                      <li>Πατήστε τις <strong>3 κάθετες τελείες (Μενού)</strong> πάνω δεξιά στον Chrome.</li>
                      <li>Επιλέξτε <strong>«Εγκατάσταση εφαρμογής»</strong> ή <strong>«Προσθήκη στην αρχική οθόνη»</strong>.</li>
                      <li>Το εικονίδιο του <strong>AudiBFB Live</strong> θα εμφανιστεί στο συρτάρι εφαρμογών σαν κανονικό APK!</li>
                    </ol>
                  </div>
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-slate-300">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>Θέλετε το αρχείο .APK για εγκατάσταση μέσω αρχείου;</strong>
                        <br />
                        Μεταβείτε στην καρτέλα <strong>«Android APK & Project»</strong> για να κατεβάσετε τον έτοιμο πηγαίο κώδικα Android Studio με το MainActivity και τα Gradle scripts!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowGuideModal(false);
                  if (onNavigateToApkTab) onNavigateToApkTab();
                }}
                className="mt-5 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Εντάξει, Κατάλαβα
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Compact variant for Navbar
  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        title="Εγκατάσταση στο κινητό"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Εγκατάσταση APK</span>
        <span className="sm:hidden">APK</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1422] border border-slate-700 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-2">Εγκατάσταση στο Κινητό</h3>
            <p className="text-xs text-slate-300 mb-4">
              Στο Android: Πατήστε στο μενού του browser (3 τελείες) και επιλέξτε <strong>«Εγκατάσταση εφαρμογής»</strong>.
            </p>
            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      )}
    </>
  );
};
