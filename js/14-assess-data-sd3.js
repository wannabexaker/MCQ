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
    mid_en: "You land around the middle: healthy self-belief without needing constant admiration. You can own a room when it matters and step back when it doesn't — a fairly balanced relationship with recognition.",
    mid_el: "Είσαι γύρω στη μέση: υγιής αυτοπεποίθηση χωρίς ανάγκη για συνεχή θαυμασμό. Μπορείς να «κρατήσεις» έναν χώρο όταν χρειάζεται και να κάνεις πίσω όταν δεν χρειάζεται — μια αρκετά ισορροπημένη σχέση με την αναγνώριση.",
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
    mid_en: "You land around the middle: mostly straightforward, but you can read a room and pick your moment when the stakes are real. Pragmatic rather than scheming — you keep some cards back without living behind them.",
    mid_el: "Είσαι γύρω στη μέση: κυρίως ευθύς, αλλά μπορείς να διαβάσεις τον χώρο και να διαλέξεις τη στιγμή σου όταν το διακύβευμα είναι πραγματικό. Πραγματιστής παρά μηχανορράφος — κρατάς κάποια χαρτιά κλειστά χωρίς να ζεις πίσω από αυτά.",
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
    mid_en: "You land around the middle: willing to take a calculated risk and speak plainly, but the brakes still work. Bold when it counts, careful when it counts — a workable balance of nerve and restraint.",
    mid_el: "Είσαι γύρω στη μέση: πρόθυμος να πάρεις ένα υπολογισμένο ρίσκο και να μιλήσεις καθαρά, αλλά το φρένο εξακολουθεί να δουλεύει. Τολμηρός όταν μετράει, προσεκτικός όταν μετράει — μια λειτουργική ισορροπία θάρρους και συγκράτησης.",
  },
};

