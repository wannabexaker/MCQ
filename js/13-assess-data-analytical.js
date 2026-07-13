/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · ANALYTICAL THINKING TEST DATA — 25 original items,
   5 areas × 5 difficulties. Raw correct count maps to one of 7
   named bands (Chaotic Thinker → Mastermind Intelligence).
   Trusted static content; text-only items (no SVG needed).
   ═══════════════════════════════════════════════════════════════ */

const ANALYTICAL_TEST_META = {
  id: "analytical",
  version: 1,
  areas: ["deduction", "patterns", "syllogisms", "critical", "puzzles"],
};

// Ordered by difficulty block (1→5); area order inside each block:
// deduction → patterns → syllogisms → critical → puzzles.
const ANALYTICAL_ITEMS = [
  // ════ Difficulty 1 ════
  {
    id: "an-dd-1", area: "deduction",
    text_en: "Maria is taller than Nikos. Nikos is taller than Petros. Who is the shortest?",
    text_el: "Η Μαρία είναι ψηλότερη από τον Νίκο. Ο Νίκος είναι ψηλότερος από τον Πέτρο. Ποιος είναι ο πιο κοντός;",
    choices_en: ["Maria", "Nikos", "Petros", "It cannot be determined"],
    choices_el: ["Η Μαρία", "Ο Νίκος", "Ο Πέτρος", "Δεν μπορεί να προσδιοριστεί"],
    correctIndex: 2,
  },
  {
    id: "an-pt-1", area: "patterns",
    text_en: "Which letter comes next? A, C, E, G, …",
    text_el: "Ποιο γράμμα ακολουθεί (λατινικό αλφάβητο); A, C, E, G, …",
    choices_en: ["H", "J", "I", "K"],
    choices_el: ["H", "J", "I", "K"],
    correctIndex: 2,
  },
  {
    id: "an-sy-1", area: "syllogisms",
    text_en: "All dolphins are mammals. All mammals breathe air. Which conclusion follows with certainty?",
    text_el: "Όλα τα δελφίνια είναι θηλαστικά. Όλα τα θηλαστικά αναπνέουν αέρα. Ποιο συμπέρασμα προκύπτει με βεβαιότητα;",
    choices_en: ["All dolphins breathe air", "Some dolphins do not breathe air", "All air-breathers are dolphins", "No conclusion follows"],
    choices_el: ["Όλα τα δελφίνια αναπνέουν αέρα", "Κάποια δελφίνια δεν αναπνέουν αέρα", "Ό,τι αναπνέει αέρα είναι δελφίνι", "Δεν προκύπτει συμπέρασμα"],
    correctIndex: 0,
  },
  {
    id: "an-cr-1", area: "critical",
    text_en: "Claim: “All students in the class passed the exam.” Which single finding would DISPROVE this claim?",
    text_el: "Ισχυρισμός: «Όλοι οι μαθητές της τάξης πέρασαν το διαγώνισμα.» Ποιο μεμονωμένο εύρημα θα ΔΙΕΨΕΥΔΕ τον ισχυρισμό;",
    choices_en: ["One student who passed", "One student who failed", "Most students passed", "The exam was easy"],
    choices_el: ["Ένας μαθητής που πέρασε", "Ένας μαθητής που κόπηκε", "Οι περισσότεροι μαθητές πέρασαν", "Το διαγώνισμα ήταν εύκολο"],
    correctIndex: 1,
  },
  {
    id: "an-pz-1", area: "puzzles",
    text_en: "A farmer has 17 sheep. All but 9 run away. How many sheep are left?",
    text_el: "Ένας βοσκός έχει 17 πρόβατα. Όλα εκτός από 9 το σκάνε. Πόσα πρόβατα τού μένουν;",
    choices_en: ["9", "8", "17", "0"],
    choices_el: ["9", "8", "17", "0"],
    correctIndex: 0,
  },

  // ════ Difficulty 2 ════
  {
    id: "an-dd-2", area: "deduction",
    text_en: "Anna sits directly to the left of Beth. Chris sits directly to the right of Beth. Who sits in the middle?",
    text_el: "Η Άννα κάθεται ακριβώς αριστερά από τη Βέτα. Ο Χρήστος κάθεται ακριβώς δεξιά από τη Βέτα. Ποιος κάθεται στη μέση;",
    choices_en: ["Anna", "Chris", "Beth", "It cannot be determined"],
    choices_el: ["Η Άννα", "Ο Χρήστος", "Η Βέτα", "Δεν μπορεί να προσδιοριστεί"],
    correctIndex: 2,
  },
  {
    id: "an-pt-2", area: "patterns",
    text_en: "What number comes next? 1, 4, 9, 16, …",
    text_el: "Ποιος αριθμός ακολουθεί; 1, 4, 9, 16, …",
    choices_en: ["20", "24", "36", "25"],
    choices_el: ["20", "24", "36", "25"],
    correctIndex: 3,
  },
  {
    id: "an-sy-2", area: "syllogisms",
    text_en: "All roses are flowers. Some flowers fade quickly. Which conclusion follows with certainty?",
    text_el: "Όλα τα τριαντάφυλλα είναι λουλούδια. Κάποια λουλούδια μαραίνονται γρήγορα. Ποιο συμπέρασμα προκύπτει με βεβαιότητα;",
    choices_en: ["Some roses fade quickly", "All roses fade quickly", "Roses are not flowers", "None of the above follows with certainty"],
    choices_el: ["Κάποια τριαντάφυλλα μαραίνονται γρήγορα", "Όλα τα τριαντάφυλλα μαραίνονται γρήγορα", "Τα τριαντάφυλλα δεν είναι λουλούδια", "Κανένα από τα παραπάνω δεν προκύπτει με βεβαιότητα"],
    correctIndex: 3,
  },
  {
    id: "an-cr-2", area: "critical",
    text_en: "An ad says: “9 out of 10 dentists who responded to our survey recommend this toothpaste.” What is the biggest weakness of this claim?",
    text_el: "Μια διαφήμιση λέει: «9 στους 10 οδοντιάτρους που απάντησαν στην έρευνά μας συστήνουν αυτή την οδοντόκρεμα.» Ποια είναι η μεγαλύτερη αδυναμία του ισχυρισμού;",
    choices_en: ["Dentists know nothing about toothpaste", "The respondents may not represent all dentists", "9 out of 10 is a small proportion", "Toothpaste cannot be recommended"],
    choices_el: ["Οι οδοντίατροι δεν ξέρουν από οδοντόκρεμες", "Όσοι απάντησαν ίσως δεν αντιπροσωπεύουν όλους τους οδοντιάτρους", "Το 9 στους 10 είναι μικρό ποσοστό", "Η οδοντόκρεμα δεν μπορεί να συστήνεται"],
    correctIndex: 1,
  },
  {
    id: "an-pz-2", area: "puzzles",
    text_en: "A bat and a ball cost €1.10 together. The bat costs €1.00 more than the ball. How much does the ball cost?",
    text_el: "Ένα ρόπαλο και ένα μπαλάκι κοστίζουν μαζί 1,10 €. Το ρόπαλο κοστίζει 1,00 € περισσότερο από το μπαλάκι. Πόσο κοστίζει το μπαλάκι;",
    choices_en: ["€0.10", "€0.05", "€0.15", "€1.00"],
    choices_el: ["0,10 €", "0,05 €", "0,15 €", "1,00 €"],
    correctIndex: 1,
  },

  // ════ Difficulty 3 ════
  {
    id: "an-dd-3", area: "deduction",
    text_en: "Four runners finish a race. Dora finishes before Elias but after Fotis. Giannis finishes last. Who wins the race?",
    text_el: "Τέσσερις δρομείς τερματίζουν. Η Δώρα τερματίζει πριν από τον Ηλία αλλά μετά τον Φώτη. Ο Γιάννης τερματίζει τελευταίος. Ποιος κερδίζει τον αγώνα;",
    choices_en: ["Dora", "Elias", "Giannis", "Fotis"],
    choices_el: ["Η Δώρα", "Ο Ηλίας", "Ο Γιάννης", "Ο Φώτης"],
    correctIndex: 3,
  },
  {
    id: "an-pt-3", area: "patterns",
    text_en: "Which letter comes next? Z, X, U, Q, …",
    text_el: "Ποιο γράμμα ακολουθεί (λατινικό αλφάβητο); Z, X, U, Q, …",
    choices_en: ["M", "L", "N", "K"],
    choices_el: ["M", "L", "N", "K"],
    correctIndex: 1,
  },
  {
    id: "an-sy-3", area: "syllogisms",
    text_en: "No reptiles are birds. All snakes are reptiles. Which conclusion follows with certainty?",
    text_el: "Κανένα ερπετό δεν είναι πουλί. Όλα τα φίδια είναι ερπετά. Ποιο συμπέρασμα προκύπτει με βεβαιότητα;",
    choices_en: ["Some snakes are birds", "All birds are snakes", "No conclusion follows", "No snakes are birds"],
    choices_el: ["Κάποια φίδια είναι πουλιά", "Όλα τα πουλιά είναι φίδια", "Δεν προκύπτει συμπέρασμα", "Κανένα φίδι δεν είναι πουλί"],
    correctIndex: 3,
  },
  {
    id: "an-cr-3", area: "critical",
    text_en: "After a city installed more streetlights, crime dropped. Which additional fact would MOST weaken the conclusion that the lights caused the drop?",
    text_el: "Μετά την τοποθέτηση περισσότερων φώτων στους δρόμους μιας πόλης, η εγκληματικότητα έπεσε. Ποιο επιπλέον στοιχείο θα ΑΠΟΔΥΝΑΜΩΝΕ περισσότερο το συμπέρασμα ότι τα φώτα προκάλεσαν την πτώση;",
    choices_en: ["The lights were LED", "Residents liked the new lights", "Most of the drop happened at night", "Crime fell equally in similar cities that added no lights"],
    choices_el: ["Τα φώτα ήταν LED", "Στους κατοίκους άρεσαν τα νέα φώτα", "Η μεγαλύτερη πτώση έγινε τη νύχτα", "Η εγκληματικότητα έπεσε εξίσου σε παρόμοιες πόλεις χωρίς νέα φώτα"],
    correctIndex: 3,
  },
  {
    id: "an-pz-3", area: "puzzles",
    text_en: "A patch of lily pads doubles in size every day. It covers the whole lake in 48 days. How many days does it take to cover half the lake?",
    text_el: "Μια συστάδα από νούφαρα διπλασιάζεται σε μέγεθος κάθε μέρα. Καλύπτει όλη τη λίμνη σε 48 ημέρες. Σε πόσες ημέρες καλύπτει τη μισή λίμνη;",
    choices_en: ["47", "24", "36", "12"],
    choices_el: ["47", "24", "36", "12"],
    correctIndex: 0,
  },

  // ════ Difficulty 4 ════
  {
    id: "an-dd-4", area: "deduction",
    text_en: "In a building, the red apartment is two floors above the blue one, and the green apartment is directly below the blue one. If the green apartment is on floor 1, on which floor is the red apartment?",
    text_el: "Σε μια πολυκατοικία, το κόκκινο διαμέρισμα είναι δύο ορόφους πάνω από το μπλε, και το πράσινο είναι ακριβώς κάτω από το μπλε. Αν το πράσινο είναι στον 1ο όροφο, σε ποιον όροφο είναι το κόκκινο;",
    choices_en: ["3", "4", "5", "2"],
    choices_el: ["3ο", "4ο", "5ο", "2ο"],
    correctIndex: 1,
  },
  {
    id: "an-pt-4", area: "patterns",
    text_en: "What comes next? 2A, 4C, 8E, 16G, …",
    text_el: "Τι ακολουθεί (λατινικό αλφάβητο); 2A, 4C, 8E, 16G, …",
    choices_en: ["32I", "24I", "32H", "20K"],
    choices_el: ["32I", "24I", "32H", "20K"],
    correctIndex: 0,
  },
  {
    id: "an-sy-4", area: "syllogisms",
    text_en: "Some engineers are musicians. All musicians are creative. Which conclusion follows with certainty?",
    text_el: "Κάποιοι μηχανικοί είναι μουσικοί. Όλοι οι μουσικοί είναι δημιουργικοί. Ποιο συμπέρασμα προκύπτει με βεβαιότητα;",
    choices_en: ["All engineers are creative", "Some engineers are creative", "No engineers are creative", "All creative people are musicians"],
    choices_el: ["Όλοι οι μηχανικοί είναι δημιουργικοί", "Κάποιοι μηχανικοί είναι δημιουργικοί", "Κανένας μηχανικός δεν είναι δημιουργικός", "Όλοι οι δημιουργικοί άνθρωποι είναι μουσικοί"],
    correctIndex: 1,
  },
  {
    id: "an-cr-4", area: "critical",
    text_en: "“If it rains, the match is cancelled. The match was cancelled.” What can we conclude about the rain?",
    text_el: "«Αν βρέξει, ο αγώνας αναβάλλεται. Ο αγώνας αναβλήθηκε.» Τι μπορούμε να συμπεράνουμε για τη βροχή;",
    choices_en: ["It rained", "It did not rain", "It may or may not have rained", "The match was replayed"],
    choices_el: ["Έβρεξε", "Δεν έβρεξε", "Μπορεί να έβρεξε, μπορεί και όχι", "Ο αγώνας επαναλήφθηκε"],
    correctIndex: 2,
  },
  {
    id: "an-pz-4", area: "puzzles",
    text_en: "Three boxes are labeled “Apples”, “Oranges” and “Mixed” — and ALL three labels are wrong. You may draw one fruit from one box. From which box should you draw to relabel all boxes correctly?",
    text_el: "Τρία κουτιά έχουν ετικέτες «Μήλα», «Πορτοκάλια» και «Ανάμεικτα» — και ΚΑΙ ΟΙ ΤΡΕΙΣ ετικέτες είναι λάθος. Μπορείς να τραβήξεις ένα φρούτο από ένα κουτί. Από ποιο κουτί πρέπει να τραβήξεις για να διορθώσεις όλες τις ετικέτες;",
    choices_en: ["The one labeled “Apples”", "The one labeled “Oranges”", "The one labeled “Mixed”", "It is impossible with one draw"],
    choices_el: ["Από αυτό με ετικέτα «Μήλα»", "Από αυτό με ετικέτα «Πορτοκάλια»", "Από αυτό με ετικέτα «Ανάμεικτα»", "Είναι αδύνατο με ένα τράβηγμα"],
    correctIndex: 2,
  },

  // ════ Difficulty 5 ════
  {
    id: "an-dd-5", area: "deduction",
    text_en: "Two islanders stand before you: A and B. Each is either a truth-teller (always tells the truth) or a liar (always lies). A says: “We are both liars.” What are A and B?",
    text_el: "Δύο νησιώτες στέκονται μπροστά σου: ο Α και ο Β. Καθένας είναι είτε φιλαλήθης (λέει πάντα αλήθεια) είτε ψεύτης (λέει πάντα ψέματα). Ο Α λέει: «Είμαστε και οι δύο ψεύτες.» Τι είναι ο Α και τι ο Β;",
    choices_en: ["A is a liar, B is a truth-teller", "A is a truth-teller, B is a liar", "Both are liars", "It cannot be determined"],
    choices_el: ["Ο Α είναι ψεύτης, ο Β φιλαλήθης", "Ο Α είναι φιλαλήθης, ο Β ψεύτης", "Και οι δύο είναι ψεύτες", "Δεν μπορεί να προσδιοριστεί"],
    correctIndex: 0,
  },
  {
    id: "an-pt-5", area: "patterns",
    text_en: "What number comes next? 3, 4, 8, 9, 13, 14, …",
    text_el: "Ποιος αριθμός ακολουθεί; 3, 4, 8, 9, 13, 14, …",
    choices_en: ["15", "18", "19", "17"],
    choices_el: ["15", "18", "19", "17"],
    correctIndex: 1,
  },
  {
    id: "an-sy-5", area: "syllogisms",
    text_en: "All bloops are gerts. No gerts are mibs. Some troks are mibs. Which conclusion follows with certainty?",
    text_el: "Όλα τα μπλουπ είναι γκερτ. Κανένα γκερτ δεν είναι μιμπ. Κάποια τροκ είναι μιμπ. Ποιο συμπέρασμα προκύπτει με βεβαιότητα;",
    choices_en: ["Some troks are not gerts", "Some troks are bloops", "All troks are mibs", "Some gerts are mibs"],
    choices_el: ["Κάποια τροκ δεν είναι γκερτ", "Κάποια τροκ είναι μπλουπ", "Όλα τα τροκ είναι μιμπ", "Κάποια γκερτ είναι μιμπ"],
    correctIndex: 0,
  },
  {
    id: "an-cr-5", area: "critical",
    text_en: "“Every time I wash my car, it rains afterwards. Therefore washing my car causes rain.” The error in this reasoning is best described as…",
    text_el: "«Κάθε φορά που πλένω το αυτοκίνητο, μετά βρέχει. Άρα το πλύσιμο του αυτοκινήτου προκαλεί βροχή.» Το σφάλμα σε αυτόν τον συλλογισμό περιγράφεται καλύτερα ως…",
    choices_en: ["Mistaking coincidence/correlation for causation", "A valid induction", "Circular reasoning", "A false dilemma"],
    choices_el: ["Σύγχυση σύμπτωσης/συσχέτισης με αιτιότητα", "Έγκυρη επαγωγή", "Κυκλικός συλλογισμός", "Ψευδές δίλημμα"],
    correctIndex: 0,
  },
  {
    id: "an-pz-5", area: "puzzles",
    text_en: "A clock shows 3:15. What is the angle between the hour hand and the minute hand?",
    text_el: "Ένα ρολόι δείχνει 3:15. Ποια είναι η γωνία ανάμεσα στον ωροδείκτη και τον λεπτοδείκτη;",
    choices_en: ["0°", "15°", "7.5°", "30°"],
    choices_el: ["0°", "15°", "7,5°", "30°"],
    correctIndex: 2,
  },
];

