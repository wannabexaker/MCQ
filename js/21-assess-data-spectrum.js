/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · SEXUALITY SPECTRUM DATA — 28 original items on a
   1–5 agree/disagree scale. No right or wrong answers.
   Model: two independent gender-attraction axes (same / other),
   attraction intensity (allosexual↔asexual), bond-dependence
   (demisexual pattern), gender-irrelevance (pansexual pattern)
   and fluidity — inspired by the Kinsey scale, the Klein Sexual
   Orientation Grid and asexuality research. All items are
   original; attraction-level wording only (no explicit content).
   IMPORTANT FRAMING: the result describes patterns in the
   answers — only the person can name their identity.
   Dimensions: S same-gender · O other-gender · I intensity ·
   D bond-dependence · G gender-irrelevance · F fluidity.
   Reverse-keyed items stop straight-lining from maxing any axis.
   ═══════════════════════════════════════════════════════════════ */

const SPECTRUM_TEST_META = {
  id: "spectrum",
  version: 1,
  dims: ["S", "O", "I", "D", "G", "F"],
  dimCounts: { S: 6, O: 6, I: 6, D: 3, G: 4, F: 3 },
};

// Presentation order interleaves the dimensions so no theme clusters.
const SPECTRUM_ITEMS = [
  { id: "sp-o1", dim: "O", reverse: false,
    text_en: "I can imagine genuinely falling for someone of a different gender than mine.",
    text_el: "Μπορώ να φανταστώ να ερωτεύομαι πραγματικά έναν άνθρωπο διαφορετικού φύλου από το δικό μου." },
  { id: "sp-s1", dim: "S", reverse: false,
    text_en: "I can imagine genuinely falling for someone of the same gender as me.",
    text_el: "Μπορώ να φανταστώ να ερωτεύομαι πραγματικά έναν άνθρωπο του ίδιου φύλου με εμένα." },
  { id: "sp-i1", dim: "I", reverse: false,
    text_en: "I experience sexual attraction toward other people.",
    text_el: "Νιώθω σεξουαλική έλξη για άλλους ανθρώπους." },
  { id: "sp-g1", dim: "G", reverse: false,
    text_en: "When I'm drawn to someone, their gender is among the least important things about them.",
    text_el: "Όταν με τραβά κάποιος, το φύλο του είναι από τα λιγότερο σημαντικά πάνω του." },

  { id: "sp-s2", dim: "S", reverse: false,
    text_en: "I have felt drawn to a person of my own gender in a way that went beyond friendship.",
    text_el: "Έχω νιώσει να με τραβά άνθρωπος του δικού μου φύλου με τρόπο που ξεπερνούσε τη φιλία." },
  { id: "sp-o2", dim: "O", reverse: false,
    text_en: "I have felt drawn to a person of a different gender in a way that went beyond friendship.",
    text_el: "Έχω νιώσει να με τραβά άνθρωπος διαφορετικού φύλου με τρόπο που ξεπερνούσε τη φιλία." },
  { id: "sp-d1", dim: "D", reverse: false,
    text_en: "I only start finding someone attractive after I know them deeply.",
    text_el: "Αρχίζω να βρίσκω κάποιον ελκυστικό μόνο αφού τον γνωρίσω βαθιά." },
  { id: "sp-f1", dim: "F", reverse: false,
    text_en: "The way I experience attraction has changed over the years.",
    text_el: "Ο τρόπος που βιώνω την έλξη έχει αλλάξει μέσα στα χρόνια." },

  { id: "sp-i2", dim: "I", reverse: false,
    text_en: "Physical chemistry matters to me in a relationship.",
    text_el: "Η σωματική χημεία μετράει για μένα σε μια σχέση." },
  { id: "sp-s3", dim: "S", reverse: true,
    text_en: "A romantic relationship with someone of my own gender feels foreign to me.",
    text_el: "Μια ρομαντική σχέση με άνθρωπο του δικού μου φύλου μού είναι κάτι ξένο." },
  { id: "sp-o3", dim: "O", reverse: true,
    text_en: "A romantic relationship with someone of a different gender feels foreign to me.",
    text_el: "Μια ρομαντική σχέση με άνθρωπο διαφορετικού φύλου μού είναι κάτι ξένο." },
  { id: "sp-g2", dim: "G", reverse: false,
    text_en: "I could be attracted to people across the whole range of genders.",
    text_el: "Θα μπορούσα να νιώσω έλξη για ανθρώπους σε όλο το φάσμα των φύλων." },

  { id: "sp-i3", dim: "I", reverse: true,
    text_en: "I could live happily without any sexual side to my relationships.",
    text_el: "Θα μπορούσα να ζήσω ευτυχισμένα χωρίς καμία σεξουαλική διάσταση στις σχέσεις μου." },
  { id: "sp-s4", dim: "S", reverse: false,
    text_en: "People of my own gender show up in my daydreams or fantasies.",
    text_el: "Άνθρωποι του δικού μου φύλου εμφανίζονται στα όνειρα ή τις φαντασιώσεις μου." },
  { id: "sp-d2", dim: "D", reverse: true,
    text_en: "Attraction at first sight is something that happens to me.",
    text_el: "Η έλξη με την πρώτη ματιά είναι κάτι που μου συμβαίνει." },
  { id: "sp-o4", dim: "O", reverse: false,
    text_en: "People of a different gender show up in my daydreams or fantasies.",
    text_el: "Άνθρωποι διαφορετικού φύλου εμφανίζονται στα όνειρα ή τις φαντασιώσεις μου." },

  { id: "sp-f2", dim: "F", reverse: false,
    text_en: "I'm still working out what my patterns of attraction mean for me.",
    text_el: "Ακόμα προσπαθώ να καταλάβω τι σημαίνουν για μένα τα μοτίβα έλξης μου." },
  { id: "sp-i4", dim: "I", reverse: false,
    text_en: "When friends describe finding a stranger attractive, I recognize the feeling from my own life.",
    text_el: "Όταν φίλοι περιγράφουν ότι βρίσκουν έναν άγνωστο ελκυστικό, αναγνωρίζω το συναίσθημα από τη δική μου ζωή." },
  { id: "sp-g3", dim: "G", reverse: true,
    text_en: "Gender plays a big role in whether I could ever be attracted to someone.",
    text_el: "Το φύλο παίζει μεγάλο ρόλο στο αν θα μπορούσα ποτέ να νιώσω έλξη για κάποιον." },
  { id: "sp-s5", dim: "S", reverse: false,
    text_en: "If someone of my own gender flirted with me, part of me might enjoy it.",
    text_el: "Αν κάποιος του δικού μου φύλου φλέρταρε μαζί μου, ένα κομμάτι μου ίσως το απολάμβανε." },

  { id: "sp-o5", dim: "O", reverse: false,
    text_en: "If someone of a different gender flirted with me, part of me might enjoy it.",
    text_el: "Αν κάποιος διαφορετικού φύλου φλέρταρε μαζί μου, ένα κομμάτι μου ίσως το απολάμβανε." },
  { id: "sp-i5", dim: "I", reverse: true,
    text_en: "Sexual attraction is something I mostly hear others describe rather than feel myself.",
    text_el: "Η σεξουαλική έλξη είναι κάτι που κυρίως ακούω άλλους να το περιγράφουν παρά το νιώθω ο ίδιος." },
  { id: "sp-d3", dim: "D", reverse: false,
    text_en: "Without a strong emotional bond, attraction simply doesn't switch on for me.",
    text_el: "Χωρίς ισχυρό συναισθηματικό δεσμό, η έλξη απλώς δεν «ανάβει» για μένα." },
  { id: "sp-g4", dim: "G", reverse: false,
    text_en: "I fall for the person first — the category they belong to comes later, if at all.",
    text_el: "Ερωτεύομαι πρώτα τον άνθρωπο — η κατηγορία στην οποία ανήκει έρχεται μετά, αν έρθει." },

  { id: "sp-s6", dim: "S", reverse: true,
    text_en: "I have never felt any pull toward people of my own gender.",
    text_el: "Δεν έχω νιώσει ποτέ καμία έλξη για ανθρώπους του δικού μου φύλου." },
  { id: "sp-o6", dim: "O", reverse: true,
    text_en: "I have never felt any pull toward people of a different gender.",
    text_el: "Δεν έχω νιώσει ποτέ καμία έλξη για ανθρώπους διαφορετικού φύλου." },
  { id: "sp-i6", dim: "I", reverse: false,
    text_en: "Wanting a partner physically is a real, recurring part of my life.",
    text_el: "Το να επιθυμώ έναν σύντροφο σωματικά είναι υπαρκτό, επαναλαμβανόμενο κομμάτι της ζωής μου." },
  { id: "sp-f3", dim: "F", reverse: true,
    text_en: "My sense of who I'm attracted to has been stable for as long as I can remember.",
    text_el: "Η αίσθησή μου για το ποιοι με ελκύουν είναι σταθερή από όσο θυμάμαι." },
];

