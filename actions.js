/*
  ACTIONS DATA
  ------------
  Each action has:
    name      - a label (not shown to visitors)
    keywords  - words/phrases that trigger it
    replies   - neutral replies (one is picked at random)

  Keyword rules:
    - Plain words match whole words, and also simple endings (s, es, ed, d, ing).
      Example: "attack" matches attack, attacks, attacked, attacking.
    - A trailing * matches any ending. Example: "invad*" matches invade, invaded, invading.
    - Phrases with spaces work too, e.g. "join forces", and count extra.

  Reply placeholders: {sender} and {recipient} are replaced with the chosen nations.
  Actions listed first win ties.
*/

const actions = [
    // ---------- Hostile ----------
    {
        name: "War",
        keywords: ["war", "attack", "invad*", "declar*", "strike"],
        replies: [
            "{recipient} has received your declaration, {sender}. Our council will deliberate before responding.",
            "Your words of war have been noted. {recipient} neither flinches nor rushes to answer.",
            "A grave message, {sender}. We shall consider our position carefully."
        ]
    },
    {
        name: "Threaten",
        keywords: ["threat*", "warn", "or else", "ultimatum"],
        replies: [
            "{recipient} takes note of your warning, {sender}, and will weigh it accordingly.",
            "Threats are heard, but not yet answered. The matter will be reviewed."
        ]
    },
    {
        name: "Insult",
        keywords: ["insult*", "mock*", "coward*", "fool*", "weak"],
        replies: [
            "Your remarks have reached {recipient}. We will not respond hastily.",
            "{recipient} has taken note of your words, {sender}. Nothing more at this time."
        ]
    },
    {
        name: "Embargo",
        keywords: ["embargo*", "sanction*", "blockad*", "boycott*"],
        replies: [
            "{recipient}'s ministers are reviewing the effects of your proposed restrictions.",
            "Your embargo has been recorded, {sender}. Its consequences are under study."
        ]
    },
    {
        name: "Spy",
        keywords: ["spy", "spies", "infiltrat*", "sabotag*", "steal secrets"],
        replies: [
            "{recipient} has no comment on matters of this nature.",
            "Whatever you are suggesting, {sender}, we neither confirm nor deny."
        ]
    },
    {
        name: "Demand tribute",
        keywords: ["tribute", "demand", "surrender*", "submit*"],
        replies: [
            "Your demand has been received. {recipient} will consider whether it merits a reply.",
            "{recipient} has noted your terms, {sender}, and will respond in due time."
        ]
    },

    // ---------- Diplomatic ----------
    {
        name: "Alliance",
        keywords: ["allian*", "ally", "allies", "pact", "join forces"],
        replies: [
            "{recipient} is open to discussing a closer relationship, {sender}. Nothing is decided yet.",
            "Your proposal of alliance is under review by our council.",
            "An interesting offer. {recipient} will study its terms."
        ]
    },
    {
        name: "Peace",
        keywords: ["peace", "ceasefire", "truce", "armistice"],
        replies: [
            "{recipient} has received your call for peace and will consider it.",
            "Your offer of a truce has been noted, {sender}. We shall discuss it."
        ]
    },
    {
        name: "Treaty",
        keywords: ["treaty", "treaties", "agreement", "sign", "negotiat*"],
        replies: [
            "{recipient} will review the proposed terms, {sender}, before committing to anything.",
            "Our diplomats will examine your treaty draft with care."
        ]
    },
    {
        name: "Request aid",
        keywords: ["aid", "help", "assist*", "support"],
        replies: [
            "Your request for assistance has reached {recipient}. We will assess what can be done.",
            "{recipient} has heard your appeal, {sender}. A decision will follow."
        ]
    },
    {
        name: "Apologize",
        keywords: ["apolog*", "sorry", "forgive*", "regret"],
        replies: [
            "Your apology has been received, {sender}. {recipient} will take it under consideration.",
            "{recipient} acknowledges your words and will reflect on them."
        ]
    },
    {
        name: "Open relations",
        keywords: ["greet*", "hello", "meet", "embass*"],
        replies: [
            "Greetings, {sender}. {recipient} welcomes your message.",
            "{recipient} acknowledges your overture and is willing to hear more."
        ]
    },

    // ---------- Economic and resources ----------
    {
        name: "Trade",
        keywords: ["trade", "trading", "buy", "sell", "exchange", "goods"],
        replies: [
            "{recipient}'s merchants will review your trade proposal, {sender}.",
            "Your offer of exchange is noted. Terms will need to be discussed."
        ]
    },
    {
        name: "Gift",
        keywords: ["gift*", "give", "giving", "donat*", "offer"],
        replies: [
            "{recipient} has received your gift, {sender}. It has been noted.",
            "Your offering has arrived. We will consider how best to respond."
        ]
    },
    {
        name: "Loan",
        keywords: ["loan", "borrow", "lend", "debt"],
        replies: [
            "{recipient}'s treasury will examine your request, {sender}.",
            "A matter of finance requires careful thought. We will reply in time."
        ]
    },
    {
        name: "Crystals",
        keywords: ["crystal", "ember", "light crystal"],
        replies: [
            "{recipient} takes great interest in matters concerning crystals, {sender}. We will consider your words.",
            "Crystals are not discussed lightly. Your message has been noted."
        ]
    },

    // ---------- Other ----------
    {
        name: "Migration or refuge",
        keywords: ["refuge*", "asylum", "migrat*", "shelter"],
        replies: [
            "Your request regarding refuge has been received. {recipient} will review it.",
            "{recipient} has noted your concern for those seeking shelter, {sender}."
        ]
    },
    {
        name: "Puppet or annex",
        keywords: ["annex*", "puppet", "vassal", "protectorate"],
        replies: [
            "Such a proposal weighs heavily, {sender}. {recipient} will consider it with great care.",
            "{recipient} has received your words on sovereignty and will respond in due time."
        ]
    }
];

// Used when no keyword matches
const fallbackReplies = [
    "{recipient}'s envoy stares at you blankly. Perhaps try rephrasing, {sender}.",
    "Your message reached {recipient}, but its meaning was unclear.",
    "No one in {recipient}'s court quite understands what you are asking."
];