// ── Named archetypes, graded by overall intensity + profile shape ──
// Selected by sd3ArchetypeId() from the 0-100 trait norms (js/15). The set
// spans gentle → moderate → dark so most people get a nuanced, mid-range
// result instead of everyone reading "high".
const SD3_ARCHETYPES = {
  // ── Very low overall ──
  gentle: {
    name_en: "The Gentle Soul", name_el: "Η Καλή Ψυχή",
    desc_en: "All three dark traits sit low. You lead with sincerity and warmth — people relax around you because there's no angle and nothing being played.",
    desc_el: "Και τα τρία «σκοτεινά» χαρακτηριστικά είναι χαμηλά. Προηγείται η ειλικρίνεια και η ζεστασιά — οι γύρω σου χαλαρώνουν γιατί δεν υπάρχει σκοπιμότητα ούτε παιχνίδι.",
    cognition_en: "Usually pairs with careful, honest test-taking: accuracy over speed, and genuine 'I don't know' skips instead of bluffing.",
    cognition_el: "Συνήθως συνδυάζεται με προσεκτική, ειλικρινή συμπλήρωση: ακρίβεια αντί ταχύτητας και ειλικρινή «δεν ξέρω» αντί για μπλόφα.",
    examples_en: "Samwise Gamgee (The Lord of the Rings), Ted Lasso (Ted Lasso)",
    examples_el: "Σαμ Γκάμτζι (Ο Άρχοντας των Δαχτυλιδιών), Τεντ Λάσο (Ted Lasso)",
  },
  // ── Low overall ──
  grounded: {
    name_en: "The Grounded One", name_el: "Ο Προσγειωμένος",
    desc_en: "Low and evenly balanced across all three. Not naive — just steady, straightforward and hard to knock off centre. What you see is what you get.",
    desc_el: "Χαμηλά και ισορροπημένα και στα τρία. Όχι αφελής — απλώς σταθερός, ευθύς και δύσκολο να χαθείς το κέντρο σου. Ό,τι βλέπεις, αυτό παίρνεις.",
    cognition_en: "Tends toward calm, methodical reasoning — few careless slips, rarely rattled by trick wording.",
    cognition_el: "Τείνει σε ήρεμη, μεθοδική σκέψη — λίγες απρόσεκτες αστοχίες, σπάνια σε ξεγελούν οι παγίδες.",
    examples_en: "Hermione Granger (Harry Potter), Jim Hopper (Stranger Things)",
    examples_el: "Ερμιόνη Γκρέιντζερ (Χάρι Πότερ), Τζιμ Χόπερ (Stranger Things)",
  },
  quiet: {
    name_en: "The Quiet Achiever", name_el: "Ο Ήσυχος Πετυχημένος",
    desc_en: "Mostly low, with a mild self-assured streak. You know your worth but don't need the spotlight to feel it — confidence kept in a low voice.",
    desc_el: "Κυρίως χαμηλά, με μια ήπια δόση αυτοπεποίθησης. Ξέρεις την αξία σου αλλά δεν χρειάζεσαι το προσκήνιο για να τη νιώσεις — σιγουριά σε χαμηλό τόνο.",
    cognition_en: "Quietly competent: attempts hard items without fanfare and rarely overclaims.",
    cognition_el: "Ήσυχα ικανός: επιχειρεί τα δύσκολα χωρίς φανφάρες και σπάνια υπερβάλλει.",
    examples_en: "Bruce Banner (The Avengers), Claude Monet (as popularly portrayed)",
    examples_el: "Μπρους Μπάνερ (The Avengers), Σαμ Ουάιζ (γενικός τύπος του ήσυχου)",
  },
  diplomat: {
    name_en: "The Diplomat", name_el: "Ο Διπλωμάτης",
    desc_en: "Low overall, with a light strategic touch. You read the room and pick your words, but you're pragmatic rather than scheming — smoothing edges, not laying traps.",
    desc_el: "Χαμηλά συνολικά, με ελαφριά στρατηγική πινελιά. Διαβάζεις τον χώρο και διαλέγεις τα λόγια σου, αλλά είσαι πραγματιστής παρά μηχανορράφος — στρογγυλεύεις γωνίες, δεν στήνεις παγίδες.",
    cognition_en: "Good at judgment items about people; patient enough to dodge the obvious traps.",
    cognition_el: "Καλός στις κρίσεις για ανθρώπους· αρκετά υπομονετικός για να αποφεύγει τις προφανείς παγίδες.",
    examples_en: "Aragorn (The Lord of the Rings), Leia Organa (Star Wars)",
    examples_el: "Άραγκορν (Ο Άρχοντας των Δαχτυλιδιών), Λέια Οργκάνα (Star Wars)",
  },
  freespirit: {
    name_en: "The Free Spirit", name_el: "Το Ελεύθερο Πνεύμα",
    desc_en: "Low overall, with a mild taste for risk and plain speech. You'll take the leap and say the true thing — but there's no calculation and no ego behind it.",
    desc_el: "Χαμηλά συνολικά, με μια ήπια όρεξη για ρίσκο και ευθύ λόγο. Θα κάνεις το άλμα και θα πεις την αλήθεια — αλλά χωρίς υπολογισμό και χωρίς εγωισμό από πίσω.",
    cognition_en: "Fast and instinctive; a single re-read before answering turns good hunches into points.",
    cognition_el: "Γρήγορος και ενστικτώδης· ένα ξαναδιάβασμα πριν απαντήσεις μετατρέπει τα καλά προαισθήματα σε πόντους.",
    examples_en: "Peter Quill / Star-Lord (Guardians of the Galaxy), Merida (Brave)",
    examples_el: "Πίτερ Κουίλ / Σταρ-Λορντ (Guardians of the Galaxy), Μερίντα (Brave)",
  },
  // ── Moderate overall ──
  balanced: {
    name_en: "The Balanced", name_el: "Ο Ισορροπημένος",
    desc_en: "All three traits around the middle — a bit of everything, nothing extreme. You can turn on charm, strategy or nerve when a situation calls for it, then set it back down.",
    desc_el: "Και τα τρία χαρακτηριστικά γύρω στη μέση — λίγο απ' όλα, τίποτα ακραίο. Μπορείς να «ανάψεις» χάρισμα, στρατηγική ή τόλμη όταν το ζητά η στιγμή και μετά να το αφήσεις κάτω.",
    cognition_en: "Flexible reasoner: enough confidence to attempt, enough caution to check. Consistency is the edge here.",
    cognition_el: "Ευέλικτος στη σκέψη: αρκετή σιγουριά για να επιχειρήσεις, αρκετή προσοχή για να ελέγξεις. Η συνέπεια είναι το ατού εδώ.",
    examples_en: "Katniss Everdeen (The Hunger Games), Michael Corleone (early, The Godfather)",
    examples_el: "Κάτνις Έβερντιν (The Hunger Games), Μάικλ Κορλεόνε (αρχικά, Ο Νονός)",
  },
  charmer: {
    name_en: "The Charmer", name_el: "Ο Γοητευτικός",
    desc_en: "Moderate overall, with narcissism leading. Warm, magnetic, comfortable being noticed — you win people first and details second.",
    desc_el: "Μέτρια συνολικά, με τον ναρκισσισμό να προηγείται. Ζεστός, μαγνητικός, άνετος στο να σε προσέχουν — κερδίζεις πρώτα τους ανθρώπους και μετά τις λεπτομέρειες.",
    cognition_en: "Confidence helps you attempt everything; the trap is answers that merely feel right on 'gotcha' items.",
    cognition_el: "Η σιγουριά σε βοηθά να τα επιχειρείς όλα· η παγίδα είναι απαντήσεις που απλώς «φαίνονται» σωστές στις ερωτήσεις-παγίδες.",
    examples_en: "Tony Stark (Iron Man), Gaston (Beauty and the Beast)",
    examples_el: "Τόνι Σταρκ (Iron Man), Γκαστόν (Η Πεντάμορφη και το Τέρας)",
  },
  strategist: {
    name_en: "The Strategist", name_el: "Ο Στρατηγός",
    desc_en: "Moderate overall, with Machiavellianism leading. You map motives, hold information close and think a few moves ahead — winning position without needing applause for it.",
    desc_el: "Μέτρια συνολικά, με τον μακιαβελισμό να προηγείται. Χαρτογραφείς κίνητρα, κρατάς κλειστά τα χαρτιά σου και σκέφτεσαι μερικές κινήσεις μπροστά — κερδίζεις θέση χωρίς να χρειάζεσαι χειροκρότημα.",
    cognition_en: "Deliberate and trap-resistant — usually shines on critical-thinking and 'what really follows?' items.",
    cognition_el: "Μεθοδικός και ανθεκτικός στις παγίδες — συνήθως λάμπει στην κριτική σκέψη και στα «τι πραγματικά προκύπτει;».",
    examples_en: "Odysseus (The Odyssey), Varys (Game of Thrones)",
    examples_el: "Οδυσσέας (Οδύσσεια), Βάρυς (Game of Thrones)",
  },
  maverick: {
    name_en: "The Maverick", name_el: "Ο Ατίθασος",
    desc_en: "Moderate overall, with a bold, impulsive streak leading. You move first, speak plainly and chase the adrenaline — spectacular when it works, loud when it doesn't.",
    desc_el: "Μέτρια συνολικά, με μια τολμηρή, παρορμητική διάθεση να προηγείται. Κινείσαι πρώτος, μιλάς ευθέως και κυνηγάς την αδρεναλίνη — θεαματικό όταν πετυχαίνει, θορυβώδες όταν όχι.",
    cognition_en: "Bold leaps on hard items, careless slips on easy ones — patience is the whole game.",
    cognition_el: "Τολμηρά άλματα στα δύσκολα, απρόσεκτες αστοχίες στα εύκολα — η υπομονή είναι όλο το παιχνίδι.",
    examples_en: "Han Solo (Star Wars), Jack Sparrow (Pirates of the Caribbean)",
    examples_el: "Χαν Σόλο (Star Wars), Τζακ Σπάροου (Οι Πειρατές της Καραϊβικής)",
  },
  // ── High overall ──
  star: {
    name_en: "The Star", name_el: "Το Αστέρι",
    desc_en: "High overall, driven by strong narcissism. Big self-belief, big presence — you sell the future because you genuinely see yourself at the centre of it. Magnetic, and a lot to keep fed.",
    desc_el: "Υψηλά συνολικά, με κινητήρια δύναμη τον έντονο ναρκισσισμό. Μεγάλη αυτοπεποίθηση, μεγάλη παρουσία — «πουλάς» το μέλλον επειδή πραγματικά βλέπεις τον εαυτό σου στο κέντρο του. Μαγνητικό, και θέλει πολλή «τροφή».",
    cognition_en: "Attempts everything fearlessly; the failure mode is overclaiming — trick questions punish answers that only feel right.",
    cognition_el: "Τα επιχειρεί όλα άφοβα· η παγίδα είναι η υπερβεβαιότητα — οι ερωτήσεις-παγίδες τιμωρούν όσα απλώς «φαίνονται» σωστά.",
    examples_en: "Miranda Priestly (The Devil Wears Prada), Emperor Kuzco (The Emperor's New Groove)",
    examples_el: "Μιράντα Πρίσλι (Ο Διάβολος Φοράει Prada), Αυτοκράτορας Κούζκο (Ο Αυτοκράτορας και τα Καμώματά του)",
  },
  operator: {
    name_en: "The Operator", name_el: "Ο Χειριστής",
    desc_en: "High overall, driven by cool strategy. Charisma in front, calculation behind — you manage rooms, images and outcomes at the same time, with the impulses kept firmly on a leash.",
    desc_el: "Υψηλά συνολικά, με κινητήρια δύναμη την ψυχρή στρατηγική. Χάρισμα μπροστά, υπολογισμός από πίσω — διαχειρίζεσαι ταυτόχρονα χώρο, εικόνα και αποτελέσματα, με τις παρορμήσεις σταθερά με λουρί.",
    cognition_en: "Strong on verbal and social-judgment material, with confidence calibrated just enough to stay dangerous.",
    cognition_el: "Δυνατός στο λεκτικό και το κοινωνικό υλικό, με την αυτοπεποίθηση ρυθμισμένη ίσα-ίσα για να παραμένει επικίνδυνη.",
    examples_en: "Don Draper (Mad Men), Cersei Lannister (Game of Thrones)",
    examples_el: "Ντον Ντρέιπερ (Mad Men), Σέρσεϊ Λάνιστερ (Game of Thrones)",
  },
  daredevil: {
    name_en: "The Daredevil", name_el: "Ο Ριψοκίνδυνος",
    desc_en: "High overall, driven by nerve. Appetite for risk, blunt speech, zero patience for hand-wringing — you move first and apologize rarely. Not scheming, not posing: just fearless.",
    desc_el: "Υψηλά συνολικά, με κινητήρια δύναμη την τόλμη. Όρεξη για ρίσκο, ωμός λόγος, μηδενική υπομονή για δισταγμούς — κινείσαι πρώτος και ζητάς σπάνια συγγνώμη. Ούτε μηχανορραφείς ούτε ποζάρεις: απλώς άφοβος.",
    cognition_en: "Speed over checking — impulsivity is exactly what trap items exploit; a single re-read is worth the most points here.",
    cognition_el: "Ταχύτητα αντί ελέγχου — η παρορμητικότητα είναι ακριβώς αυτό που εκμεταλλεύονται οι παγίδες· ένα ξαναδιάβασμα αξίζει τους περισσότερους πόντους εδώ.",
    examples_en: "Wolverine (X-Men), Harley Quinn (DC)",
    examples_el: "Γούλβεριν (X-Men), Χάρλεϊ Κουίν (DC)",
  },
  // ── Very high on all three ──
  triad: {
    name_en: "The Dark Triad", name_el: "Η Σκοτεινή Τριάδα",
    desc_en: "All three traits genuinely high at once: charisma, calculation and nerve in one package. Magnetic and effective in bursts — the pattern people eventually learn to brace for.",
    desc_el: "Και τα τρία χαρακτηριστικά πραγματικά υψηλά ταυτόχρονα: χάρισμα, υπολογισμός και τόλμη σε ένα πακέτο. Μαγνητικό και αποτελεσματικό κατά ριπάς — το μοτίβο που οι άλλοι μαθαίνουν κάποτε να προσέχουν.",
    cognition_en: "Bets big everywhere: fearless attempts, strategic guessing, real highs. Consistency — not capability — usually caps the score.",
    cognition_el: "Ποντάρει μεγάλα παντού: άφοβες απόπειρες, στρατηγικές μαντεψιές, πραγματικές κορυφές. Η συνέπεια — όχι η ικανότητα — συνήθως βάζει το ταβάνι.",
    examples_en: "Frank Underwood (House of Cards), Light Yagami (Death Note)",
    examples_el: "Φρανκ Άντεργουντ (House of Cards), Λάιτ Γιαγκάμι (Death Note)",
  },
};

// ── Neutral-framing / limitations note for the SD-3 results ─────
const SD3_RESULT_NOTES = {
  framing_en: "How to read this: these are personality dimensions, not diagnoses, and every profile has genuine strengths and costs. 'High' and 'Low' are relative to published sample averages (Jones & Paulhus, 2014) — by construction, roughly half of test-takers land 'High' on any trait. A 27-item self-report is a snapshot of how you described yourself today, nothing deeper.",
  framing_el: "Πώς να το διαβάσεις: πρόκειται για διαστάσεις προσωπικότητας, όχι διαγνώσεις, και κάθε προφίλ έχει πραγματικά πλεονεκτήματα και κόστη. Τα «Υψηλό» και «Χαμηλό» είναι σχετικά με δημοσιευμένους μέσους όρους δείγματος (Jones & Paulhus, 2014) — εκ κατασκευής, περίπου οι μισοί βγαίνουν «Υψηλό» σε κάποιο χαρακτηριστικό. Ένα ερωτηματολόγιο αυτοαναφοράς 27 στοιχείων είναι στιγμιότυπο του πώς περιέγραψες τον εαυτό σου σήμερα, τίποτα βαθύτερο.",
};