// ── Dimension labels + graded interpretation texts ──────────────
const SPECTRUM_DIM_INFO = {
  S: {
    label_en: "Same-gender attraction", label_el: "Έλξη προς το ίδιο φύλο",
    short_en: "Same-gender", short_el: "Ίδιο φύλο",
    desc_en: "Romantic and physical pull toward people of your own gender.",
    desc_el: "Ρομαντική και σωματική έλξη προς ανθρώπους του δικού σου φύλου.",
  },
  O: {
    label_en: "Other-gender attraction", label_el: "Έλξη προς διαφορετικό φύλο",
    short_en: "Other-gender", short_el: "Διαφορετικό φύλο",
    desc_en: "Romantic and physical pull toward people of a different gender than yours.",
    desc_el: "Ρομαντική και σωματική έλξη προς ανθρώπους διαφορετικού φύλου από το δικό σου.",
  },
  I: {
    label_en: "Attraction intensity", label_el: "Ένταση έλξης",
    short_en: "Intensity", short_el: "Ένταση",
    desc_en: "How present sexual attraction is in your life at all — the allosexual↔asexual spectrum.",
    desc_el: "Πόσο παρούσα είναι γενικά η σεξουαλική έλξη στη ζωή σου — το φάσμα αλλοσεξουαλικότητας↔ασεξουαλικότητας.",
  },
  D: {
    label_en: "Bond-dependence", label_el: "Εξάρτηση από τον δεσμό",
    short_en: "Bond", short_el: "Δεσμός",
    desc_en: "Whether attraction appears only after a deep emotional connection (the demisexual pattern).",
    desc_el: "Αν η έλξη εμφανίζεται μόνο μετά από βαθιά συναισθηματική σύνδεση (το ντεμισεξουαλικό μοτίβο).",
  },
  G: {
    label_en: "Gender-irrelevance", label_el: "Ουδετερότητα φύλου",
    short_en: "Gender-blind", short_el: "Ανεξαρτήτως φύλου",
    desc_en: "How little gender matters in who draws you (the pansexual pattern).",
    desc_el: "Πόσο λίγο μετράει το φύλο στο ποιος σε τραβά (το πανσεξουαλικό μοτίβο).",
  },
  F: {
    label_en: "Fluidity", label_el: "Ρευστότητα",
    short_en: "Fluidity", short_el: "Ρευστότητα",
    desc_en: "How much your patterns of attraction have shifted or are still settling.",
    desc_el: "Πόσο έχουν μετατοπιστεί ή ακόμα «κατασταλάζουν» τα μοτίβα έλξης σου.",
  },
};

