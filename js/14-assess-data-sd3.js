/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · DARK TRIAD (SD-3 STYLE) DATA — 27 original items,
   9 per trait (N narcissism · M Machiavellianism · P psychopathy),
   answered on a 1–5 agree/disagree scale. No right or wrong
   answers. 3 of the 9 items per trait are reverse-keyed (more
   than the published SD3's 2/0/2) so that straight-lining
   "agree with everything" cannot max out any trait. Items are
   original neutral paraphrases in the SD3 style — the published
   scale text is NOT reproduced. Format follows the Short Dark
   Triad (SD3), Jones & Paulhus (2014).
   ═══════════════════════════════════════════════════════════════ */

const SD3_TEST_META = {
  id: "sd3",
  version: 1,
  traits: ["N", "M", "P"],
};

const SD3_LIKERT = {
  labels_en: ["Disagree strongly", "Disagree", "Neutral", "Agree", "Agree strongly"],
  labels_el: ["Διαφωνώ απόλυτα", "Διαφωνώ", "Ουδέτερα", "Συμφωνώ", "Συμφωνώ απόλυτα"],
};

// Presentation order interleaves the three traits (N, M, P, N, M, P, …).
const SD3_ITEMS = [
  { id: "sd3-n1", trait: "N", reverse: false,
    text_en: "I naturally take charge when I am part of a group.",
    text_el: "Όταν είμαι σε μια ομάδα, συνήθως αναλαμβάνω εγώ τον έλεγχο." },
  { id: "sd3-m1", trait: "M", reverse: false,
    text_en: "I only reveal my plans when it benefits me.",
    text_el: "Αποκαλύπτω τα σχέδιά μου μόνο όταν με συμφέρει." },
  { id: "sd3-p1", trait: "P", reverse: false,
    text_en: "I say what I think even when it hurts people.",
    text_el: "Λέω αυτό που σκέφτομαι, ακόμα κι αν πληγώνει τους άλλους." },

  { id: "sd3-n2", trait: "N", reverse: true,
    text_en: "I prefer to blend into the crowd rather than stand out.",
    text_el: "Προτιμώ να χάνομαι μέσα στο πλήθος παρά να ξεχωρίζω." },
  { id: "sd3-m2", trait: "M", reverse: true,
    text_en: "Flattery feels dishonest to me, even when it could get me what I want.",
    text_el: "Η κολακεία μού φαίνεται ανέντιμη, ακόμα κι αν θα μπορούσε να μου δώσει αυτό που θέλω." },
  { id: "sd3-p2", trait: "P", reverse: false,
    text_en: "I enjoy risks that would scare most people.",
    text_el: "Απολαμβάνω ρίσκα που θα τρόμαζαν τους περισσότερους." },

  { id: "sd3-n3", trait: "N", reverse: false,
    text_en: "I know I have qualities that most people lack.",
    text_el: "Ξέρω ότι έχω χαρίσματα που λείπουν από τους περισσότερους." },
  { id: "sd3-m3", trait: "M", reverse: true,
    text_en: "I openly share what I know, even when keeping it to myself would benefit me.",
    text_el: "Μοιράζομαι ανοιχτά ό,τι ξέρω, ακόμα κι όταν θα με συνέφερε να το κρατήσω για τον εαυτό μου." },
  { id: "sd3-p3", trait: "P", reverse: false,
    text_en: "When someone crosses me, I hit back fast.",
    text_el: "Όταν κάποιος με αδικήσει, ανταποδίδω γρήγορα." },

  { id: "sd3-n4", trait: "N", reverse: false,
    text_en: "I deserve more recognition than I usually get.",
    text_el: "Αξίζω περισσότερη αναγνώριση από όση συνήθως παίρνω." },
  { id: "sd3-m4", trait: "M", reverse: false,
    text_en: "Most people can be steered if you find the right approach.",
    text_el: "Τους περισσότερους ανθρώπους μπορείς να τους κατευθύνεις αν βρεις τη σωστή προσέγγιση." },
  { id: "sd3-p4", trait: "P", reverse: true,
    text_en: "I feel guilty for a long time after upsetting someone.",
    text_el: "Όταν στενοχωρήσω κάποιον, νιώθω τύψεις για πολλή ώρα μετά." },

  { id: "sd3-n5", trait: "N", reverse: false,
    text_en: "I enjoy being the person others talk about.",
    text_el: "Μου αρέσει να είμαι το πρόσωπο για το οποίο μιλούν οι άλλοι." },
  { id: "sd3-m5", trait: "M", reverse: false,
    text_en: "I avoid open conflict with people who may be useful to me later.",
    text_el: "Αποφεύγω την ανοιχτή σύγκρουση με ανθρώπους που ίσως μου φανούν χρήσιμοι αργότερα." },
  { id: "sd3-p5", trait: "P", reverse: false,
    text_en: "I get bored quickly and constantly need excitement.",
    text_el: "Βαριέμαι εύκολα και χρειάζομαι συνεχώς κάτι συναρπαστικό να συμβαίνει." },

  { id: "sd3-n6", trait: "N", reverse: true,
    text_en: "Compliments make me feel awkward.",
    text_el: "Τα κομπλιμέντα με κάνουν να νιώθω αμήχανα." },
  { id: "sd3-m6", trait: "M", reverse: false,
    text_en: "It is wise to remember the favors people owe you.",
    text_el: "Είναι έξυπνο να θυμάσαι ποιοι σου χρωστούν χάρη." },
  { id: "sd3-p6", trait: "P", reverse: true,
    text_en: "I avoid dangerous situations whenever I can.",
    text_el: "Αποφεύγω τις επικίνδυνες καταστάσεις όποτε μπορώ." },

  { id: "sd3-n7", trait: "N", reverse: false,
    text_en: "Great things are expected of me — and I expect them too.",
    text_el: "Περιμένουν σπουδαία πράγματα από εμένα — και τα περιμένω κι εγώ." },
  { id: "sd3-m7", trait: "M", reverse: true,
    text_en: "I trust people easily, without wondering what they might want from me.",
    text_el: "Εμπιστεύομαι εύκολα τους ανθρώπους, χωρίς να σκέφτομαι τι μπορεί να θέλουν από εμένα." },
  { id: "sd3-p7", trait: "P", reverse: false,
    text_en: "I have done impulsive things that others would call reckless.",
    text_el: "Έχω κάνει παρορμητικά πράγματα που άλλοι θα χαρακτήριζαν απερίσκεπτα." },

  { id: "sd3-n8", trait: "N", reverse: false,
    text_en: "Being admired by others gives me energy.",
    text_el: "Ο θαυμασμός των άλλων μού δίνει ενέργεια." },
  { id: "sd3-m8", trait: "M", reverse: false,
    text_en: "I would rather plan for the long term than chase quick wins.",
    text_el: "Προτιμώ να σχεδιάζω μακροπρόθεσμα παρά να κυνηγάω γρήγορα κέρδη." },
  { id: "sd3-p8", trait: "P", reverse: true,
    text_en: "I have never gotten into trouble at school, at work, or with the law.",
    text_el: "Δεν έχω μπλέξει ποτέ σε προβλήματα με το σχολείο, τη δουλειά ή τον νόμο." },

  { id: "sd3-n9", trait: "N", reverse: true,
    text_en: "Other people's opinions count just as much as mine.",
    text_el: "Οι γνώμες των άλλων μετράνε το ίδιο με τη δική μου." },
  { id: "sd3-m9", trait: "M", reverse: false,
    text_en: "Telling people what they want to hear is often the smartest move.",
    text_el: "Το να λες στους άλλους αυτό που θέλουν να ακούσουν είναι συχνά η εξυπνότερη κίνηση." },
  { id: "sd3-p9", trait: "P", reverse: false,
    text_en: "Other people's problems are their business, not mine.",
    text_el: "Τα προβλήματα των άλλων είναι δική τους δουλειά, όχι δική μου." },
];

// ── Trait descriptions + high/low interpretation texts ──────────
const SD3_TRAIT_INFO = {
  N: {
    label_en: "Narcissism", label_el: "Ναρκισσισμός",
    short_en: "Narcissism", short_el: "Ναρκισσισμός",
    desc_en: "Confidence, need for admiration, the sense of being someone special.",
    desc_el: "Αυτοπεποίθηση, ανάγκη για θαυμασμό, η αίσθηση ότι είσαι κάποιος ξεχωριστός.",
    high_en: "You scored above the typical range: comfortable in the spotlight, energized by recognition, and confident your contribution matters. The upside is presence and drive; the watch-out is discounting feedback that doesn't flatter.",
    high_el: "Σκόραρες πάνω από το τυπικό εύρος: άνετα στο προσκήνιο, με ενέργεια από την αναγνώριση και σιγουριά ότι η συνεισφορά σου μετράει. Το συν είναι η παρουσία και η ορμή· η προσοχή χρειάζεται στο να μην προσπερνάς την ανατροφοδότηση που δεν κολακεύει.",
    low_en: "You scored in or below the typical range: the spotlight is optional for you, and your self-worth doesn't hang on applause. That usually reads as groundedness — collaborators tend to trust it.",
    low_el: "Σκόραρες μέσα ή κάτω από το τυπικό εύρος: το προσκήνιο είναι προαιρετικό για σένα και η αυτοεκτίμησή σου δεν κρέμεται από το χειροκρότημα. Αυτό συνήθως διαβάζεται ως προσγειωμένη στάση — οι συνεργάτες τείνουν να την εμπιστεύονται.",
  },
  M: {
    label_en: "Machiavellianism", label_el: "Μακιαβελισμός",
    short_en: "Machiavellianism", short_el: "Μακιαβελισμός",
    desc_en: "Strategic thinking about people: reading motives, guarding information, playing the long game.",
    desc_el: "Στρατηγική σκέψη γύρω από τους ανθρώπους: ανάγνωση κινήτρων, φύλαξη πληροφοριών, μακροπρόθεσμο παιχνίδι.",
    high_en: "You scored above the typical range: you read rooms, plan several moves ahead, and share information deliberately. That's a real asset in negotiation and politics-heavy environments; the cost can be that people sense the calculation.",
    high_el: "Σκόραρες πάνω από το τυπικό εύρος: διαβάζεις τον χώρο, σχεδιάζεις αρκετές κινήσεις μπροστά και μοιράζεσαι πληροφορίες επιλεκτικά. Πραγματικό ατού σε διαπραγματεύσεις και «πολιτικά» περιβάλλοντα· το κόστος είναι ότι κάποιοι ίσως διαισθάνονται τον υπολογισμό.",
    low_en: "You scored in or below the typical range: you deal with people straightforwardly rather than strategically. It costs you some leverage in political games — and buys you relationships that don't need managing.",
    low_el: "Σκόραρες μέσα ή κάτω από το τυπικό εύρος: αντιμετωπίζεις τους ανθρώπους ευθέως και όχι στρατηγικά. Χάνεις κάποιο πλεονέκτημα στα πολιτικά παιχνίδια — και κερδίζεις σχέσεις που δεν χρειάζονται διαχείριση.",
  },
  P: {
    label_en: "Psychopathy (trait)", label_el: "Ψυχοπάθεια (χαρακτηριστικό)",
    short_en: "Psychopathy", short_el: "Ψυχοπάθεια",
    desc_en: "As a personality dimension: impulsivity, appetite for risk, bluntness, low anxiety — NOT a diagnosis.",
    desc_el: "Ως διάσταση προσωπικότητας: παρορμητικότητα, όρεξη για ρίσκο, ευθύτητα, χαμηλό άγχος — ΟΧΙ διάγνωση.",
    high_en: "You scored above the typical range: high tolerance for risk, quick reactions, little rumination afterwards. In crisis moments that profile can be genuinely useful; in everyday cooperation it can read as harshness — worth knowing which mode you're in.",
    high_el: "Σκόραρες πάνω από το τυπικό εύρος: υψηλή ανοχή στο ρίσκο, γρήγορα αντανακλαστικά, ελάχιστη αναμάσηση εκ των υστέρων. Σε στιγμές κρίσης αυτό το προφίλ είναι πραγματικά χρήσιμο· στην καθημερινή συνεργασία μπορεί να διαβαστεί ως σκληρότητα — αξίζει να ξέρεις σε ποια λειτουργία βρίσκεσαι.",
    low_en: "You scored in or below the typical range: you weigh consequences, feel the brakes before risky moves, and register how your words land on others. Less adrenaline, fewer regrets.",
    low_el: "Σκόραρες μέσα ή κάτω από το τυπικό εύρος: ζυγίζεις τις συνέπειες, νιώθεις το φρένο πριν από ριψοκίνδυνες κινήσεις και καταγράφεις πώς «κάθονται» τα λόγια σου στους άλλους. Λιγότερη αδρεναλίνη, λιγότερες μεταμέλειες.",
  },
};

// ── Archetypes, keyed by high-flag bits in N-M-P order ──────────
const SD3_ARCHETYPES = {
  "000": {
    name_en: "The Empath", name_el: "Ο Ενσυναισθητικός",
    desc_en: "All three dark traits below the typical range. You lead with sincerity and steadiness — people around you relax because nothing is being played.",
    desc_el: "Και τα τρία «σκοτεινά» χαρακτηριστικά κάτω από το τυπικό εύρος. Προηγείται η ειλικρίνεια και η σταθερότητα — οι γύρω σου χαλαρώνουν γιατί δεν παίζεται κανένα παιχνίδι.",
    cognition_en: "This profile usually pairs with careful, reflective test-taking: steady accuracy over speed, and honest 'I don't know' skips instead of guesses.",
    cognition_el: "Αυτό το προφίλ συνήθως συνδυάζεται με προσεκτική, στοχαστική συμπλήρωση τεστ: σταθερή ακρίβεια αντί για ταχύτητα, και ειλικρινή «δεν ξέρω» αντί για μαντεψιές.",
    examples_en: "Samwise Gamgee (The Lord of the Rings), Ted Lasso (Ted Lasso)",
    examples_el: "Σαμ Γκάμτζι (Ο Άρχοντας των Δαχτυλιδιών), Τεντ Λάσο (Ted Lasso)",
  },
  "100": {
    name_en: "The Visionary", name_el: "Ο Οραματιστής",
    desc_en: "High narcissism, low manipulation, low impulsivity. Big self-belief in service of big pictures — you sell the future because you genuinely see yourself in it.",
    desc_el: "Υψηλός ναρκισσισμός, χαμηλή χειραγώγηση, χαμηλή παρορμητικότητα. Μεγάλη αυτοπεποίθηση στην υπηρεσία μεγάλων στόχων — «πουλάς» το μέλλον επειδή πραγματικά βλέπεις τον εαυτό σου μέσα του.",
    cognition_en: "Confidence helps on hard cognitive items — visionaries attempt everything. The failure mode is overclaiming: trick questions punish answers that merely feel right.",
    cognition_el: "Η αυτοπεποίθηση βοηθά στις δύσκολες γνωστικές ερωτήσεις — οι οραματιστές τα επιχειρούν όλα. Η παγίδα είναι η υπερβεβαιότητα: οι ερωτήσεις-παγίδες τιμωρούν απαντήσεις που απλώς «φαίνονται» σωστές.",
    examples_en: "Tony Stark (Iron Man), Emperor Kuzco (The Emperor's New Groove)",
    examples_el: "Τόνι Σταρκ (Iron Man), Αυτοκράτορας Κούζκο (Ο Αυτοκράτορας και τα Καμώματά του)",
  },
  "010": {
    name_en: "The Strategist", name_el: "Ο Στρατηγός",
    desc_en: "High Machiavellianism, modest ego, controlled impulses. You map motives, hold information close, and win positions without needing applause for it.",
    desc_el: "Υψηλός μακιαβελισμός, μετρημένο εγώ, ελεγχόμενες παρορμήσεις. Χαρτογραφείς κίνητρα, κρατάς κλειστά τα χαρτιά σου και κερδίζεις θέσεις χωρίς να χρειάζεσαι χειροκρότημα.",
    cognition_en: "This profile tends to align with deliberate, trap-resistant reasoning — strategists usually shine on critical-thinking and 'what really follows?' items.",
    cognition_el: "Το προφίλ αυτό τείνει να συμβαδίζει με μεθοδική, ανθεκτική στις παγίδες σκέψη — οι στρατηγοί συνήθως λάμπουν στην κριτική σκέψη και στα «τι πραγματικά προκύπτει;».",
    examples_en: "Odysseus (The Odyssey), Varys (Game of Thrones)",
    examples_el: "Οδυσσέας (Οδύσσεια), Βάρυς (Game of Thrones)",
  },
  "001": {
    name_en: "The Daredevil", name_el: "Ο Ριψοκίνδυνος",
    desc_en: "High trait psychopathy alone: appetite for risk, blunt speech, zero patience for hand-wringing. You move first and apologize rarely — but you're not scheming and not posing.",
    desc_el: "Υψηλή μόνο η ψυχοπάθεια ως χαρακτηριστικό: όρεξη για ρίσκο, ωμός λόγος, μηδενική υπομονή για δισταγμούς. Κινείσαι πρώτος και ζητάς σπάνια συγγνώμη — αλλά ούτε μηχανορραφείς ούτε ποζάρεις.",
    cognition_en: "Speed over checking: impulsivity is exactly what trap items exploit. Daredevils gain the most points of any profile just by re-reading the question once before answering.",
    cognition_el: "Ταχύτητα αντί για έλεγχο: η παρορμητικότητα είναι ακριβώς αυτό που εκμεταλλεύονται οι ερωτήσεις-παγίδες. Οι ριψοκίνδυνοι κερδίζουν τους περισσότερους πόντους από κάθε προφίλ απλώς ξαναδιαβάζοντας την ερώτηση μία φορά πριν απαντήσουν.",
    examples_en: "Wolverine (X-Men), Harley Quinn (DC)",
    examples_el: "Γούλβεριν (X-Men), Χάρλεϊ Κουίν (DC)",
  },
  "110": {
    name_en: "The Operator", name_el: "Ο Χειριστής",
    desc_en: "High narcissism plus high Machiavellianism, with impulses firmly under control. Charisma in front, calculation behind — you manage rooms, images and outcomes simultaneously.",
    desc_el: "Υψηλός ναρκισσισμός συν υψηλός μακιαβελισμός, με τις παρορμήσεις σταθερά υπό έλεγχο. Χάρισμα μπροστά, υπολογισμός από πίσω — διαχειρίζεσαι ταυτόχρονα χώρο, εικόνα και αποτελέσματα.",
    cognition_en: "Operators combine the strategist's deliberation with the visionary's reach: strong on verbal and social-judgment material, with confidence calibrated just enough to stay dangerous.",
    cognition_el: "Οι χειριστές συνδυάζουν τη μεθοδικότητα του στρατηγού με την εμβέλεια του οραματιστή: δυνατοί στο λεκτικό και το κοινωνικό υλικό, με την αυτοπεποίθηση ρυθμισμένη ίσα-ίσα ώστε να παραμένει επικίνδυνη.",
    examples_en: "Miranda Priestly (The Devil Wears Prada), Don Draper (Mad Men)",
    examples_el: "Μιράντα Πρίσλι (Ο Διάβολος Φοράει Prada), Ντον Ντρέιπερ (Mad Men)",
  },
  "101": {
    name_en: "The Maverick", name_el: "Ο Ατίθασος",
    desc_en: "High narcissism plus high impulsivity, without the schemer's patience. You want the spotlight AND the adrenaline — spectacular when it works, loud when it doesn't.",
    desc_el: "Υψηλός ναρκισσισμός συν υψηλή παρορμητικότητα, χωρίς την υπομονή του στρατηγού. Θέλεις και το προσκήνιο ΚΑΙ την αδρεναλίνη — θεαματικό όταν πετυχαίνει, θορυβώδες όταν όχι.",
    cognition_en: "High confidence with low patience produces excellent flashes and uneven totals: hard items get bold correct leaps, easy items get careless slips.",
    cognition_el: "Η υψηλή αυτοπεποίθηση με χαμηλή υπομονή δίνει εξαιρετικές αναλαμπές και άνισα σύνολα: οι δύσκολες ερωτήσεις παίρνουν τολμηρά σωστά άλματα, οι εύκολες χάνονται από απροσεξία.",
    examples_en: "Thor (early Thor films), Jack Sparrow (Pirates of the Caribbean)",
    examples_el: "Θορ (πρώτες ταινίες Thor), Τζακ Σπάροου (Οι Πειρατές της Καραϊβικής)",
  },
  "011": {
    name_en: "The Puppet Master", name_el: "Ο Μαριονετίστας",
    desc_en: "High Machiavellianism plus high trait psychopathy, minus the need for applause. Cold reading of people, no stage fright, no remorse tax — influence exercised from the shadows.",
    desc_el: "Υψηλός μακιαβελισμός συν υψηλή ψυχοπάθεια ως χαρακτηριστικό, χωρίς ανάγκη για χειροκρότημα. Ψυχρή ανάγνωση ανθρώπων, καθόλου τρακ, κανένας «φόρος» τύψεων — επιρροή που ασκείται από τη σκιά.",
    cognition_en: "Detachment often means strong formal logic — emotions rarely contaminate the analysis. Judgment items that hinge on how people feel are the blind spot.",
    cognition_el: "Η αποστασιοποίηση συχνά σημαίνει δυνατή τυπική λογική — τα συναισθήματα σπάνια «μολύνουν» την ανάλυση. Το τυφλό σημείο είναι οι κρίσεις που εξαρτώνται από το πώς νιώθουν οι άνθρωποι.",
    examples_en: "Iago (Othello), Emperor Palpatine (Star Wars)",
    examples_el: "Ιάγος (Οθέλλος), Αυτοκράτορας Πάλπατιν (Star Wars)",
  },
  "111": {
    name_en: "The Dark Triad", name_el: "Η Σκοτεινή Τριάδα",
    desc_en: "All three traits above the typical range: charisma, calculation and nerve in one package. Magnetic and effective in bursts — the pattern others eventually learn to brace for.",
    desc_el: "Και τα τρία χαρακτηριστικά πάνω από το τυπικό εύρος: χάρισμα, υπολογισμός και τόλμη σε ένα πακέτο. Μαγνητικό και αποτελεσματικό κατά ριπάς — το μοτίβο που οι άλλοι μαθαίνουν κάποτε να προσέχουν.",
    cognition_en: "On cognitive material this profile bets big: fearless attempts everywhere, strategic guessing, real highs. Consistency — not capability — is what usually caps the score.",
    cognition_el: "Στο γνωστικό υλικό αυτό το προφίλ ποντάρει μεγάλα: άφοβες απόπειρες παντού, στρατηγικές μαντεψιές, πραγματικές κορυφές. Η συνέπεια — όχι η ικανότητα — είναι αυτό που συνήθως βάζει το ταβάνι.",
    examples_en: "Frank Underwood (House of Cards), Light Yagami (Death Note)",
    examples_el: "Φρανκ Άντεργουντ (House of Cards), Λάιτ Γιαγκάμι (Death Note)",
  },
};

// ── Neutral-framing / limitations note for the SD-3 results ─────
const SD3_RESULT_NOTES = {
  framing_en: "How to read this: these are personality dimensions, not diagnoses, and every profile has genuine strengths and costs. 'High' and 'Low' are relative to published sample averages (Jones & Paulhus, 2014) — by construction, roughly half of test-takers land 'High' on any trait. A 27-item self-report is a snapshot of how you described yourself today, nothing deeper.",
  framing_el: "Πώς να το διαβάσεις: πρόκειται για διαστάσεις προσωπικότητας, όχι διαγνώσεις, και κάθε προφίλ έχει πραγματικά πλεονεκτήματα και κόστη. Τα «Υψηλό» και «Χαμηλό» είναι σχετικά με δημοσιευμένους μέσους όρους δείγματος (Jones & Paulhus, 2014) — εκ κατασκευής, περίπου οι μισοί βγαίνουν «Υψηλό» σε κάποιο χαρακτηριστικό. Ένα ερωτηματολόγιο αυτοαναφοράς 27 στοιχείων είναι στιγμιότυπο του πώς περιέγραψες τον εαυτό σου σήμερα, τίποτα βαθύτερο.",
};