// ── Score bands (contiguous over raw 0..25) ─────────────────────
const ANALYTICAL_BANDS = [
  {
    min: 0, max: 4,
    name_en: "Chaotic Thinker", name_el: "Χαοτικός Στοχαστής",
    desc_en: "Answers came faster than analysis this time — intuition led, structure followed.",
    desc_el: "Οι απαντήσεις ήρθαν πιο γρήγορα από την ανάλυση αυτή τη φορά — οδήγησε η διαίσθηση, ακολούθησε η δομή.",
    meaning_en: "A score in this range usually reflects rushing or unfamiliarity with formal puzzle formats rather than ability. Almost every item type here (order chains, syllogisms, trap questions) becomes dramatically easier with one habit: restate the problem in your own words before answering.",
    meaning_el: "Ένα σκορ σε αυτό το εύρος συνήθως δείχνει βιασύνη ή έλλειψη εξοικείωσης με τα τυπικά φορμάτ γρίφων, όχι έλλειψη ικανότητας. Σχεδόν κάθε τύπος ερώτησης εδώ (αλυσίδες διάταξης, συλλογισμοί, ερωτήσεις-παγίδες) γίνεται θεαματικά ευκολότερος με μία συνήθεια: διατύπωσε ξανά το πρόβλημα με δικά σου λόγια πριν απαντήσεις.",
  },
  {
    min: 5, max: 8,
    name_en: "Impulsive Problem-Solver", name_el: "Παρορμητικός Λύτης Προβλημάτων",
    desc_en: "Quick to commit to the first plausible answer — right when the problem is simple, caught out by traps.",
    desc_el: "Δεσμεύεσαι γρήγορα στην πρώτη εύλογη απάντηση — πετυχαίνει στα απλά προβλήματα, εκτίθεται στις παγίδες.",
    meaning_en: "You likely solved the direct items but lost points on questions engineered to punish the 'obvious' answer (the €1.10 type). The fix is cheap: whenever an answer feels instant, spend ten seconds trying to disprove it before locking it in.",
    meaning_el: "Πιθανότατα έλυσες τις άμεσες ερωτήσεις αλλά έχασες πόντους σε όσες είναι φτιαγμένες να τιμωρούν την «προφανή» απάντηση (τύπου 1,10 €). Η διόρθωση είναι φθηνή: όποτε μια απάντηση έρχεται ακαριαία, ξόδεψε δέκα δευτερόλεπτα προσπαθώντας να τη διαψεύσεις πριν την κλειδώσεις.",
  },
  {
    min: 9, max: 12,
    name_en: "Unpredictable Thinker", name_el: "Απρόβλεπτος Στοχαστής",
    desc_en: "Flashes of sharp analysis mixed with avoidable slips — strong on some formats, loose on others.",
    desc_el: "Αναλαμπές οξείας ανάλυσης ανακατεμένες με αποφεύξιμα λάθη — δυνατός σε κάποια φορμάτ, χαλαρός σε άλλα.",
    meaning_en: "Mid-range scores almost always hide an uneven profile rather than uniform performance: check the per-area breakdown below. Turning your weakest area into an average one is the fastest total-score gain available to you.",
    meaning_el: "Τα μεσαία σκορ σχεδόν πάντα κρύβουν ανομοιογενές προφίλ, όχι ομοιόμορφη επίδοση: δες την ανάλυση ανά περιοχή παρακάτω. Το να ανεβάσεις την πιο αδύναμη περιοχή σου στον μέσο όρο είναι το γρηγορότερο συνολικό κέρδος που έχεις διαθέσιμο.",
  },
  {
    min: 13, max: 16,
    name_en: "Analytical Mind", name_el: "Αναλυτικό Μυαλό",
    desc_en: "Systematic and deliberate — you break problems into parts and the parts usually land.",
    desc_el: "Συστηματικός και μεθοδικός — σπας τα προβλήματα σε μέρη και τα μέρη συνήθως βγαίνουν σωστά.",
    meaning_en: "You cleared the majority of the test, including items that defeat purely intuitive answering. Errors at this level usually cluster in the two hardest difficulty tiers — the ones that need explicit case-by-case checking rather than a single insight.",
    meaning_el: "Πέρασες το μεγαλύτερο μέρος του τεστ, μαζί και ερωτήσεις που νικούν την καθαρά διαισθητική απάντηση. Τα λάθη σε αυτό το επίπεδο συνήθως μαζεύονται στις δύο δυσκολότερες βαθμίδες — αυτές που θέλουν ρητό έλεγχο περιπτώσεων και όχι μία «έκλαμψη».",
  },
  {
    min: 17, max: 20,
    name_en: "Strategic Thinker", name_el: "Στρατηγικός Στοχαστής",
    desc_en: "You plan the solution before executing it — traps rarely catch you, and structure comes naturally.",
    desc_el: "Σχεδιάζεις τη λύση πριν την εκτελέσεις — οι παγίδες σπάνια σε πιάνουν και η δομή σού έρχεται φυσικά.",
    meaning_en: "A score here means you handled deduction chains, formal syllogisms and trick questions with consistency — the profile of someone who separates 'what the problem says' from 'what it seems to say'. Only the most convoluted multi-step items stood between you and the top bands.",
    meaning_el: "Ένα σκορ εδώ σημαίνει ότι χειρίστηκες αλυσίδες συμπερασμών, τυπικούς συλλογισμούς και ερωτήσεις-παγίδες με συνέπεια — το προφίλ κάποιου που ξεχωρίζει το «τι λέει το πρόβλημα» από το «τι φαίνεται να λέει». Μόνο τα πιο περίπλοκα πολυβηματικά θέματα στάθηκαν ανάμεσα σε σένα και τις κορυφαίες μπάντες.",
  },
  {
    min: 21, max: 23,
    name_en: "Cold Logic Thinker", name_el: "Στοχαστής Ψυχρής Λογικής",
    desc_en: "Near-flawless formal reasoning — assumptions get checked, conclusions get earned.",
    desc_el: "Σχεδόν άψογος τυπικός συλλογισμός — οι υποθέσεις ελέγχονται, τα συμπεράσματα κερδίζονται.",
    meaning_en: "You missed at most a handful of the hardest items. At this level the difference from a perfect score is usually a single misread rather than a reasoning gap — your process (isolate, formalize, verify) is clearly working.",
    meaning_el: "Έχασες το πολύ μια χούφτα από τα δυσκολότερα θέματα. Σε αυτό το επίπεδο η διαφορά από το απόλυτο σκορ είναι συνήθως μία παρανάγνωση, όχι κενό συλλογιστικής — η διαδικασία σου (απομόνωσε, τυποποίησε, επιβεβαίωσε) δουλεύει καθαρά.",
  },
  {
    min: 24, max: 25,
    name_en: "Mastermind Intelligence", name_el: "Ιδιοφυής Νους",
    desc_en: "Effectively a perfect run — every format, every trap, every difficulty tier handled.",
    desc_el: "Ουσιαστικά τέλεια διαδρομή — κάθε φορμάτ, κάθε παγίδα, κάθε βαθμίδα δυσκολίας απαντήθηκε.",
    meaning_en: "24–25 out of 25 leaves nothing meaningful for this test to measure — you dismantled the trap questions, the abstract syllogisms and the multi-step puzzles alike. If you enjoy this, longer competition-grade puzzle sets are the natural next challenge.",
    meaning_el: "Το 24–25 στα 25 δεν αφήνει τίποτα ουσιαστικό να μετρήσει αυτό το τεστ — διέλυσες εξίσου τις ερωτήσεις-παγίδες, τους αφηρημένους συλλογισμούς και τους πολυβηματικούς γρίφους. Αν το απολαμβάνεις, τα μεγαλύτερα σετ γρίφων επιπέδου διαγωνισμών είναι η φυσική επόμενη πρόκληση.",
  },
];