/* ── Result categories, selected by profile shape + intensity ────
   Names are spectrum positions, not verdicts: the UI frames them as
   "your answers align most closely with…".                        */
const SPECTRUM_RESULTS = {
  straight: {
    name_en: "Heterosexual", name_el: "Ετεροφυλοφιλία",
    desc_en: "Your answers show strong attraction toward other genders and little to none toward your own.",
    desc_el: "Οι απαντήσεις σου δείχνουν έντονη έλξη προς διαφορετικά φύλα και ελάχιστη έως καμία προς το δικό σου.",
    meaning_en: "This is the most common pattern worldwide. Nothing about it is 'default' or 'plain' — it's simply where your answers place you on the spectrum today.",
    meaning_el: "Είναι το πιο συχνό μοτίβο παγκοσμίως. Τίποτα πάνω του δεν είναι «προεπιλογή» ή «σκέτο» — είναι απλώς το σημείο του φάσματος όπου σε τοποθετούν οι σημερινές σου απαντήσεις.",
    nearby_en: "Nearby on the spectrum: mostly heterosexual (heteroflexible).",
    nearby_el: "Κοντινά στο φάσμα: κυρίως ετεροφυλοφιλία (heteroflexible).",
  },
  mostlyStraight: {
    name_en: "Mostly heterosexual", name_el: "Κυρίως ετεροφυλοφιλία",
    desc_en: "Attraction toward other genders leads clearly, but your answers leave meaningful room for same-gender pull — the 'mostly straight' zone of the Kinsey scale (1–2).",
    desc_el: "Η έλξη προς διαφορετικά φύλα προηγείται καθαρά, αλλά οι απαντήσεις σου αφήνουν ουσιαστικό περιθώριο για έλξη προς το ίδιο φύλο — η ζώνη «κυρίως στρέιτ» της κλίμακας Kinsey (1–2).",
    meaning_en: "Research consistently finds this is one of the largest groups after exclusive heterosexuality. Occasional same-gender attraction doesn't require a new label unless you want one.",
    meaning_el: "Η έρευνα σταθερά δείχνει ότι είναι από τις μεγαλύτερες ομάδες μετά την αποκλειστική ετεροφυλοφιλία. Η περιστασιακή έλξη προς το ίδιο φύλο δεν απαιτεί νέα ετικέτα — εκτός αν εσύ τη θέλεις.",
    nearby_en: "Nearby on the spectrum: heterosexual · bisexual.",
    nearby_el: "Κοντινά στο φάσμα: ετεροφυλοφιλία · αμφισεξουαλικότητα.",
  },
  bi: {
    name_en: "Bisexual", name_el: "Αμφισεξουαλικότητα",
    desc_en: "Your answers show real attraction toward both your own and other genders — not necessarily equally, and rarely 50/50.",
    desc_el: "Οι απαντήσεις σου δείχνουν πραγματική έλξη τόσο προς το δικό σου όσο και προς διαφορετικά φύλα — όχι απαραίτητα εξίσου, και σπάνια 50/50.",
    meaning_en: "Bisexuality includes leans: many bi people prefer one gender most of the time. A lean doesn't make the attraction to the other any less real.",
    meaning_el: "Η αμφισεξουαλικότητα περιλαμβάνει «κλίσεις»: πολλοί αμφισεξουαλικοί άνθρωποι προτιμούν το ένα φύλο τις περισσότερες φορές. Η κλίση δεν κάνει την έλξη προς το άλλο λιγότερο αληθινή.",
    nearby_en: "Nearby on the spectrum: pansexual · mostly heterosexual · mostly homosexual.",
    nearby_el: "Κοντινά στο φάσμα: πανσεξουαλικότητα · κυρίως ετεροφυλοφιλία · κυρίως ομοφυλοφιλία.",
  },
  pan: {
    name_en: "Pansexual", name_el: "Πανσεξουαλικότητα",
    desc_en: "Attraction across genders, with your answers saying loudly that gender itself is not what draws you — the person is.",
    desc_el: "Έλξη σε όλο το φάσμα των φύλων, με τις απαντήσεις σου να λένε καθαρά ότι δεν είναι το φύλο αυτό που σε τραβά — είναι ο άνθρωπος.",
    meaning_en: "Pan and bi overlap heavily and many people use them interchangeably; pan emphasizes that gender is irrelevant rather than that both are included. Pick whichever word fits how you feel.",
    meaning_el: "Το παν- και το αμφι- επικαλύπτονται έντονα και πολλοί τα χρησιμοποιούν εναλλάξ· το «παν» τονίζει ότι το φύλο είναι αδιάφορο, όχι απλώς ότι συμπεριλαμβάνονται και τα δύο. Διάλεξε όποια λέξη ταιριάζει στο πώς νιώθεις.",
    nearby_en: "Nearby on the spectrum: bisexual.",
    nearby_el: "Κοντινά στο φάσμα: αμφισεξουαλικότητα.",
  },
  mostlyGay: {
    name_en: "Mostly homosexual", name_el: "Κυρίως ομοφυλοφιλία",
    desc_en: "Attraction toward your own gender leads clearly, with your answers leaving some room for other-gender pull — Kinsey 4–5 territory.",
    desc_el: "Η έλξη προς το δικό σου φύλο προηγείται καθαρά, με τις απαντήσεις σου να αφήνουν κάποιο περιθώριο για έλξη προς άλλα φύλα — περιοχή Kinsey 4–5.",
    meaning_en: "Same pattern as 'mostly straight', mirrored. Whether you call yourself gay, bi, or homoflexible is entirely your call — the label follows you, not the other way around.",
    meaning_el: "Ίδιο μοτίβο με το «κυρίως στρέιτ», κατοπτρικά. Το αν θα ονομάσεις τον εαυτό σου γκέι, αμφί ή homoflexible είναι απόλυτα δική σου επιλογή — η ετικέτα ακολουθεί εσένα, όχι το αντίστροφο.",
    nearby_en: "Nearby on the spectrum: homosexual · bisexual.",
    nearby_el: "Κοντινά στο φάσμα: ομοφυλοφιλία · αμφισεξουαλικότητα.",
  },
  gay: {
    name_en: "Homosexual (gay/lesbian)", name_el: "Ομοφυλοφιλία",
    desc_en: "Your answers show strong attraction toward your own gender and little to none toward other genders.",
    desc_el: "Οι απαντήσεις σου δείχνουν έντονη έλξη προς το δικό σου φύλο και ελάχιστη έως καμία προς άλλα φύλα.",
    meaning_en: "A clear, consistent pattern — as stable and healthy as any other orientation. Community and language (gay, lesbian, queer) are yours to choose at your own pace.",
    meaning_el: "Ένα καθαρό, συνεπές μοτίβο — εξίσου σταθερό και υγιές με κάθε άλλο προσανατολισμό. Η κοινότητα και οι λέξεις (γκέι, λεσβία, κουίρ) είναι δικές σου επιλογές, στον δικό σου ρυθμό.",
    nearby_en: "Nearby on the spectrum: mostly homosexual (homoflexible).",
    nearby_el: "Κοντινά στο φάσμα: κυρίως ομοφυλοφιλία (homoflexible).",
  },
  demi: {
    name_en: "Demisexual", name_el: "Ντεμισεξουαλικότητα",
    desc_en: "Your answers show that attraction exists for you, but switches on only after a deep emotional bond — rarely, if ever, at first sight.",
    desc_el: "Οι απαντήσεις σου δείχνουν ότι η έλξη υπάρχει για σένα, αλλά «ανάβει» μόνο μετά από βαθύ συναισθηματικό δεσμό — σπάνια, αν ποτέ, με την πρώτη ματιά.",
    meaning_en: "Demisexuality sits on the asexual spectrum. It is not shyness or 'high standards' — it's a real pattern where connection precedes attraction. Your gender-attraction answers show which way that attraction points once it appears.",
    meaning_el: "Η ντεμισεξουαλικότητα ανήκει στο ασεξουαλικό φάσμα. Δεν είναι ντροπαλότητα ούτε «ψηλά στάνταρ» — είναι υπαρκτό μοτίβο όπου η σύνδεση προηγείται της έλξης. Οι απαντήσεις σου για τα φύλα δείχνουν προς τα πού στρέφεται αυτή η έλξη όταν εμφανιστεί.",
    nearby_en: "Nearby on the spectrum: gray-asexual · allosexual orientations.",
    nearby_el: "Κοντινά στο φάσμα: γκρίζα ασεξουαλικότητα · αλλοσεξουαλικοί προσανατολισμοί.",
  },
  grayAce: {
    name_en: "Gray-asexual", name_el: "Γκρίζα ασεξουαλικότητα",
    desc_en: "Sexual attraction shows up in your answers, but rarely, weakly, or only under specific circumstances — the gray zone between asexual and allosexual.",
    desc_el: "Η σεξουαλική έλξη εμφανίζεται στις απαντήσεις σου, αλλά σπάνια, αχνά ή μόνο υπό συγκεκριμένες συνθήκες — η γκρίζα ζώνη ανάμεσα στο ασεξουαλικό και το αλλοσεξουαλικό.",
    meaning_en: "Gray-ace people often spend years thinking they are 'doing it wrong'. You're not — infrequent attraction is a place on the spectrum, not a malfunction.",
    meaning_el: "Οι gray-ace άνθρωποι συχνά περνούν χρόνια νομίζοντας ότι «κάτι κάνουν λάθος». Δεν κάνεις — η σπάνια έλξη είναι θέση στο φάσμα, όχι βλάβη.",
    nearby_en: "Nearby on the spectrum: asexual · demisexual.",
    nearby_el: "Κοντινά στο φάσμα: ασεξουαλικότητα · ντεμισεξουαλικότητα.",
  },
  ace: {
    name_en: "Asexual", name_el: "Ασεξουαλικότητα",
    desc_en: "Your answers show little to no sexual attraction toward anyone — the asexual end of the intensity spectrum.",
    desc_el: "Οι απαντήσεις σου δείχνουν ελάχιστη έως καθόλου σεξουαλική έλξη προς οποιονδήποτε — το ασεξουαλικό άκρο του φάσματος έντασης.",
    meaning_en: "Asexuality is an orientation, not a disorder, a phase, or something to fix. Many aces still want romance, partnership, or neither — your gender-attraction answers hint at your romantic orientation, which can differ from the sexual one.",
    meaning_el: "Η ασεξουαλικότητα είναι προσανατολισμός — όχι διαταραχή, φάση ή κάτι «προς διόρθωση». Πολλοί ασεξουαλικοί άνθρωποι θέλουν ρομάντζο, συντροφικότητα ή τίποτα από τα δύο — οι απαντήσεις σου για τα φύλα δίνουν ένδειξη για τον ρομαντικό σου προσανατολισμό, που μπορεί να διαφέρει από τον σεξουαλικό.",
    nearby_en: "Nearby on the spectrum: gray-asexual · demisexual.",
    nearby_el: "Κοντινά στο φάσμα: γκρίζα ασεξουαλικότητα · ντεμισεξουαλικότητα.",
  },
  questioning: {
    name_en: "Exploring / Questioning", name_el: "Σε διερεύνηση",
    desc_en: "Your answers point in different directions at once — real attraction intensity, but no clear gender pattern, or answers that pull against each other.",
    desc_el: "Οι απαντήσεις σου δείχνουν προς διαφορετικές κατευθύνσεις ταυτόχρονα — υπαρκτή ένταση έλξης, αλλά χωρίς καθαρό μοτίβο φύλου, ή απαντήσεις που τραβούν αντίθετα.",
    meaning_en: "Completely normal, especially while figuring things out. Questioning is a legitimate place on the spectrum for as long as you need it — retake the test whenever things feel clearer.",
    meaning_el: "Απόλυτα φυσιολογικό, ειδικά όσο τα ξεκαθαρίζεις. Η διερεύνηση είναι νόμιμη θέση στο φάσμα για όσο τη χρειάζεσαι — ξανακάνε το τεστ όποτε νιώσεις τα πράγματα πιο καθαρά.",
    nearby_en: "Nearby on the spectrum: everywhere — that's the point.",
    nearby_el: "Κοντινά στο φάσμα: παντού — αυτό είναι το νόημα.",
  },
};

