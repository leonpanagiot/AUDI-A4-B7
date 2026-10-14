import React, { useState } from 'react';
import { 
  Download, 
  FileCode, 
  Smartphone, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  FolderArchive,
  Github,
  Wifi,
  Bluetooth,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { getAndroidProjectFiles, downloadAndroidProjectZip, AndroidFilePreview } from '../services/androidProjectGenerator';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const AndroidApkCenter: React.FC = () => {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const files = getAndroidProjectFiles();
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const selectedFile = files[selectedFileIndex] || files[0];

  const handleDownload = async () => {
    setDownloadingZip(true);
    try {
      await downloadAndroidProjectZip();
    } finally {
      setTimeout(() => setDownloadingZip(false), 800);
    }
  };

  const handleCopyCode = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const gitCommands = `# 1. Αποσυμπιέστε το ZIP και μπείτε στον φάκελο:
cd AudiBFBLive_Android

# 2. Αρχικοποιήστε το git:
git init
git add .
git commit -m "AudiBFB Live Android Project with CI"
git branch -M main

# 3. Συνδέστε το repository σας στο GitHub (αντικαταστήστε το USERNAME):
git remote add origin https://github.com/USERNAME/AudiBFBLive_Android.git
git push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Explainer Banner */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Android APK &amp; Source Center
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Δημιουργία &amp; Εγκατάσταση APK για το AudiBFB Live
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Το project <strong>AudiBFBLive_Android</strong> (πακέτο <code className="text-red-400 font-mono bg-slate-950/60 px-1.5 py-0.5 rounded">gr.audi.bfblive</code>) 
            υποστηρίζει <strong>σύνδεση τόσο μέσω WiFi OBD2 (192.168.0.10:35000) όσο και μέσω Bluetooth</strong>. 
            Επιλέξτε πώς θέλετε να πάρετε την εφαρμογή στο κινητό σας:
          </p>
        </div>

        {/* 2 Big Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Option 1: Direct PWA WebAPK install (No PC needed) */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Επιλογη 1 • Αμεση (Χωρις PC)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  1-Click Στο Κινητό
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Εγκατάσταση στο Κινητό (PWA / WebAPK)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Εγκαθιστά το AudiBFB Live απευθείας στο Android smartphone σας ως πλήρη αυτόνομη εφαρμογή με εικονίδιο, WiFi/Bluetooth OBD2 και λειτουργία πλήρους οθόνης.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              {isInstalled ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  Η εφαρμογή είναι ήδη εγκατεστημένη στο κινητό σας!
                </div>
              ) : (
                <button
                  onClick={install}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/25 active:scale-98 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Εγκατάσταση στο Κινητό Τώρα</span>
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Full Android Project ZIP Download */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-red-400 tracking-wider uppercase flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4" />
                  Επιλογη 2 • Πληρες Android Studio ZIP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">
                  Έτοιμο Project .ZIP
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Λήψη Πηγαίου Κώδικα Android (.ZIP)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Περιλαμβάνει ολόκληρο το project <code className="text-slate-300 font-mono">AudiBFBLive_Android</code> με το <code>MainActivity.java</code> (WiFi + Bluetooth), το <code>AndroidManifest.xml</code> και το workflow GitHub Actions.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={handleDownload}
                disabled={downloadingZip}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 active:scale-98 cursor-pointer"
              >
                <Download className={`w-4 h-4 ${downloadingZip ? 'animate-bounce' : ''}`} />
                <span>{downloadingZip ? 'Δημιουργία ZIP...' : 'Κατέβασμα AudiBFBLive_Android.zip'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Step-by-Step GitHub Cloud Build Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Πώς να το στείλετε στο GitHub για Αυτόματη Παραγωγή APK (Cloud CI)
              </h3>
              <p className="text-xs text-slate-400">
                Το GitHub Actions φτιάχνει το .APK αυτόματα στο cloud σε 2 λεπτά, χωρίς καν να έχετε Android Studio!
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 self-start sm:self-auto">
            100% ΔΩΡΕΑΝ CLOUD BUILD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Method A: Via Browser Drag & Drop */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Μέθοδος 1: Μέσω Ιστοσελίδας GitHub (Χωρίς Εντολές)
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Ευκολότερο</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed text-[11px]">
              <li>
                Συνδεθείτε στο <a href="https://github.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">GitHub.com</a> και πατήστε το πράσινο κουμπί <strong>«New Repository»</strong>.
              </li>
              <li>
                Δώστε όνομα στο αποθετήριο (π.χ. <code className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">AudiBFBLive</code>) και πατήστε <strong>«Create repository»</strong>.
              </li>
              <li>
                Στην επόμενη σελίδα πατήστε το link: <strong>«uploading an existing file»</strong>.
              </li>
              <li>
                Αποσυμπιέστε το <strong>AudiBFBLive_Android.zip</strong> στον υπολογιστή σας και σύρετε (drag &amp; drop) <strong>όλα τα αρχεία και τους φακέλους</strong> μέσα στο GitHub.
              </li>
              <li>
                Πατήστε <strong>«Commit changes»</strong>.
              </li>
              <li className="text-emerald-400 font-semibold">
                Μόλις ολοκληρωθεί, πηγαίνετε στην καρτέλα <strong>Actions</strong> ➔ Το GitHub θα φτιάξει αυτόματα το αρχείο <strong>app-debug.apk</strong> για να το κατεβάσετε!
              </li>
            </ol>
          </div>

          {/* Method B: Via Terminal / Git CLI */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Μέθοδος 2: Μέσω Τερματικού (Git CLI)
                </span>
                <button
                  onClick={handleCopyGitCommands}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded transition cursor-pointer"
                >
                  {copiedGitCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGitCmd ? 'Αντιγράφηκε!' : 'Αντιγραφή'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Τρέξτε αυτές τις εντολές μέσα στον αποσυμπιεσμένο φάκελο:
              </p>
              <pre className="bg-[#0b0f19] p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {gitCommands}
              </pre>
            </div>
            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              💡 Το αρχείο <code className="text-purple-300 font-mono">.github/workflows/build-apk.yml</code> περιλαμβάνεται ήδη μέσα στο ZIP, οπότε το CI του GitHub ξεκινά αυτόματα με το πρώτο push!
            </div>
          </div>
        </div>
      </div>

      {/* NEW: WiFi vs Bluetooth Connection Explainer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Ρυθμίσεις Σύνδεσης OBD2: Είναι με WiFi ή με Bluetooth;
            </h3>
            <p className="text-xs text-slate-400">
              Η εφαρμογή υποστηρίζει **ΚΑΙ ΤΑ ΔΥΟ** πρωτόκολλα (WiFi και Bluetooth ELM327)!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* WiFi Details */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
              <Wifi className="w-4 h-4" />
              Αν έχετε WiFi OBD2 Dongle (Πιο σύνηθες σε ELM327):
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Το dongle λειτουργεί ως Wi-Fi Access Point (δημιουργεί ασύρματο δίκτυο):
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
              <li>Όνομα WiFi (SSID): <strong className="text-white">WiFi_OBDII</strong> ή <strong className="text-white">OBDII-WiFi</strong></li>
              <li>Προεπιλεγμένη IP: <strong className="text-emerald-400">192.168.0.10</strong></li>
              <li>Προεπιλεγμένη Θύρα (Port): <strong className="text-emerald-400">35000</strong></li>
            </ul>
            <p className="text-slate-400 text-[11px] pt-1">
              <strong>Πώς συνδέεστε:</strong> Ανοίγετε το WiFi του κινητού, συνδέεστε στο δίκτυο του dongle και στην εφαρμογή πατάτε <strong>«Σύνδεση WiFi OBD»</strong>!
            </p>
          </div>

          {/* Bluetooth Details */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider">
              <Bluetooth className="w-4 h-4" />
              Αν έχετε Bluetooth OBD2 Dongle (VGate, Viecar, κ.α.):
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Το dongle συνδέεται μέσω Bluetooth Serial Port Profile (SPP) ή BLE:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
              <li>Όνομα συσκευής: <strong className="text-white">OBDII</strong> ή <strong className="text-white">vLinker</strong></li>
              <li>Κωδικός σύζευξης PIN: <strong className="text-blue-400">1234</strong> ή <strong className="text-blue-400">0000</strong></li>
              <li>Πρωτόκολλο: <strong className="text-slate-300">Bluetooth SPP / Web Bluetooth</strong></li>
            </ul>
            <p className="text-slate-400 text-[11px] pt-1">
              <strong>Πώς συνδέεστε:</strong> Κάνετε μία φορά Pair στις ρυθμίσεις Bluetooth του κινητού και στην εφαρμογή πατάτε <strong>«Bluetooth»</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* In-Browser Android Code Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              Επισκόπηση Αρχείων Android Project
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Επιλέξτε αρχείο για ανάγνωση ή αντιγραφή κώδικα
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyCode(selectedFile.content, selectedFile.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              {copiedFile === selectedFile.path ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Αντιγράφηκε!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Αντιγραφή Κώδικα</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Λήψη Όλων (.ZIP)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
          {/* File list sidebar */}
          <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/40 p-2 space-y-1">
            {files.map((file, idx) => {
              const fileName = file.path.split('/').pop();
              const isSelected = idx === selectedFileIndex;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition cursor-pointer flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-red-600/20 border border-red-500/40 text-white font-semibold'
                      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono text-xs truncate">{fileName}</span>
                  <span className="text-[10px] text-slate-400 truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* Code viewer */}
          <div className="md:col-span-8 p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[500px]">
            <div className="mb-3 text-[11px] text-slate-400 font-sans border-b border-slate-800/80 pb-2 flex items-center justify-between">
              <span>{selectedFile.description}</span>
              <span className="text-[10px] text-slate-400 font-mono">{selectedFile.path}</span>
            </div>
            <pre className="text-slate-200 leading-relaxed whitespace-pre font-mono text-[11px]">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