// ── Per-area labels + notes ─────────────────────────────────────
const ANALYTICAL_AREA_INFO = {
  deduction: {
    label_en: "Deduction & ordering", label_el: "Συμπερασμοί & διάταξη",
    strong_en: "You track chains of relations (taller than, before, above) without losing links — the backbone of formal problem-solving.",
    strong_el: "Παρακολουθείς αλυσίδες σχέσεων (ψηλότερος, πριν, πάνω από) χωρίς να χάνεις κρίκους — η ραχοκοκαλιά της τυπικής επίλυσης προβλημάτων.",
    mid_en: "Mostly reliable on relation chains; the longer ones may need sketching the order on paper.",
    mid_el: "Σε γενικές γραμμές αξιόπιστος στις αλυσίδες σχέσεων· οι μεγαλύτερες ίσως θέλουν πρόχειρο σκίτσο της σειράς.",
    weak_en: "Relation chains tripped you up — next time, physically write the order (F > D > E, G last) instead of holding it in your head.",
    weak_el: "Οι αλυσίδες σχέσεων σε μπέρδεψαν — την επόμενη φορά γράψε τη σειρά (Φ > Δ > Η, Γ τελευταίος) αντί να την κρατάς στο μυαλό.",
  },
  patterns: {
    label_en: "Sequences & patterns", label_el: "Ακολουθίες & μοτίβα",
    strong_en: "You spot generating rules quickly, even when two rules alternate — pattern recognition is a genuine asset here.",
    strong_el: "Εντοπίζεις γρήγορα τους κανόνες παραγωγής, ακόμα κι όταν εναλλάσσονται δύο κανόνες — η αναγνώριση μοτίβων είναι πραγματικό ατού.",
    mid_en: "Standard progressions are comfortable; alternating or combined rules occasionally slip through.",
    mid_el: "Οι τυπικές πρόοδοι είναι άνετες· οι εναλλασσόμενοι ή συνδυασμένοι κανόνες πού και πού ξεφεύγουν.",
    weak_en: "Sequences cost you points — write the differences (or ratios) between consecutive terms; the hidden rule is usually sitting right there.",
    weak_el: "Οι ακολουθίες σού κόστισαν πόντους — γράψε τις διαφορές (ή τους λόγους) διαδοχικών όρων· ο κρυμμένος κανόνας συνήθως κάθεται ακριβώς εκεί.",
  },
  syllogisms: {
    label_en: "Syllogisms", label_el: "Συλλογισμοί",
    strong_en: "You separate what MUST follow from what merely COULD — including resisting the classic 'some overlap' illusion.",
    strong_el: "Ξεχωρίζεις τι ΠΡΕΠΕΙ να ισχύει από ό,τι απλώς ΘΑ ΜΠΟΡΟΥΣΕ — αντιστεκόμενος και στην κλασική ψευδαίσθηση της «κάποιας επικάλυψης».",
    mid_en: "Sound on clean syllogisms; the 'none of these follows' options deserve extra suspicion from you.",
    mid_el: "Σταθερός στους καθαρούς συλλογισμούς· οι επιλογές «τίποτα δεν προκύπτει» αξίζουν λίγη παραπάνω καχυποψία από σένα.",
    weak_en: "Syllogisms were your leak — try drawing the sets as circles (Euler diagrams); 'all/some/none' questions become visual and nearly foolproof.",
    weak_el: "Οι συλλογισμοί ήταν η διαρροή σου — δοκίμασε να ζωγραφίζεις τα σύνολα ως κύκλους (διαγράμματα Euler)· τα «όλα/κάποια/κανένα» γίνονται οπτικά και σχεδόν αλάνθαστα.",
  },
  critical: {
    label_en: "Critical thinking", label_el: "Κριτική σκέψη",
    strong_en: "You evaluate claims by asking what evidence would break them — spotting selection bias and correlation-vs-causation traps.",
    strong_el: "Αξιολογείς τους ισχυρισμούς ρωτώντας ποιο στοιχείο θα τους διέλυε — εντοπίζοντας μεροληψία επιλογής και παγίδες συσχέτισης-αιτιότητας.",
    mid_en: "Good instincts on weak arguments; formal fallacy names (affirming the consequent etc.) would sharpen the edges.",
    mid_el: "Καλά ένστικτα απέναντι στα αδύναμα επιχειρήματα· τα ονόματα των τυπικών σφαλμάτων (κατάφαση του επομένου κ.λπ.) θα ακόνιζαν τις άκρες.",
    weak_en: "Argument-evaluation items cost you — the recurring question to ask is 'what OTHER explanation fits the same facts?'",
    weak_el: "Οι ερωτήσεις αξιολόγησης επιχειρημάτων σε ζημίωσαν — η ερώτηση-κλειδί είναι πάντα «ποια ΑΛΛΗ εξήγηση χωράει στα ίδια δεδομένα;»",
  },
  puzzles: {
    label_en: "Logic puzzles & traps", label_el: "Γρίφοι & παγίδες λογικής",
    strong_en: "The engineered traps (bat-and-ball, lily pads) did not fool you — you verify the tempting answer before trusting it.",
    strong_el: "Οι κατασκευασμένες παγίδες (ρόπαλο-μπαλάκι, νούφαρα) δεν σε ξεγέλασαν — επαληθεύεις τη δελεαστική απάντηση πριν την εμπιστευτείς.",
    mid_en: "You caught some traps and fell for others — the tell is an answer that arrives instantly and feels obvious.",
    mid_el: "Έπιασες κάποιες παγίδες και πάτησες σε άλλες — το σημάδι είναι μια απάντηση που έρχεται ακαριαία και μοιάζει προφανής.",
    weak_en: "The trap items got you — treat any instantly 'obvious' answer as a hypothesis to test, not a result. Plug it back into the problem and check.",
    weak_el: "Οι παγίδες σε τσάκωσαν — αντιμετώπισε κάθε «προφανή» ακαριαία απάντηση ως υπόθεση προς έλεγχο, όχι ως αποτέλεσμα. Βάλ' τη πίσω στο πρόβλημα και επιβεβαίωσε.",
  },
};