// ── Extra note fragments assembled by the results renderer ──────
const SPECTRUM_NOTES = {
  identity_en: "Only you can name your sexuality. This result describes patterns in 28 answers you gave today — it is a mirror, not a verdict, and it may simply be wrong. Any label is valid, including none, and labels are allowed to change.",
  identity_el: "Μόνο εσύ μπορείς να ονομάσεις τη σεξουαλικότητά σου. Το αποτέλεσμα περιγράφει μοτίβα σε 28 απαντήσεις που έδωσες σήμερα — είναι καθρέφτης, όχι ετυμηγορία, και μπορεί απλώς να κάνει λάθος. Κάθε ετικέτα είναι έγκυρη, ακόμα και καμία, και οι ετικέτες επιτρέπεται να αλλάζουν.",
  fluid_en: "Your answers also show high fluidity — your patterns have shifted before and may shift again. That's a documented, normal part of many people's lives.",
  fluid_el: "Οι απαντήσεις σου δείχνουν επίσης υψηλή ρευστότητα — τα μοτίβα σου έχουν μετατοπιστεί ξανά και ίσως μετατοπιστούν πάλι. Είναι καταγεγραμμένο, φυσιολογικό κομμάτι της ζωής πολλών ανθρώπων.",
  biLeanSame_en: "Within this, your answers lean toward your own gender.",
  biLeanSame_el: "Μέσα σε αυτό, οι απαντήσεις σου γέρνουν προς το δικό σου φύλο.",
  biLeanOther_en: "Within this, your answers lean toward other genders.",
  biLeanOther_el: "Μέσα σε αυτό, οι απαντήσεις σου γέρνουν προς διαφορετικά φύλα.",
  romLead_en: "Romantic pull in your answers points mostly toward:",
  romLead_el: "Η ρομαντική έλξη στις απαντήσεις σου δείχνει κυρίως προς:",
  romSame_en: "your own gender", romSame_el: "το δικό σου φύλο",
  romOther_en: "other genders", romOther_el: "διαφορετικά φύλα",
  romBoth_en: "both your own and other genders", romBoth_el: "τόσο το δικό σου όσο και διαφορετικά φύλα",
  romNone_en: "no gender strongly — an aromantic-leaning pattern", romNone_el: "κανένα φύλο έντονα — μοτίβο με αρωμαντική κλίση",
  framing_en: "How to read this: the test measures six attraction dimensions inspired by the Kinsey scale, the Klein grid and asexuality research, then names the nearest region of the spectrum. A 28-item self-report is a snapshot of how you described yourself today — culture, safety and experience all shape what we notice about ourselves. It cannot 'detect' anything; it only reflects your answers back, organized.",
  framing_el: "Πώς να το διαβάσεις: το τεστ μετρά έξι διαστάσεις έλξης εμπνευσμένες από την κλίμακα Kinsey, το πλέγμα Klein και την έρευνα για την ασεξουαλικότητα, και ονομάζει την κοντινότερη περιοχή του φάσματος. Ένα ερωτηματολόγιο αυτοαναφοράς 28 στοιχείων είναι στιγμιότυπο του πώς περιέγραψες τον εαυτό σου σήμερα — η κουλτούρα, η αίσθηση ασφάλειας και η εμπειρία διαμορφώνουν τι προσέχουμε στον εαυτό μας. Δεν μπορεί να «ανιχνεύσει» τίποτα· απλώς σου καθρεφτίζει τις απαντήσεις σου, οργανωμένες.",
};
