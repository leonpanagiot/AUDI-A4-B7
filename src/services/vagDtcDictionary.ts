import { DTCFault } from '../types/telemetry';

/**
 * Πλήρες Ελληνικό Λεξικό Κωδικών Βλάβης (DTCs) για Audi A4 B7 1.8T 20V (BFB / Bosch ME7.5) & OBD-II
 * Περιλαμβάνει:
 * - Αντιστοίχιση σε 5-ψήφιο κωδικό VAG (VCDS / VAG-COM)
 * - Πλήρη ελληνική ονομασία & τεχνική επεξήγηση (αιτίες, συμπτώματα, έλεγχος)
 * - Έξυπνο αναλυτή SAE J2012 στα Ελληνικά για οποιονδήποτε άγνωστο κωδικό P/C/B/U
 */

export interface GreekDtcEntry {
  code: string;
  vagCode?: string;
  title: string;
  description: string;
  greekDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  system: 'Turbo / Boost' | 'Ignition / Fuel' | 'Sensors' | 'Catalyst / EVAP';
}

export const VAG_GREEK_DTC_DICTIONARY: Record<string, GreekDtcEntry> = {
  // --- Αισθητήρας Μάζας Αέρα (MAF - G70) & Θερμοκρασίας Εισαγωγής (IAT - G42) ---
  P0100: {
    code: 'P0100',
    vagCode: '16484',
    title: ' Mass Air Flow (MAF) G70: Δυσλειτουργία Κυκλώματος',
    description: 'Mass or Volume Air Flow A Circuit Malfunction (G70)',
    greekDescription: 'Βλάβη στο κύκλωμα του αισθητήρα μάζας αέρα (MAF - G70). Ελέγξτε τη φίσα 5 ακίδων του MAF, την ασφάλεια τροφοδοσίας και αν το στοιχείο μέτρησης είναι λερωμένο ή καμένο.',
    severity: 'high',
    system: 'Sensors',
  },
  P0101: {
    code: 'P0101',
    vagCode: '16485',
    title: 'Αισθητήρας Μάζας Αέρα (MAF - G70): Μη Αληθοφανές Σήμα',
    description: 'Mass or Volume Air Flow A Circuit Range/Performance (G70)',
    greekDescription: 'Η μετρούμενη μάζα αέρα (g/s) από τον MAF (G70) αποκλίνει από το αναμενόμενο φορτίο της ECU. Συχνές αιτίες: διαρροή αέρα μετά τον MAF (σκισμένο κολάρο εισαγωγής/PCV), βρώμικος ή ελαττωματικός αισθητήρας Bosch MAF.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0102: {
    code: 'P0102',
    vagCode: '16486',
    title: 'Αισθητήρας Μάζας Αέρα (MAF - G70): Σήμα Πολύ Χαμηλό',
    description: 'Mass or Volume Air Flow A Circuit Low Input (G70)',
    greekDescription: 'Η τάση από τον αισθητήρα MAF (G70) είναι πολύ χαμηλή (ή 0 g/s). Συνήθως οφείλεται σε αποσυνδεδεμένη φίσα MAF, κομμένο καλώδιο τροφοδοσίας 12V/5V ή καμένο MAF, ή μεγάλη διαρροή στο κολάρο της τουρμπίνας (TIP).',
    severity: 'high',
    system: 'Sensors',
  },
  P0103: {
    code: 'P0103',
    vagCode: '16487',
    title: 'Αισθητήρας Μάζας Αέρα (MAF - G70): Σήμα Πολύ Υψηλό',
    description: 'Mass or Volume Air Flow A Circuit High Input (G70)',
    greekDescription: 'Ο αισθητήρας MAF (G70) καταγράφει υπερβολικά υψηλή ροή αέρα. Ελέγξτε για βραχυκύκλωμα στην καλωδίωση του G70 ή υπερπλήρωση (overboost) λόγω κολλημένης N75/wastegate.',
    severity: 'high',
    system: 'Sensors',
  },
  P0106: {
    code: 'P0106',
    vagCode: '16490',
    title: 'Αισθητήρας Πίεσης Εισαγωγής / Βαρομετρικής (G71 / F96): Μη Αληθοφανές Σήμα',
    description: 'Manifold Absolute Pressure/Barometric Pressure Circuit Range/Performance',
    greekDescription: 'Ασυμφωνία μεταξύ αισθητήρα πίεσης turbo (MAP - G71 στο intercooler) και βαρομετρικού αισθητήρα (F96 στην ECU). Ελέγξτε τον αισθητήρα G71 για λάδια ή βλάβη.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0107: {
    code: 'P0107',
    vagCode: '16491',
    title: 'Αισθητήρας Πίεσης Πολλαπλής / Turbo (MAP - G71): Σήμα Πολύ Χαμηλό',
    description: 'Manifold Absolute Pressure/Barometric Pressure Circuit Low Input',
    greekDescription: 'Το σήμα από τον αισθητήρα πίεσης G71 είναι κάτω από το όριο. Ελέγξτε τη φίσα του αισθητήρα MAP πάνω στο intercooler και την καλωδίωση προς την ECU.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0108: {
    code: 'P0108',
    vagCode: '16492',
    title: 'Αισθητήρας Πίεσης Πολλαπλής / Turbo (MAP - G71): Σήμα Πολύ Υψηλό',
    description: 'Manifold Absolute Pressure/Barometric Pressure Circuit High Input',
    greekDescription: 'Το σήμα από τον αισθητήρα πίεσης G71 είναι πάνω από το μέγιστο όριο (βραχυκύκλωμα στα +5V ή υπερπίεση turbo). Ελέγξτε τον G71 και τη βαλβίδα N75.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0112: {
    code: 'P0112',
    vagCode: '16496',
    title: 'Αισθητήρας Θερμοκρασίας Αέρα Εισαγωγής (IAT - G42): Σήμα Πολύ Χαμηλό',
    description: 'Intake Air Temperature Sensor 1 Circuit Low (G42)',
    greekDescription: 'Βραχυκύκλωμα προς τη γείωση στον αισθητήρα θερμοκρασίας αέρα εισαγωγής G42 (βρίσκεται στην πολλαπλή εισαγωγής δίπλα στην πεταλούδα στον 1.8T BFB). Η ECU βλέπει εξωπραγματικά υψηλή θερμοκρασία.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0113: {
    code: 'P0113',
    vagCode: '16497',
    title: 'Αισθητήρας Θερμοκρασίας Αέρα Εισαγωγής (IAT - G42): Σήμα Πολύ Υψηλό',
    description: 'Intake Air Temperature Sensor 1 Circuit High (G42)',
    greekDescription: 'Ανοιχτό κύκλωμα ή αποσυνδεδεμένη φίσα στον αισθητήρα θερμοκρασίας εισαγωγής G42 (η ECU διαβάζει -40°C). Ελέγξτε τη φίσα 2 ακίδων πάνω στην πολλαπλή εισαγωγής.',
    severity: 'medium',
    system: 'Sensors',
  },

  // --- Αισθητήρας Θερμοκρασίας Ψυκτικού (ECT - G62) & Θερμοστάτης (F265) ---
  P0116: {
    code: 'P0116',
    vagCode: '16500',
    title: 'Αισθητήρας Θερμοκρασίας Ψυκτικού (G62): Μη Αληθοφανές Σήμα',
    description: 'Engine Coolant Temperature Circuit Range/Performance (G62)',
    greekDescription: 'Η θερμοκρασία ψυκτικού από τον πράσινο 4-πινο αισθητήρα G62 (πίσω από την κυλινδροκεφαλή) δεν ανεβαίνει κανονικά ή παρουσιάζει απότομες αυξομειώσεις. Πολύ συχνή βλάβη σε 1.8T BFB.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0117: {
    code: 'P0117',
    vagCode: '16501',
    title: 'Αισθητήρας Θερμοκρασίας Ψυκτικού (G62): Σήμα Πολύ Χαμηλό',
    description: 'Engine Coolant Temperature Circuit Low Input (G62)',
    greekDescription: 'Βραχυκύκλωμα προς γείωση στον αισθητήρα G62. Προκαλεί δυσκολία στην εκκίνηση και συνεχή λειτουργία των βεντιλατέρ.',
    severity: 'high',
    system: 'Sensors',
  },
  P0118: {
    code: 'P0118',
    vagCode: '16502',
    title: 'Αισθητήρας Θερμοκρασίας Ψυκτικού (G62): Σήμα Πολύ Υψηλό',
    description: 'Engine Coolant Temperature Circuit High Input (G62)',
    greekDescription: 'Ανοιχτό κύκλωμα ή κομμένη φίσα στον αισθητήρα G62 (πίσω από το καπάκι βαλβίδων). Η ECU βλέπει -40°C, εμπλουτίζει υπερβολικά το μείγμα και τα βεντιλατέρ δουλεύουν στο μέγιστο.',
    severity: 'high',
    system: 'Sensors',
  },
  P0120: {
    code: 'P0120',
    vagCode: '16504',
    title: 'Ποτενσιόμετρο Πεταλούδας Γκαζιού Α (G69 / G187): Δυσλειτουργία',
    description: 'Throttle/Pedal Position Sensor/Switch A Circuit Malfunction',
    greekDescription: 'Σφάλμα στο κύκλωμα του αισθητήρα θέσης ηλεκτρονικής πεταλούδας γκαζιού (J338 / G187). Ελέγξτε τη φίσα 6 ακίδων της πεταλούδας, καθαρίστε την πεταλούδα και κάντε βασική ρύθμιση (Group 060).',
    severity: 'high',
    system: 'Sensors',
  },
  P0121: {
    code: 'P0121',
    vagCode: '16505',
    title: 'Αισθητήρας Θέσης Πεταλούδας (G69 / G187): Μη Αληθοφανές Σήμα',
    description: 'Throttle/Pedal Position Sensor/Switch A Circuit Range/Performance',
    greekDescription: 'Η γωνία της πεταλούδας αποκλίνει από το αναμενόμενο εύρος. Καθαρίστε το σώμα της πεταλούδας από επικαθίσεις άνθρακα και εκτελέστε Throttle Body Alignment (Group 060).',
    severity: 'high',
    system: 'Sensors',
  },
  P0122: {
    code: 'P0122',
    vagCode: '16506',
    title: 'Αισθητήρας Θέσης Πεταλούδας (G69 / G187): Σήμα Πολύ Χαμηλό',
    description: 'Throttle/Pedal Position Sensor/Switch A Circuit Low Input',
    greekDescription: 'Η τάση του ποτενσιόμετρου 1 της πεταλούδας (G187) είναι κάτω από το όριο. Ελέγξτε τη φίσα της πεταλούδας J338 για οξείδωση ή κομμένα καλώδια.',
    severity: 'critical',
    system: 'Sensors',
  },
  P0123: {
    code: 'P0123',
    vagCode: '16507',
    title: 'Αισθητήρας Θέσης Πεταλούδας (G69 / G187): Σήμα Πολύ Υψηλό',
    description: 'Throttle/Pedal Position Sensor/Switch A Circuit High Input',
    greekDescription: 'Βραχυκύκλωμα στα +5V στο ποτενσιόμετρο της ηλεκτρονικής πεταλούδας J338. Ενεργοποιείται λυχνία EPC και περιορισμός ισχύος (Limp Mode).',
    severity: 'critical',
    system: 'Sensors',
  },
  P0128: {
    code: 'P0128',
    vagCode: '16512',
    title: 'Θερμοστάτης Ψυκτικού: Θερμοκρασία Κάτω από το Όριο Ρύθμισης',
    description: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)',
    greekDescription: 'Ο κινητήρας αργεί να πιάσει θερμοκρασία λειτουργίας ή πέφτει κάτω από τους 80°C στην εθνική οδό. Ο ηλεκτρονικός θερμοστάτης (F265) έχει κολλήσει ανοιχτός.',
    severity: 'medium',
    system: 'Sensors',
  },

  // --- Αισθητήρες Λάμδα (B1S1 Προ Καταλύτη & B1S2 Μετά τον Καταλύτη) ---
  P0130: {
    code: 'P0130',
    vagCode: '16514',
    title: 'Αισθητήρας Λάμδα 1 (B1S1 - Προ Καταλύτη): Δυσλειτουργία Κυκλώματος',
    description: 'O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)',
    greekDescription: 'Σφάλμα στον κύριο αισθητήρα λάμδα ευρέος φάσματος (Wideband LSU 4.2 - B1S1) πριν τον καταλύτη. Προκαλεί αυξημένη κατανάλωση και ακανόνιστο ρελαντί.',
    severity: 'high',
    system: 'Sensors',
  },
  P0131: {
    code: 'P0131',
    vagCode: '16515',
    title: 'Αισθητήρας Λάμδα 1 (B1S1): Τάση Πολύ Χαμηλή',
    description: 'O2 Sensor Circuit Low Voltage (Bank 1 Sensor 1)',
    greekDescription: 'Πολύ χαμηλή τάση στον αισθητήρα λάμδα B1S1 πριν τον καταλύτη. Ελέγξτε την καλωδίωση και για διαρροές καυσαερίων στην πολλαπλή εξαγωγής.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0132: {
    code: 'P0132',
    vagCode: '16516',
    title: 'Αισθητήρας Λάμδα 1 (B1S1): Τάση Πολύ Υψηλή',
    description: 'O2 Sensor Circuit High Voltage (Bank 1 Sensor 1)',
    greekDescription: 'Βραχυκύκλωμα προς θετικό στον αισθητήρα λάμδα B1S1 πριν τον καταλύτη.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0133: {
    code: 'P0133',
    vagCode: '16517',
    title: 'Αισθητήρας Λάμδα 1 (B1S1): Αργή Απόκριση (Γήρανση Αισθητήρα)',
    description: 'O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)',
    greekDescription: 'Ο πρώτος αισθητήρας λάμδα (B1S1) έχει γεράσει και καθυστερεί να διορθώσει το μείγμα. Συνιστάται αντικατάσταση με γνήσιο Bosch Wideband.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0134: {
    code: 'P0134',
    vagCode: '16518',
    title: 'Αισθητήρας Λάμδα 1 (B1S1): Καμία Δραστηριότητα (Νεκρό Σήμα)',
    description: 'O2 Sensor Circuit No Activity Detected (Bank 1 Sensor 1)',
    greekDescription: 'Δεν ανιχνεύεται κανένα σήμα από τον αισθητήρα λάμδα πριν τον καταλύτη (B1S1). Η ECU λειτουργεί σε Open Loop με σταθερό χάρτη καυσίμου.',
    severity: 'high',
    system: 'Sensors',
  },
  P0135: {
    code: 'P0135',
    vagCode: '16519',
    title: 'Κύκλωμα Προθέρμανσης Αισθητήρα Λάμδα 1 (B1S1): Βλάβη Αντίστασης',
    description: 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)',
    greekDescription: 'Καμένη αντίσταση προθέρμανσης στον πρώτο αισθητήρα λάμδα (B1S1) ή καμένη ασφάλεια τροφοδοσίας λάμδα.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0136: {
    code: 'P0136',
    vagCode: '16520',
    title: 'Αισθητήρας Λάμδα 2 (B1S2 - Μετά τον Καταλύτη): Δυσλειτουργία Κυκλώματος',
    description: 'O2 Sensor Circuit Malfunction (Bank 1 Sensor 2)',
    greekDescription: 'Βλάβη στον δεύτερο αισθητήρα λάμδα (B1S2) μετά τον καταλύτη, ο οποίος ελέγχει την απόδοση του καταλύτη.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0137: {
    code: 'P0137',
    vagCode: '16521',
    title: 'Αισθητήρας Λάμδα 2 (B1S2 - Μετά τον Καταλύτη): Τάση Πολύ Χαμηλή',
    description: 'O2 Sensor Circuit Low Voltage (Bank 1 Sensor 2)',
    greekDescription: 'Χαμηλή τάση στον πίσω αισθητήρα λάμδα (B1S2). Ελέγξτε για διαρροή στην εξάτμιση γύρω από τον καταλύτη ή φθαρμένη καλωδίωση κάτω από το αυτοκίνητο.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0138: {
    code: 'P0138',
    vagCode: '16522',
    title: 'Αισθητήρας Λάμδα 2 (B1S2 - Μετά τον Καταλύτη): Τάση Πολύ Υψηλή',
    description: 'O2 Sensor Circuit High Voltage (Bank 1 Sensor 2)',
    greekDescription: 'Υψηλή τάση στο κύκλωμα του πίσω αισθητήρα λάμδα (B1S2).',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0139: {
    code: 'P0139',
    vagCode: '16523',
    title: 'Αισθητήρας Λάμδα 2 (B1S2): Αργή Απόκριση',
    description: 'O2 Sensor Circuit Slow Response (Bank 1 Sensor 2)',
    greekDescription: 'Ο πίσω αισθητήρας λάμδα (B1S2) αποκρίνεται αργά στις μεταβολές καυσαερίων.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0140: {
    code: 'P0140',
    vagCode: '16524',
    title: 'Αισθητήρας Λάμδα 2 (B1S2 - Μετά τον Καταλύτη): Καμία Δραστηριότητα',
    description: 'O2 Sensor Circuit No Activity Detected (Bank 1 Sensor 2)',
    greekDescription: 'Το σήμα του πίσω αισθητήρα λάμδα (B1S2) παραμένει σταθερό (~0.45V). Ελέγξτε τη φίσα στο firewall και τον ίδιο τον αισθητήρα.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0141: {
    code: 'P0141',
    vagCode: '16525',
    title: 'Κύκλωμα Προθέρμανσης Αισθητήρα Λάμδα 2 (B1S2): Βλάβη Αντίστασης',
    description: 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 2)',
    greekDescription: 'Βλάβη στην αντίσταση προθέρμανσης του δεύτερου αισθητήρα λάμδα (B1S2) μετά τον καταλύτη.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },

  // --- Μείγμα Καυσίμου (Fuel Trim - STFT / LTFT) ---
  P0170: {
    code: 'P0170',
    vagCode: '16554',
    title: 'Διόρθωση Καυσίμου (Bank 1): Δυσλειτουργία Συστήματος Τροφοδοσίας',
    description: 'Fuel Trim Malfunction (Bank 1)',
    greekDescription: 'Η προσαρμογή μείγματος καυσίμου (Fuel Trim Group 032) βγήκε εκτός ορίων. Ελέγξτε πίεση αντλίας βενζίνης (4 bar στον BFB), MAF (G70) και διαρροές υποπίεσης.',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
  P0171: {
    code: 'P0171',
    vagCode: '16555',
    title: 'Σύστημα Πολύ Φτωχό (System Too Lean - Bank 1)',
    description: 'System Too Lean (Bank 1)',
    greekDescription: 'Κλασική βλάβη 1.8T BFB! Το μείγμα είναι πολύ φτωχό (LTFT > +25% στο Group 032) και η ECU προσθέτει συνέχεια καύσιμο. Βασικές αιτίες: 1) Σκισμένη βαλβίδα PCV (κάτω από την πολλαπλή εισαγωγής) ή σωλήνας αναθυμιάσεων στροφάλου, 2) Κολλημένη Suction Jet Pump, 3) Διαρροή υποπίεσης/κολάρων, 4) Πεσμένη αντλία βενζίνης ή βουλωμένο φίλτρο βενζίνης (με ενσωματωμένο ρυθμιστή 4 bar), 5) Ελαττωματικός MAF (G70).',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
  P0172: {
    code: 'P0172',
    vagCode: '16556',
    title: 'Σύστημα Πολύ Πλούσιο (System Too Rich - Bank 1)',
    description: 'System Too Rich (Bank 1)',
    greekDescription: 'Το μείγμα είναι πολύ πλούσιο (LTFT < -25% στο Group 032) και η ECU κόβει καύσιμο. Αιτίες: 1) Διαρροή πίεσης turbo (Boost Leak) ανάμεσα στην τουρμπίνα, το intercooler και την πεταλούδα (αέρας που μετρήθηκε από τον MAF χάνεται), 2) Κολλημένο ανοιχτό μπεκ ψεκασμού, 3) Σκισμένη μεμβράνη στη σκάστρα (DV - N249), 4) Ελαττωματικός αισθητήρας G62.',
    severity: 'high',
    system: 'Ignition / Fuel',
  },

  // --- Μπεκ Ψεκασμού (N30-N33) & Αντλία Καυσίμου ---
  P0201: {
    code: 'P0201',
    vagCode: '16585',
    title: 'Μπεκ Ψεκασμού Κυλίνδρου 1 (N30): Βλάβη Κυκλώματος',
    description: 'Injector Circuit Malfunction - Cylinder 1 (N30)',
    greekDescription: 'Διακοπή ή βραχυκύκλωμα στο ηλεκτρικό κύκλωμα του μπεκ ψεκασμού 1 (N30). Ο κύλινδρος 1 δεν τροφοδοτείται με καύσιμο.',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0202: {
    code: 'P0202',
    vagCode: '16586',
    title: 'Μπεκ Ψεκασμού Κυλίνδρου 2 (N31): Βλάβη Κυκλώματος',
    description: 'Injector Circuit Malfunction - Cylinder 2 (N31)',
    greekDescription: 'Διακοπή ή βραχυκύκλωμα στο ηλεκτρικό κύκλωμα του μπεκ ψεκασμού 2 (N31).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0203: {
    code: 'P0203',
    vagCode: '16587',
    title: 'Μπεκ Ψεκασμού Κυλίνδρου 3 (N32): Βλάβη Κυκλώματος',
    description: 'Injector Circuit Malfunction - Cylinder 3 (N32)',
    greekDescription: 'Διακοπή ή βραχυκύκλωμα στο ηλεκτρικό κύκλωμα του μπεκ ψεκασμού 3 (N32).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0204: {
    code: 'P0204',
    vagCode: '16588',
    title: 'Μπεκ Ψεκασμού Κυλίνδρου 4 (N33): Βλάβη Κυκλώματος',
    description: 'Injector Circuit Malfunction - Cylinder 4 (N33)',
    greekDescription: 'Διακοπή ή βραχυκύκλωμα στο ηλεκτρικό κύκλωμα του μπεκ ψεκασμού 4 (N33).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },

  // --- Σύστημα Υπερπλήρωσης Turbo (K03 / N75 / N249 / MAP G71) ---
  P0234: {
    code: 'P0234',
    vagCode: '16618',
    title: 'Υπερπλήρωση Κινητήρα (Overboost): Ξεπεράστηκε το Όριο Πίεσης Turbo',
    description: 'Turbocharger/Supercharger Overboost Condition (Control Limit Exceeded)',
    greekDescription: 'Η πραγματική πίεση turbo (Group 115) ξεπέρασε κατά πολύ τη ζητούμενη πίεση της ECU και ενεργοποιήθηκε ασφαλιστικό κόψιμο (Limp Mode). Αιτίες: 1) Κολλημένη βαλβίδα N75, 2) Σκισμένο ή βγαλμένο σωληνάκι από την N75 προς το actuator της wastegate, 3) Κολλημένη wastegate στην τουρμπίνα K03.',
    severity: 'critical',
    system: 'Turbo / Boost',
  },
  P0236: {
    code: 'P0236',
    vagCode: '16620',
    title: 'Αισθητήρας Πίεσης Turbo (MAP - G31/G71): Μη Αληθοφανές Σήμα',
    description: 'Turbocharger Boost Sensor A Circuit Range/Performance (G31/G71)',
    greekDescription: 'Η τιμή του αισθητήρα πίεσης G71 στο intercooler δεν συμφωνεί με την ατμοσφαιρική πίεση όταν ο διακόπτης είναι στο ON ή στο ρελαντί.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0237: {
    code: 'P0237',
    vagCode: '16621',
    title: 'Αισθητήρας Πίεσης Turbo (MAP - G31/G71): Σήμα Πολύ Χαμηλό',
    description: 'Turbocharger Boost Sensor A Circuit Low (G31/G71)',
    greekDescription: 'Χαμηλή τάση ή κομμένο καλώδιο στον αισθητήρα πίεσης turbo G71 (πάνω στο αριστερό intercooler).',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0238: {
    code: 'P0238',
    vagCode: '16622',
    title: 'Αισθητήρας Πίεσης Turbo (MAP - G31/G71): Σήμα Πολύ Υψηλό',
    description: 'Turbocharger Boost Sensor A Circuit High (G31/G71)',
    greekDescription: 'Υψηλή τάση (βραχυκύκλωμα στα +5V) στον αισθητήρα πίεσης turbo G71 ή ακραίο overboost.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0243: {
    code: 'P0243',
    vagCode: '16627',
    title: 'Ηλεκτροβαλβίδα Ελέγχου Πίεσης Turbo (N75): Δυσλειτουργία Κυκλώματος',
    description: 'Turbocharger Wastegate Solenoid A Malfunction (N75)',
    greekDescription: 'Ηλεκτρική βλάβη στη βαλβίδα N75. Το turbo δουλεύει μόνο με τη μηχανική πίεση του ελατηρίου της wastegate (~0.3 bar).',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0245: {
    code: 'P0245',
    vagCode: '16629',
    title: 'Ηλεκτροβαλβίδα Ελέγχου Πίεσης Turbo (N75): Ανοιχτό Κύκλωμα / Βραχυκύκλωμα στη Γείωση',
    description: 'Turbocharger Wastegate Solenoid A Low (N75)',
    greekDescription: 'Αποσυνδεδεμένη φίσα, κομμένο καλώδιο ή καμένο πηνίο στη βαλβίδα N75 (βρίσκεται στο κολάρο εισαγωγής TIP). Η πίεση turbo περιορίζεται στα 0.3 bar.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P0246: {
    code: 'P0246',
    vagCode: '16630',
    title: 'Ηλεκτροβαλβίδα Ελέγχου Πίεσης Turbo (N75): Βραχυκύκλωμα στο Θετικό (+)',
    description: 'Turbocharger Wastegate Solenoid A High (N75)',
    greekDescription: 'Βραχυκύκλωμα στα +12V στο κύκλωμα της βαλβίδας N75. Κίνδυνος ανεξέλεγκτης υπερπίεσης (Overboost).',
    severity: 'critical',
    system: 'Turbo / Boost',
  },
  P0299: {
    code: 'P0299',
    vagCode: '16683',
    title: 'Υποπλήρωση Turbo (Underboost): Δεν Επιτεύχθηκε το Κάτω Όριο Πίεσης',
    description: 'Boost Pressure Regulation: Control Range Not Reached (Underboost)',
    greekDescription: 'Η πιο συχνή βλάβη turbo στον 1.8T BFB! Η πραγματική πίεση είναι χαμηλότερη από τη ζητούμενη (Group 115). Αιτίες: 1) Σκισμένη εργοστασιακή σκάστρα (Diverter Valve 710N), 2) Διαρροή σε κολάρο turbo ή intercooler, 3) Ελαττωματική βαλβίδα N75, 4) Χαλαρό ή ραγισμένο πορτάκι wastegate στην τουρμπίνα K03.',
    severity: 'high',
    system: 'Turbo / Boost',
  },

  // --- Απώλεια Ανάφλεξης (Misfires P0300 - P0304) & Knock / Crank / Cam ---
  P0300: {
    code: 'P0300',
    vagCode: '16684',
    title: 'Ανίχνευση Τυχαίων/Πολλαπλών Διακοπών Ανάφλεξης (Random/Multiple Cylinder Misfire)',
    description: 'Random/Multiple Cylinder Misfire Detected',
    greekDescription: 'Εντοπίστηκαν ρεταρίσματα (misfires) σε πολλούς κυλίνδρους. Στον 1.8T BFB οφείλεται σε: 1) Πολλαπλασιαστές (Coil Packs), 2) Μπουζί (π.χ. NGK PFR6Q), 3) Μεγάλη διαρροή υποπίεσης (βαλβίδα PCV / κολάρο αναθυμιάσεων), 4) Χαμηλή πίεση βενζίνης.',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0301: {
    code: 'P0301',
    vagCode: '16685',
    title: 'Κύλινδρος 1: Ανίχνευση Διακοπών Ανάφλεξης (Misfire Cylinder 1)',
    description: 'Cylinder 1 Misfire Detected',
    greekDescription: 'Ρετάρισμα στον Κύλινδρο 1 (ο πρώτος κύλινδρος από την πλευρά του ιμάντα χρονισμού / ψυγείου). Αλλάξτε θέση στον πολλαπλασιαστή 1 με τον 2 για να επιβεβαιώσετε αν φταίει ο πολλαπλασιαστής ή το μπουζί.',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0302: {
    code: 'P0302',
    vagCode: '16686',
    title: 'Κύλινδρος 2: Ανίχνευση Διακοπών Ανάφλεξης (Misfire Cylinder 2)',
    description: 'Cylinder 2 Misfire Detected',
    greekDescription: 'Ρετάρισμα στον Κύλινδρο 2. Συνήθως οφείλεται σε καμένο πολλαπλασιαστή (TFSI / R8 ή εργοστασιακό Beru/Bosch), φθαρμένο μπουζί ή ραγισμένη φίσα πολλαπλασιαστή.',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0303: {
    code: 'P0303',
    vagCode: '16687',
    title: 'Κύλινδρος 3: Ανίχνευση Διακοπών Ανάφλεξης (Misfire Cylinder 3)',
    description: 'Cylinder 3 Misfire Detected',
    greekDescription: 'Ρετάρισμα στον Κύλινδρο 3. Ελέγξτε τον πολλαπλασιαστή του 3ου κυλίνδρου, το μπουζί και την καλωδίωση των πολλαπλασιαστών πάνω στο καπάκι βαλβίδων (συχνά ξεραίνεται από τη θερμοκρασία).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0304: {
    code: 'P0304',
    vagCode: '16688',
    title: 'Κύλινδρος 4: Ανίχνευση Διακοπών Ανάφλεξης (Misfire Cylinder 4)',
    description: 'Cylinder 4 Misfire Detected',
    greekDescription: 'Ρετάρισμα στον Κύλινδρο 4 (προς την πλευρά της καμπίνας/καθρέφτη). Ελέγξτε πολλαπλασιαστή 4, μπουζί 4 και μπεκ ψεκασμού N33.',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P0321: {
    code: 'P0321',
    vagCode: '16705',
    title: 'Αισθητήρας Στροφών Στροφάλου (G28): Μη Αληθοφανές Σήμα',
    description: 'Engine Speed Sensor (G28): Implausible Signal',
    greekDescription: 'Ασταθές σήμα από τον αισθητήρα στροφάλου G28. Προκαλεί ξαφνικό σβήσιμο του κινητήρα όταν ζεσταθεί ή αδυναμία εκκίνησης.',
    severity: 'critical',
    system: 'Sensors',
  },
  P0322: {
    code: 'P0322',
    vagCode: '16706',
    title: 'Αισθητήρας Στροφών Στροφάλου (G28): Κανένα Σήμα',
    description: 'Engine Speed Sensor (G28): No Signal',
    greekDescription: 'Η ECU δεν λαμβάνει σήμα περιστροφής από τον αισθητήρα στροφάλου G28 (βρίσκεται χαμηλά στο μπλοκ κοντά στο φίλτρο λαδιού). Ο κινητήρας δεν παίρνει εμπρός. Αντικαταστήστε τον G28.',
    severity: 'critical',
    system: 'Sensors',
  },
  P0327: {
    code: 'P0327',
    vagCode: '16711',
    title: 'Αισθητήρας Κρουστικής Καύσης / Πυρακίων 1 (Knock Sensor G61): Σήμα Πολύ Χαμηλό',
    description: 'Knock Sensor 1 Circuit Low Input (G61 - Bank 1)',
    greekDescription: 'Χαμηλό σήμα από τον 1ο αισθητήρα πυρακίων G61 (κάτω από την πολλαπλή εισαγωγής). Η ECU κόβει προληπτικά αβάνς (Timing Retard) μειώνοντας την απόδοση.',
    severity: 'high',
    system: 'Sensors',
  },
  P0328: {
    code: 'P0328',
    vagCode: '16712',
    title: 'Αισθητήρας Κρουστικής Καύσης / Πυρακίων 1 (G61): Σήμα Πολύ Υψηλό',
    description: 'Knock Sensor 1 Circuit High Input (G61 - Bank 1)',
    greekDescription: 'Υπερβολικός θόρυβος/σήμα στον αισθητήρα πυρακίων G61. Ελέγξτε τη ροπή σύσφιξης της βίδας του αισθητήρα (ακριβώς 20 Nm) και την ποιότητα καυσίμου (χρήση 100 RON).',
    severity: 'high',
    system: 'Sensors',
  },
  P0332: {
    code: 'P0332',
    vagCode: '16716',
    title: 'Αισθητήρας Κρουστικής Καύσης / Πυρακίων 2 (Knock Sensor G66): Σήμα Πολύ Χαμηλό',
    description: 'Knock Sensor 2 Circuit Low Input (G66 - Bank 1)',
    greekDescription: 'Χαμηλό σήμα από τον 2ο αισθητήρα πυρακίων G66 (κύλινδροι 3-4). Ελέγξτε την πράσινη/μπλε φίσα του G66 και την καλωδίωση.',
    severity: 'high',
    system: 'Sensors',
  },
  P0340: {
    code: 'P0340',
    vagCode: '16724',
    title: 'Αισθητήρας Θέσης Εκκεντροφόρου (Hall G40): Δυσλειτουργία Κυκλώματος',
    description: 'Camshaft Position Sensor A Circuit Malfunction (G40)',
    greekDescription: 'Βλάβη στον αισθητήρα εκκεντροφόρου G40 (εμπρός στην κυλινδροκεφαλή) ή λάθος χρονισμός ιμάντα/καδένας εκκεντροφόρων.',
    severity: 'high',
    system: 'Sensors',
  },
  P0341: {
    code: 'P0341',
    vagCode: '16725',
    title: 'Αισθητήρας Θέσης Εκκεντροφόρου (G40): Μη Αληθοφανές Σήμα / Χρονισμός',
    description: 'Camshaft Position Sensor A Circuit Range/Performance (G40)',
    greekDescription: 'Ασυμφωνία χρονισμού μεταξύ στροφάλου (G28) και εκκεντροφόρου (G40). Ελέγξτε τον ιμάντα χρονισμού και τον υδραυλικό τεντωτήρα καδένας εκκεντροφόρων (VVT N205) στο πίσω μέρος της κεφαλής.',
    severity: 'high',
    system: 'Sensors',
  },
  P0342: {
    code: 'P0342',
    vagCode: '16726',
    title: 'Αισθητήρας Θέσης Εκκεντροφόρου (G40): Σήμα Πολύ Χαμηλό',
    description: 'Camshaft Position Sensor A Circuit Low Input (G40)',
    greekDescription: 'Βραχυκύκλωμα στη γείωση στον αισθητήρα εκκεντροφόρου G40.',
    severity: 'high',
    system: 'Sensors',
  },
  P0343: {
    code: 'P0343',
    vagCode: '16727',
    title: 'Αισθητήρας Θέσης Εκκεντροφόρου (G40): Σήμα Πολύ Υψηλό',
    description: 'Camshaft Position Sensor A Circuit High Input (G40)',
    greekDescription: 'Ανοιχτό κύκλωμα ή κομμένη φίσα στον αισθητήρα εκκεντροφόρου G40. Το αυτοκίνητο αργεί να πάρει εμπρός στη μίζα.',
    severity: 'high',
    system: 'Sensors',
  },

  // --- Δευτερεύουσα Αντλία Αέρα (SAI), Καταλύτης & EVAP (N80) ---
  P0411: {
    code: 'P0411',
    vagCode: '16795',
    title: 'Σύστημα Δευτερεύοντος Αέρα (SAI): Εσφαλμένη Ροή (Incorrect Flow)',
    description: 'Secondary Air Injection System Incorrect Flow Detected',
    greekDescription: 'Πολύ συχνή βλάβη στον 1.8T BFB κατά την πρωινή ψυχρή εκκίνηση. Αιτίες: 1) Σπασμένος πλαστικός σωλήνας της αντλίας SAI (V101), 2) Κομμένο σωληνάκι υποπίεσης στη βαλβίδα Combi πίσω από την κυλινδροκεφαλή, 3) Καμένη ασφάλεια ή κολλημένη αντλία SAI.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0420: {
    code: 'P0420',
    vagCode: '16804',
    title: 'Σύστημα Καταλύτη (Bank 1): Απόδοση Κάτω από το Όριο',
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    greekDescription: 'Ο καταλύτης δεν φιλτράρει επαρκώς τα καυσαέρια (ή φοράτε ελεύθερο Downpipe / Decat / 200 cpsi). Ο πίσω αισθητήρας λάμδα (B1S2) διαβάζει ίδιες διακυμάνσεις με τον μπροστινό.',
    severity: 'medium',
    system: 'Catalyst / EVAP',
  },
  P0441: {
    code: 'P0441',
    vagCode: '16825',
    title: 'Σύστημα Αναθυμιάσεων Ρεζερβουάρ (EVAP - N80): Εσφαλμένη Ροή Καθαρισμού',
    description: 'Evaporative Emission Control System Incorrect Purge Flow (N80)',
    greekDescription: 'Η ηλεκτροβαλβίδα αναθυμιάσεων βενζίνης N80 (πάνω από το κουτί του φίλτρου αέρα στον BFB) έχει κολλήσει ανοιχτή ή κλειστή. Προκαλεί αστάθεια στο ρελαντί και δυσκολία εκκίνησης μετά από ανεφοδιασμό.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P0444: {
    code: 'P0444',
    vagCode: '16828',
    title: 'Βαλβίδα Αναθυμιάσεων Καυσίμου (EVAP - N80): Ανοιχτό Κύκλωμα',
    description: 'Evaporative Emission Control System Purge Control Valve Circuit Open (N80)',
    greekDescription: 'Αποσυνδεδεμένη φίσα ή κομμένο καλώδιο στη βαλβίδα EVAP N80 πάνω από το φιλτροκούτι.',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },

  // --- Ταχύτητα Οχήματος, Ρελαντί & Τάση Τροφοδοσίας ECU ---
  P0501: {
    code: 'P0501',
    vagCode: '16885',
    title: 'Αισθητήρας Ταχύτητας Οχήματος (VSS): Μη Αληθοφανές Σήμα',
    description: 'Vehicle Speed Sensor Range/Performance',
    greekDescription: 'Η ECU δεν λαμβάνει σωστό σήμα ταχύτητας οχήματος (μέσω μονάδας ABS / καντράν).',
    severity: 'medium',
    system: 'Sensors',
  },
  P0506: {
    code: 'P0506',
    vagCode: '16890',
    title: 'Έλεγχος Στροφών Ρελαντί: Στροφές Κάτω από το Αναμενόμενο Όριο',
    description: 'Idle Control System RPM Lower Than Expected',
    greekDescription: 'Οι στροφές ρελαντί πέφτουν κάτω από το στόχο (~780 RPM). Καθαρίστε την πεταλούδα γκαζιού και ελέγξτε τη βαλβίδα PCV.',
    severity: 'medium',
    system: 'Ignition / Fuel',
  },
  P0507: {
    code: 'P0507',
    vagCode: '16891',
    title: 'Έλεγχος Στροφών Ρελαντί: Στροφές Υψηλότερες από το Αναμενόμενο Όριο',
    description: 'Idle Control System RPM Higher Than Expected',
    greekDescription: 'Το ρελαντί μένει ψηλά (>950-1100 RPM). Στον 1.8T BFB οφείλεται σχεδόν πάντα σε διαρροή αέρα μετά την πεταλούδα ή κολλημένη ανοιχτή βαλβίδα PCV (Bleeder Valve) κάτω από την πολλαπλή εισαγωγής.',
    severity: 'medium',
    system: 'Ignition / Fuel',
  },
  P0560: {
    code: 'P0560',
    vagCode: '16944',
    title: 'Τάση Τροφοδοσίας Συστήματος (ECU): Δυσλειτουργία',
    description: 'System Voltage Malfunction',
    greekDescription: 'Ασταθής τάση τροφοδοσίας στην ECU. Ελέγξτε τους πόλους της μπαταρίας, το δυναμό και το ρελέ τροφοδοσίας της ECU (J271).',
    severity: 'medium',
    system: 'Sensors',
  },
  P0562: {
    code: 'P0562',
    vagCode: '16946',
    title: 'Τάση Τροφοδοσίας ECU: Πολύ Χαμηλή Τάση (Low Voltage)',
    description: 'System Voltage Low',
    greekDescription: 'Η τάση μπαταρίας έπεσε κάτω από 10.5V (π.χ. κατά τη μίζα ή από πεσμένη μπαταρία). Αν αποσυνδέθηκε η μπαταρία, κάντε βασική ρύθμιση πεταλούδας (Group 060).',
    severity: 'low',
    system: 'Sensors',
  },
  P0563: {
    code: 'P0563',
    vagCode: '16947',
    title: 'Τάση Τροφοδοσίας ECU: Πολύ Υψηλή Τάση (Overvoltage)',
    description: 'System Voltage High',
    greekDescription: 'Ο ρυθμιστής τάσης του δυναμό υπερφορτίζει (>15.5V). Ελέγξτε άμεσα το δυναμό.',
    severity: 'high',
    system: 'Sensors',
  },

  // --- Εσωτερικά Σφάλματα ECU & Κύκλωμα Θερμοστάτη ---
  P0597: {
    code: 'P0597',
    vagCode: '17700',
    title: 'Ηλεκτρονικός Θερμοστάτης Ψύξης Κινητήρα (F265): Ανοιχτό Κύκλωμα',
    description: 'Map Controlled Engine Cooling Thermostat (F265): Open Circuit',
    greekDescription: 'Κλασική βλάβη του 1.8T BFB! Η ηλεκτρική αντίσταση μέσα στο κέλυφος του ηλεκτρονικού θερμοστάτη (F265) κάηκε ή βγήκε η φίσα του. Απαιτείται αντικατάσταση του θερμοστάτη.',
    severity: 'medium',
    system: 'Sensors',
  },
  P0601: {
    code: 'P0601',
    vagCode: '16985',
    title: 'Εσωτερικό Σφάλμα Μνήμης ECU (Internal Control Module Memory Check Sum Error)',
    description: 'Internal Control Module Memory Check Sum Error',
    greekDescription: 'Σφάλμα αθροίσματος ελέγχου (Checksum) στη μνήμη Flash της ECU Bosch ME7.5. Εμφανίζεται συχνά μετά από πρόγραμμα (remap/tuning) αν δεν διορθώθηκαν σωστά τα checksums.',
    severity: 'critical',
    system: 'Sensors',
  },
  P0606: {
    code: 'P0606',
    vagCode: '16990',
    title: 'Επεξεργαστής Μονάδας Ελέγχου ECU: Εσωτερική Δυσλειτουργία',
    description: 'ECM/PCM Processor Fault',
    greekDescription: 'Εσωτερικό σφάλμα επεξεργαστή στην ECU Bosch ME7.5. Ελέγξτε για υγρασία στο κουτί της ECU κάτω από το παρμπρίζ.',
    severity: 'critical',
    system: 'Sensors',
  },
  P0638: {
    code: 'P0638',
    vagCode: '17022',
    title: 'Μονάδα Ελέγχου Πεταλούδας (J338): Μη Αληθοφανές Σήμα',
    description: 'Throttle Actuator Control Range/Performance (Bank 1)',
    greekDescription: 'Το μοτέρ της ηλεκτρονικής πεταλούδας γκαζιού (J338) συναντά μηχανική αντίσταση ή δεν μπορεί να ολοκληρώσει τη βασική ρύθμιση.',
    severity: 'high',
    system: 'Sensors',
  },

  // --- Ειδικοί Εργοστασιακοί Κωδικοί VAG / Audi 1.8T 20V (P1xxx / P2xxx / P3xxx) ---
  P1116: {
    code: 'P1116',
    vagCode: '17524',
    title: 'Κύκλωμα Προθέρμανσης Αισθητήρα Λάμδα 1 (B1S1): Ανοιχτό Κύκλωμα',
    description: 'O2 Sensor Heater Circuit Bank 1 Sensor 1: Open',
    greekDescription: 'Διακοπή κυκλώματος στην προθέρμανση του μπροστινού αισθητήρα λάμδα (B1S1).',
    severity: 'medium',
    system: 'Sensors',
  },
  P1118: {
    code: 'P1118',
    vagCode: '17526',
    title: 'Κύκλωμα Προθέρμανσης Αισθητήρα Λάμδα 2 (B1S2): Ανοιχτό Κύκλωμα',
    description: 'O2 Sensor Heater Circuit Bank 1 Sensor 2: Open',
    greekDescription: 'Διακοπή κυκλώματος στην προθέρμανση του πίσω αισθητήρα λάμδα (B1S2 μετά τον καταλύτη).',
    severity: 'low',
    system: 'Catalyst / EVAP',
  },
  P1127: {
    code: 'P1127',
    vagCode: '17535',
    title: 'Προσαρμογή Μείγματος Υπό Φορτίο (Multiplicative): Σύστημα Πολύ Πλούσιο',
    description: 'Fuel Trim; Bank 1 (Mult): System too Rich',
    greekDescription: 'Το μείγμα υπό φορτίο/boost είναι υπερβολικά πλούσιο. Συνήθως υποδηλώνει διαρροή πίεσης turbo (Boost Leak) μετά τον MAF.',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
  P1128: {
    code: 'P1128',
    vagCode: '17536',
    title: 'Προσαρμογή Μείγματος Υπό Φορτίο (Multiplicative): Σύστημα Πολύ Φτωχό',
    description: 'Fuel Trim; Bank 1 (Mult): System too Lean',
    greekDescription: 'Το μείγμα υπό φορτίο είναι πολύ φτωχό. Ελέγξτε τον αισθητήρα MAF (G70) και την πίεση της αντλίας καυσίμου υπό πλήρες φορτίο.',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
  P1136: {
    code: 'P1136',
    vagCode: '17544',
    title: 'Προσαρμογή Μείγματος στο Ρελαντί (Additive): Σύστημα Πολύ Φτωχό',
    description: 'Fuel Trim: Bank 1 (Add): System too Lean',
    greekDescription: 'Πολύ συχνός κωδικός VAG στον 1.8T BFB! Το μείγμα είναι φτωχό μόνο στο ρελαντί (Additive Trim). Οφείλεται σε διαρροή υποπίεσης μετά την πεταλούδα (σκισμένη βαλβίδα PCV, σωλήνας αναθυμιάσεων ή Suction Jet Pump).',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
  P1137: {
    code: 'P1137',
    vagCode: '17545',
    title: 'Προσαρμογή Μείγματος στο Ρελαντί (Additive): Σύστημα Πολύ Πλούσιο',
    description: 'Fuel Trim: Bank 1 (Add): System too Rich',
    greekDescription: 'Το μείγμα στο ρελαντί είναι πολύ πλούσιο. Ελέγξτε για κολλημένη ανοιχτή βαλβίδα αναθυμιάσεων N80 (EVAP) ή μπεκ που στάζει.',
    severity: 'medium',
    system: 'Ignition / Fuel',
  },
  P1200: {
    code: 'P1200',
    vagCode: '17608',
    title: 'Βαλβίδα Ανακύκλωσης Turbo / Σκάστρα (N249): Μηχανική Βλάβη',
    description: 'Boost Pressure Control Valve (N249): Mechanical Malfunction',
    greekDescription: 'Κλασική βλάβη 1.8T BFB! Η μεμβράνη της σκάστρας (Diverter Valve 710N) έχει σκιστεί ή η ηλεκτροβαλβίδα N249 κάτω από την πολλαπλή εισαγωγής έχει διαρροή. Προκαλεί απώλεια πίεσης turbo και καθυστέρηση στο φούσκωμα (lag).',
    severity: 'medium',
    system: 'Turbo / Boost',
  },
  P1287: {
    code: 'P1287',
    vagCode: '17695',
    title: 'Ηλεκτροβαλβίδα Σκάστρας Turbo (N249): Ανοιχτό Κύκλωμα',
    description: 'Turbocharger Bypass Valve Control Circuit: Open (N249)',
    greekDescription: 'Αποσυνδεδεμένη φίσα ή κομμένο καλώδιο στην ηλεκτροβαλβίδα N249 (κάτω από την πολλαπλή εισαγωγής). Συμβαίνει επίσης αν έχει γίνει N249 Delete χωρίς αντίσταση.',
    severity: 'low',
    system: 'Turbo / Boost',
  },
  P1292: {
    code: 'P1292',
    vagCode: '17700',
    title: 'Ηλεκτρονικός Θερμοστάτης Ψύξης Κινητήρα (F265): Ανοιχτό Κύκλωμα',
    description: 'Map Controlled Engine Cooling Thermostat (F265): Open Circuit',
    greekDescription: 'Διακοπή κυκλώματος στην αντίσταση του ηλεκτρονικού θερμοστάτη F265. Πολύ συχνή αστοχία στον 1.8T BFB.',
    severity: 'medium',
    system: 'Sensors',
  },
  P1296: {
    code: 'P1296',
    vagCode: '17704',
    title: 'Δυσλειτουργία στο Σύστημα Ψύξης Κινητήρα (G62 / Θερμοστάτης)',
    description: 'Error in Mapped Cooling System (Check Coolant Sensor G62 and Thermostat)',
    greekDescription: 'Πολύ γνωστός κωδικός VAG 17704 στον 1.8T BFB! Υπάρχει ασυμφωνία μεταξύ του αισθητήρα θερμοκρασίας στην πίσω πλευρά της κεφαλής (G62) και του αισθητήρα στην έξοδο του ψυγείου (G83), ή κολλημένος θερμοστάτης.',
    severity: 'medium',
    system: 'Sensors',
  },
  P1297: {
    code: 'P1297',
    vagCode: '17705',
    title: 'Πτώση Πίεσης μεταξύ Τουρμπίνας και Πεταλούδας (Check D.V.!)',
    description: 'Pressure Drop between Turbo and Throttle Valve (check D.V.!)',
    greekDescription: 'Ο πιο διάσημος κωδικός του 1.8T 20V (VAG 17705)! Η ECU μετράει απώλεια αέρα/πίεσης ανάμεσα στην έξοδο της τουρμπίνας K03 και την πεταλούδα γκαζιού. Ελέγξτε: 1) Τη σκάστρα (Diverter Valve), 2) Τα κολάρα του intercooler, 3) Τη βαλβίδα PCV κάτω από την πολλαπλή εισαγωγής.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P1335: {
    code: 'P1335',
    vagCode: '17743',
    title: 'Υπέρβαση Ορίου Επιτήρησης Ροπής Κινητήρα 2 (Engine Torque Monitoring 2)',
    description: 'Engine Torque Monitoring 2: Control Limit Exceeded',
    greekDescription: 'Το υπολογιζόμενο φορτίο/ροπή ξεπέρασε το όριο ασφαλείας της ECU. Συνήθως οφείλεται σε μεγάλη διαρροή αέρα, ελαττωματικό MAF (G70) ή overboost.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P1340: {
    code: 'P1340',
    vagCode: '17748',
    title: 'Αισθητήρας Εκκεντροφόρου (G40) / Στροφάλου (G28): Εσφαλμένος Συσχετισμός Χρονισμού',
    description: 'Camshaft Position Sensor (G40) / Engine Speed Sensor (G28): Incorrect Allocation',
    greekDescription: 'Ο χρονισμός μεταξύ στροφάλου και εκκεντροφόρου είναι λάθος (π.χ. πήδηξε δόντι ο ιμάντας χρονισμού ή κόλλησε ο υδραυλικός μεταβλητός χρονισμός καδένας VVT N205). Ελέγξτε άμεσα τον χρονισμό!',
    severity: 'critical',
    system: 'Sensors',
  },
  P1355: {
    code: 'P1355',
    vagCode: '17763',
    title: 'Πολλαπλασιαστής Κυλίνδρου 1 (N70): Ανοιχτό Κύκλωμα Ενεργοποίησης',
    description: 'Cylinder 1 Ignition Circuit: Open Circuit',
    greekDescription: 'Βλάβη στο κύκλωμα οδήγησης του πολλαπλασιαστή 1 (N70). Ελέγξτε τον πολλαπλασιαστή 1 και την καλωδίωση πάνω στο καπάκι βαλβίδων.',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P1358: {
    code: 'P1358',
    vagCode: '17766',
    title: 'Πολλαπλασιαστής Κυλίνδρου 2 (N127): Ανοιχτό Κύκλωμα Ενεργοποίησης',
    description: 'Cylinder 2 Ignition Circuit: Open Circuit',
    greekDescription: 'Βλάβη στο κύκλωμα οδήγησης του πολλαπλασιαστή 2 (N127).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P1361: {
    code: 'P1361',
    vagCode: '17769',
    title: 'Πολλαπλασιαστής Κυλίνδρου 3 (N291): Ανοιχτό Κύκλωμα Ενεργοποίησης',
    description: 'Cylinder 3 Ignition Circuit: Open Circuit',
    greekDescription: 'Βλάβη στο κύκλωμα οδήγησης του πολλαπλασιαστή 3 (N291).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P1364: {
    code: 'P1364',
    vagCode: '17772',
    title: 'Πολλαπλασιαστής Κυλίνδρου 4 (N292): Ανοιχτό Κύκλωμα Ενεργοποίησης',
    description: 'Cylinder 4 Ignition Circuit: Open Circuit',
    greekDescription: 'Βλάβη στο κύκλωμα οδήγησης του πολλαπλασιαστή 4 (N292).',
    severity: 'critical',
    system: 'Ignition / Fuel',
  },
  P1519: {
    code: 'P1519',
    vagCode: '17927',
    title: 'Ρύθμιση Εκκεντροφόρου Εισαγωγής (VVT - Bank 1): Δυσλειτουργία',
    description: 'Camshaft Adjustment; Bank 1: Malfunction',
    greekDescription: 'Ο υδραυλικός τεντωτήρας καδένας εκκεντροφόρων (N205) στο πίσω μέρος της κεφαλής δεν ρυθμίζει σωστά. Μπορεί να οφείλεται σε χαμηλή πίεση λαδιού (βουλωμένη σίτα αντλίας λαδιού στο κάρτερ) ή χαλασμένο τεντωτήρα.',
    severity: 'high',
    system: 'Sensors',
  },
  P1522: {
    code: 'P1522',
    vagCode: '17930',
    title: 'Βαλβίδα Μεταβλητού Χρονισμού Εκκεντροφόρου (N205): Δυσλειτουργία',
    description: 'Camshaft Adjustment; Bank 1: Malfunction (N205)',
    greekDescription: 'Ηλεκτρική ή υδραυλική δυσλειτουργία στη βαλβίδα N205 του τεντωτήρα καδένας εκκεντροφόρων.',
    severity: 'high',
    system: 'Sensors',
  },
  P1545: {
    code: 'P1545',
    vagCode: '17953',
    title: 'Έλεγχος Πεταλούδας Γκαζιού (J338): Δυσλειτουργία',
    description: 'Throttle Valve Controller: Malfunction (J338)',
    greekDescription: 'Η ηλεκτρονική πεταλούδα γκαζιού έχασε τη βασική της ρύθμιση ή κόλλησε. Καθαρίστε την πεταλούδα και εκτελέστε προσαρμογή στο Group 060.',
    severity: 'high',
    system: 'Sensors',
  },
  P1555: {
    code: 'P1555',
    vagCode: '17963',
    title: 'Ξεπεράστηκε η Μέγιστη Πίεση Υπερπλήρωσης (Charge Pressure Upper Limit Exceeded)',
    description: 'Charge Pressure: Maximum Limit Exceeded',
    greekDescription: 'Η πίεση turbo ξεπέρασε το ανώτατο όριο ασφαλείας της ECU Bosch ME7.5. Ελέγξτε τη βαλβίδα N75, τα σωληνάκια της και το actuator της wastegate.',
    severity: 'critical',
    system: 'Turbo / Boost',
  },
  P1556: {
    code: 'P1556',
    vagCode: '17964',
    title: 'Ρύθμιση Πίεσης Turbo: Αρνητική Απόκλιση (Underboost - Κάτω από το Όριο)',
    description: 'Charge Pressure Control: Negative Deviation',
    greekDescription: 'Η τουρμπίνα δεν πιάνει τη ζητούμενη πίεση. Ελέγξτε για σκισμένο κολάρο turbo, χαλασμένη σκάστρα (DV), κολλημένη N75 ή ραγισμένη wastegate.',
    severity: 'high',
    system: 'Turbo / Boost',
  },
  P1557: {
    code: 'P1557',
    vagCode: '17965',
    title: 'Ρύθμιση Πίεσης Turbo: Θετική Απόκλιση (Overboost - Πάνω από το Όριο)',
    description: 'Charge Pressure Control: Positive Deviation',
    greekDescription: 'Η πραγματική πίεση turbo υπερβαίνει τη ζητούμενη για μεγάλο διάστημα και η ECU μπαίνει σε Limp Mode. Ελέγξτε τη βαλβίδα N75 και το actuator της wastegate.',
    severity: 'critical',
    system: 'Turbo / Boost',
  },
  P1570: {
    code: 'P1570',
    vagCode: '17978',
    title: 'Μονάδα Ελέγχου Κινητήρα (ECU) Κλειδωμένη από το Immobilizer',
    description: 'Engine Start Blocked by Immobilizer',
    greekDescription: 'Το Immobilizer (στο καντράν) μπλόκαρε την εκκίνηση της ECU. Ο κινητήρας παίρνει εμπρός για 1 δευτερόλεπτο και σβήνει.',
    severity: 'high',
    system: 'Sensors',
  },
  P1602: {
    code: 'P1602',
    vagCode: '18010',
    title: 'Τάση Τροφοδοσίας Ακροδέκτη 30 (Μπαταρία): Πολύ Χαμηλή Τάση',
    description: 'Power Supply Terminal 30: Voltage too Low',
    greekDescription: 'Η μπαταρία αποσυνδέθηκε ή έπεσε η τάση της. Είναι αποθηκευμένο ιστορικό σφάλμα—σβήστε το και ελέγξτε αν επανέλθει.',
    severity: 'low',
    system: 'Sensors',
  },
  P2187: {
    code: 'P2187',
    vagCode: '18619',
    title: 'Σύστημα Πολύ Φτωχό στο Ρελαντί (System Too Lean at Idle - Bank 1)',
    description: 'System Too Lean at Idle (Bank 1)',
    greekDescription: 'Διαρροή υποπίεσης στο ρελαντί (βαλβίδα PCV κάτω από την πολλαπλή εισαγωγής ή βαλβίδα αναθυμιάσεων).',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
  P2188: {
    code: 'P2188',
    vagCode: '18620',
    title: 'Σύστημα Πολύ Πλούσιο στο Ρελαντί (System Too Rich at Idle - Bank 1)',
    description: 'System Too Rich at Idle (Bank 1)',
    greekDescription: 'Υπερβολικά πλούσιο μείγμα στο ρελαντί. Ελέγξτε τη βαλβίδα EVAP (N80) και τον αισθητήρα θερμοκρασίας G62.',
    severity: 'high',
    system: 'Ignition / Fuel',
  },
};

/**
 * Μεταφράζει οποιονδήποτε κωδικό OBD-II (P, C, B, U) στα Ελληνικά,
 * ακόμα και αν δεν βρίσκεται στους προκαθορισμένους κωδικούς του λεξικού.
 */
export function lookupAndTranslateDtcToGreek(
  code: string,
  status: 'Active' | 'Pending' | 'Stored',
  rawHexFrame?: string
): DTCFault {
  const cleanCode = code.trim().toUpperCase();
  const known = VAG_GREEK_DTC_DICTIONARY[cleanCode];

  if (known) {
    return {
      ...known,
      status,
      rawHexFrame,
    };
  }

  // Έξυπνη ανάλυση SAE J2012 στα Ελληνικά για οποιονδήποτε άλλο κωδικό
  const prefix = cleanCode.charAt(0);
  const d1 = cleanCode.charAt(1);
  const d2 = cleanCode.charAt(2);

  let systemCategory: DTCFault['system'] = 'Sensors';
  let severity: DTCFault['severity'] = 'medium';
  let subsystemGreek = 'Ηλεκτρονικά Κινητήρα / Αισθητήρες';

  if (prefix === 'P') {
    if (d2 === '1' || d2 === '2') {
      systemCategory = cleanCode.startsWith('P023') || cleanCode.startsWith('P024') || cleanCode.startsWith('P029')
        ? 'Turbo / Boost'
        : 'Ignition / Fuel';
      subsystemGreek = systemCategory === 'Turbo / Boost'
        ? 'Σύστημα Υπερπλήρωσης Turbo & Πίεσης Εισαγωγής'
        : 'Σύστημα Μέτρησης Αέρα & Τροφοδοσίας Καυσίμου';
      severity = 'high';
    } else if (d2 === '3') {
      systemCategory = 'Ignition / Fuel';
      subsystemGreek = 'Σύστημα Ανάφλεξης / Διακοπές Καύσης (Misfire) / Αισθητήρες Κρούσης';
      severity = 'critical';
    } else if (d2 === '4') {
      systemCategory = 'Catalyst / EVAP';
      subsystemGreek = 'Σύστημα Ελέγχου Εκπομπών Καυσαερίων (Καταλύτης / EVAP / SAI)';
      severity = 'low';
    } else if (d2 === '5') {
      systemCategory = 'Sensors';
      subsystemGreek = 'Έλεγχος Ρελαντί, Ταχύτητας Οχήματος & Τάσης ECU';
      severity = 'medium';
    } else if (d2 === '6') {
      systemCategory = 'Sensors';
      subsystemGreek = 'Κύκλωμα Επεξεργαστή ECU Bosch ME7.5 & Έξοδοι Ελέγχου';
      severity = 'high';
    } else if (d2 === '7' || d2 === '8') {
      systemCategory = 'Sensors';
      subsystemGreek = 'Σύστημα Μετάδοσης Κίνησης / Κιβωτίου Ταχυτήτων';
      severity = 'medium';
    }
  } else if (prefix === 'C') {
    subsystemGreek = 'Σύστημα Πλαισίου / Φρένων ABS / ESP (Chassis)';
    systemCategory = 'Sensors';
  } else if (prefix === 'B') {
    subsystemGreek = 'Ηλεκτρικά Αμαξώματος / Καμπίνας / Αερόσακων (Body)';
    systemCategory = 'Sensors';
  } else if (prefix === 'U') {
    subsystemGreek = 'Δίκτυο Επικοινωνίας Μονάδων CAN-Bus / K-Line (Network)';
    systemCategory = 'Sensors';
  }

  const originGreek = d1 === '0' || d1 === '2'
    ? 'Πρότυπος Κωδικός OBD-II (ISO/SAE)'
    : 'Ειδικός Εργοστασιακός Κωδικός VAG / Audi';

  return {
    code: cleanCode,
    title: `${subsystemGreek} (${cleanCode})`,
    description: `${originGreek} - Subsystem: ${subsystemGreek} (${cleanCode})`,
    greekDescription: `${originGreek} στον τομέα: «${subsystemGreek}». Ο κωδικός ${cleanCode} αναφέρθηκε απευθείας από την ECU του οχήματος (${status === 'Active' ? 'Mode 03 - Ενεργή Βλάβη' : 'Mode 07 - Εκκρεμής Βλάβη'}). Ελέγξτε την καλωδίωση, τη φίσα και τις τιμές του αντίστοιχου αισθητήρα στα VAG Measuring Blocks.`,
    severity,
    system: systemCategory,
    status,
    rawHexFrame,
  };
}
