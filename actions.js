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
            "Your declaration has been delivered to {recipient}'s council, {sender}. The generals and ministers have been summoned, and every consequence is now being weighed. A formal answer will follow once the council has reached its conclusion.",
            "Words of war are not taken lightly in {recipient}'s halls. Our advisors are reviewing the borders, the fleets, and the alliances that would be drawn into such a conflict. Until they finish, we have nothing more to say to you, {sender}.",
            "A grave message, {sender}, and one that {recipient} will not answer in haste. The war room has been opened and our commanders are studying your intentions. Whatever comes next will be decided with a clear head."
        ]
    },
    {
        name: "Threaten",
        keywords: ["threat*", "warn", "or else", "ultimatum"],
        replies: [
            "{recipient} has taken note of your warning, {sender}. Our court does not respond to pressure in the moment, but your words have been recorded and will be considered. Expect a measured reply in due time.",
            "Threats echo loudly but travel poorly, {sender}. The matter has been passed to our ministers, who will judge whether it deserves a response. {recipient} will decide its course on its own terms.",
            "Your ultimatum has reached {recipient}, and our advisors are examining both its wording and its purpose. We neither dismiss it nor bow to it. A decision will be made when the council has met."
        ]
    },
    {
        name: "Insult",
        keywords: ["insult*", "mock*", "coward*", "fool*", "weak"],
        replies: [
            "Your remarks have reached {recipient}'s court, {sender}. Our envoys have been instructed not to answer in anger. Whether this deserves a reply is a matter for the council to decide.",
            "{recipient} has heard what you had to say about us. Insults are easily spoken and just as easily remembered, and this one has been written into the record. We will say more when we see fit.",
            "Your words were noted, {sender}, and passed along to those who decide such matters. {recipient} will not be hurried into a response. Take care that you mean what you have said."
        ]
    },
    {
        name: "Embargo",
        keywords: ["embargo*", "sanction*", "blockad*", "boycott*"],
        replies: [
            "{recipient}'s ministers of trade are reviewing the restrictions you have proposed, {sender}. Every route, port, and contract that would be affected is being counted. A response will follow once the full cost is understood.",
            "Your embargo has been entered into the record, and {recipient}'s merchants are already asking questions about it. The treasury is studying how deeply it would cut. We will answer when our position is clear.",
            "Such measures reach far beyond a single border, {sender}. {recipient} is weighing the effect on its ports, its merchants, and its neighbors before saying anything further."
        ]
    },
    {
        name: "Spy",
        keywords: ["spy", "spies", "infiltrat*", "sabotag*", "steal secrets"],
        replies: [
            "{recipient} has no comment on matters of this nature, {sender}. Such subjects are not discussed openly, and certainly not in writing. If you have something to say, choose your words with care.",
            "Whatever you are hinting at, we neither confirm nor deny it. {recipient}'s offices do not discuss the quiet work done in the shadows. This conversation will not continue along these lines.",
            "Your message has been received, though {recipient} would prefer that it had not been sent. Matters of this kind are best left unspoken, {sender}. Consider this the end of the discussion."
        ]
    },
    {
        name: "Demand tribute",
        keywords: ["tribute", "demand", "surrender*", "submit*"],
        replies: [
            "Your demand has been delivered to {recipient}'s council, {sender}. Our ministers are examining its terms, and whether it merits an answer at all. {recipient} does not bend quickly to the words of others.",
            "{recipient} has noted your terms and the tone in which they were presented. Demands are not the usual way to open a conversation, and our court will remember that. A reply will come, or it will not, as the council decides.",
            "We have read your demand carefully, {sender}. The matter has been placed before our advisors, who will weigh what you ask against what you offer. Until then, {recipient} promises nothing."
        ]
    },

    // ---------- Diplomatic ----------
    {
        name: "Alliance",
        keywords: ["allian*", "ally", "allies", "pact", "join forces"],
        replies: [
            "{recipient} is open to discussing a closer relationship, {sender}. Our council will review what such an alliance would require of us and what it would offer in return. Nothing has been decided yet, but your proposal is being taken seriously.",
            "Your proposal of alliance has been placed before our advisors. They are considering our other commitments, our neighbors, and the obligations that would follow. {recipient} will send word once the matter has been thoroughly discussed.",
            "An interesting offer, {sender}. Alliances bind nations for years, and {recipient} does not enter into them lightly. Our diplomats will study the terms and come back to you with questions."
        ]
    },
    {
        name: "Peace",
        keywords: ["peace", "ceasefire", "truce", "armistice"],
        replies: [
            "{recipient} has received your call for peace, {sender}, and our council will consider it with care. Peace is a worthy goal, but it must be one that can last. We will respond once we have weighed the terms.",
            "Your offer of a truce has been noted. Our ministers are reviewing what the end of hostilities would mean for our people, our borders, and our honor. {recipient} will reply when that review is complete.",
            "The word of peace carries weight in {recipient}'s court, {sender}. We will not dismiss it, nor will we accept it blindly. Our envoys are preparing their questions."
        ]
    },
    {
        name: "Treaty",
        keywords: ["treaty", "treaties", "agreement", "sign", "negotiat*"],
        replies: [
            "{recipient} will review the proposed terms, {sender}, before committing to anything. Our diplomats are reading every clause, since agreements made in haste tend to be regretted. They will report back to the council shortly.",
            "Your treaty draft has been delivered to our scribes and ministers, who will examine it line by line. {recipient} is willing to negotiate, but only once we understand exactly what is being asked. A response will follow.",
            "An agreement between our nations could be valuable, {sender}, if the terms are fair to both sides. Our council is studying your proposal and will send its observations soon."
        ]
    },
    {
        name: "Request aid",
        keywords: ["aid", "help", "assist*", "support"],
        replies: [
            "Your request for assistance has reached {recipient}, {sender}. Our ministers are examining what we could offer and what it would cost us to do so. A decision will follow once the council has met.",
            "{recipient} has heard your appeal and has not taken it lightly. Our advisors are reviewing our own needs before promising anything to others. You will receive an answer in due time.",
            "We have received word of your need, {sender}. The council will consider what help is possible, and on what terms. Until then, {recipient} makes no promises either way."
        ]
    },
    {
        name: "Apologize",
        keywords: ["apolog*", "sorry", "forgive*", "regret"],
        replies: [
            "Your apology has been received, {sender}, and {recipient} will take it under consideration. Words of regret are not forgotten, but they are not always enough. Our court will decide in time how to respond.",
            "{recipient} acknowledges your words and will reflect on them. Whether this matter can be put behind us is a decision for the council, not for any single voice. We will let you know what is decided.",
            "Our envoys have noted your apology, {sender}. {recipient} does not hold grudges lightly, but it does not forget either. The matter has been passed to our ministers."
        ]
    },
    {
        name: "Open relations",
        keywords: ["greet*", "hello", "meet", "embass*"],
        replies: [
            "Greetings, {sender}. {recipient} welcomes your message and is pleased to hear from you. Our court is willing to listen to whatever you wish to discuss.",
            "{recipient} acknowledges your overture and is willing to hear more. First contact between nations is a delicate matter, and we would like to do it properly. Our envoys are at your disposal.",
            "Your message has been received with courtesy, {sender}. {recipient} is open to establishing a more formal line of contact. Tell us what you have in mind, and we will consider it."
        ]
    },

    // ---------- Economic and resources ----------
    {
        name: "Trade",
        keywords: ["trade", "trading", "buy", "sell", "exchange", "goods"],
        replies: [
            "{recipient}'s merchants will review your trade proposal, {sender}. Our ministers are weighing the goods, the routes, and the prices involved. A response will follow once the figures have been studied.",
            "Your offer of exchange has been noted. Terms will need to be discussed in detail, since {recipient}'s traders are cautious about agreements they cannot measure. We will send our questions shortly.",
            "Commerce between our nations could benefit us both, {sender}. Our treasury is examining the proposal and what it would mean for our own markets. {recipient} will come back to you with its position."
        ]
    },
    {
        name: "Gift",
        keywords: ["gift*", "give", "giving", "donat*", "offer"],
        replies: [
            "{recipient} has received your gift, {sender}, and it has been entered into the record. Our court will consider how best to respond to such a gesture. A reply will follow in time.",
            "Your offering has arrived at {recipient}'s court. Gifts between nations carry meaning beyond their value, and our ministers are considering what yours intends. We will respond when we understand it better.",
            "A generous gesture, {sender}. {recipient} does not accept such things without thought, and our advisors are reviewing it carefully. You will hear from us soon."
        ]
    },
    {
        name: "Loan",
        keywords: ["loan", "borrow", "lend", "debt"],
        replies: [
            "{recipient}'s treasury will examine your request, {sender}. Questions of finance require careful thought, especially when they involve repayment. We will reply once our ministers have reviewed the terms.",
            "A matter of coin is never decided quickly in our court. {recipient}'s advisors are studying how much could be spared and what guarantees would be needed. A response will be sent in time.",
            "Your request regarding a loan has been passed to our treasury. Our ministers are reviewing the risks and what it would mean for our own finances. {recipient} will let you know what is decided."
        ]
    },
    {
        name: "Crystals",
        keywords: ["crystal", "ember", "light crystal"],
        replies: [
            "{recipient} takes great interest in matters concerning crystals, {sender}. Few subjects are guarded as closely in Gaeia, and our council will consider your words with care. We will respond once we have decided how much to say.",
            "Crystals are not discussed lightly, and your message has been noted at the highest levels of {recipient}'s court. Our advisors are examining what you are asking and what it could mean. Do not expect a quick answer.",
            "Your mention of crystals has drawn the attention of our ministers, {sender}. Such matters touch on power, trade, and security all at once. {recipient} will reply when the council has met."
        ]
    },

    // ---------- Other ----------
    {
        name: "Migration or refuge",
        keywords: ["refuge*", "asylum", "migrat*", "shelter"],
        replies: [
            "Your request regarding refuge has been received by {recipient}'s court, {sender}. Our ministers are reviewing what we can offer and what it would cost our own people. We will give you an answer once the matter has been studied.",
            "{recipient} has noted your concern for those seeking shelter. Questions of this kind involve borders, resources, and responsibility, and the council will consider all three. A reply will follow.",
            "Those in need are not ignored in our court, {sender}, but neither can we promise what we cannot provide. Our advisors are examining the request and will report back soon."
        ]
    },
    {
        name: "Puppet or annex",
        keywords: ["annex*", "puppet", "vassal", "protectorate"],
        replies: [
            "Such a proposal weighs heavily, {sender}. {recipient} will consider it with great care, since questions of sovereignty are never decided lightly. Our council has been gathered to discuss it.",
            "{recipient} has received your words on sovereignty and will respond in due time. Matters like these touch on the independence of nations, and our advisors are examining every consequence. We will be in touch.",
            "Your proposal has been placed before our highest advisors, {sender}. A decision of this kind could shape the future of more than one nation, and {recipient} intends to move carefully. A response will follow when we are ready."
        ]
    }
];

// Used when no keyword matches
const fallbackReplies = [
    "{recipient}'s envoy stares at you blankly, {sender}. The message reached the court, but its meaning was lost somewhere along the way. Perhaps try rephrasing what you wish to say.",
    "Your message arrived in {recipient}, but no one in the court could make sense of what you are asking. Our ministers have asked that you state your intentions more plainly. Until then, there is little we can do.",
    "{recipient}'s advisors read your words several times, {sender}, and still could not agree on their meaning. Try again with a clearer request, such as an alliance, a trade offer, or a declaration of intent."
];

/*
  NATION PERSONALITIES
  --------------------
  Special nations with their own replies. When the recipient has an entry here,
  its replies are used instead of the generic ones above.
    actions   - replies for each action, matched by the action's name
    fallback  - replies for when no keyword matches
  Any action a nation has no entry for uses the generic replies.
  The nation name must match the dropdown exactly.
*/

const nationReplies = {
    "Carmine Empire": {
        actions: {
            "War": [
                        "A declaration of war is a costly instrument, {sender}, and the Empire's ledgers do not lie. Our treasurers are calculating what such a conflict would cost, who profits from it, and who pays. Our foundries and merchant houses will be consulted before we answer.",
                        "{recipient} has received your declaration and has instructed its quartermasters to prepare a full accounting of the costs. War is simply the most expensive form of negotiation, and we have never entered one without knowing the price. A formal reply will follow once the numbers are in."
            ],
            "Threaten": [
                        "Your threat has been entered into our records as a liability, {sender}. The Empire does not bargain under pressure, but its treasurers will assess whether the risk to our interests is real. Until then, we advise you to consider what you stand to lose.",
                        "{recipient} notes your warning and has asked its trade ministers to review any exposure you could affect. Intimidation is a poor basis for commerce, and we prefer partners who understand that. A measured reply will come once the risk has been priced."
            ],
            "Insult": [
                        "Your remarks have been logged, {sender}, though the Empire does not trade in offense. Reputation, however, is an asset, and we do take note of those who spend theirs carelessly. {recipient} will answer when it is profitable to do so.",
                        "Insults cost nothing to deliver and a great deal to repair. Our court has recorded yours and will factor it into any future dealings with you. For now, the Empire has more productive matters to attend to."
            ],
            "Embargo": [
                        "An embargo is a matter the Empire follows closely, {sender}, since our merchant fleets reach nearly every port in Gaeia. Our ministers of trade are tallying the contracts, shipments, and tariffs that would be affected. We will respond once the losses and the leverage are both clear.",
                        "{recipient}'s trade houses are already reviewing what your proposed restrictions would cost them. Such measures cut both ways, and the Empire has never been shy about counting the damage on both sides. Expect a precise and unsentimental reply."
            ],
            "Spy": [
                        "The Empire has no comment on matters of intelligence, {sender}. We do, however, keep very good books on who asks such questions. Should you wish to discuss information, {recipient} prefers to do so through proper commercial channels.",
                        "Such matters are not discussed in writing, and certainly not for free. Our offices have noted your message and will treat it as an expression of interest in our affairs. We suggest you be careful what interest you show."
            ],
            "Demand tribute": [
                        "Your demand has been received, {sender}, and priced accordingly. The Empire does not hand over wealth without a return, and our treasurers see none here. If you wish to discuss terms that benefit both parties, our merchants are ready to listen.",
                        "{recipient} is no stranger to demands, but the Empire pays only for things it values. Our ministers are reviewing what you offer in exchange, which at present appears to be very little. Present a proper proposal and we will consider it."
            ],
            "Alliance": [
                        "An alliance is, at its core, a contract, {sender}, and the Empire reads every clause. Our ministers are examining what each side would owe the other, what each would gain, and what happens if either defaults. {recipient} will respond once the terms have been properly assessed.",
                        "Your proposal interests us, provided it is profitable for both sides. The Empire's merchant houses and treasury are reviewing the benefits of closer cooperation, from shared markets to shared defense. A detailed response will follow."
            ],
            "Peace": [
                        "Peace is almost always better for business, {sender}, and the Empire is not blind to that. Our ministers are reviewing the terms, the cost of continued conflict, and the opportunities that would reopen. {recipient} will reply once the figures have been weighed.",
                        "Your call for a truce has reached our treasury, where it has been well received in principle. War drains coffers on all sides, and our advisors are studying whether an end to it can be made profitable. We will send our terms shortly."
            ],
            "Treaty": [
                        "Treaties are our specialty, {sender}. Our scribes and merchant lawyers are reading your draft line by line, looking for tariffs, obligations, and anything hidden in the fine print. {recipient} will return it with amendments.",
                        "The Empire is always willing to negotiate, so long as the terms are clear and enforceable. Our ministers are reviewing your proposal and calculating what each article would cost and earn us. A counter-offer will follow."
            ],
            "Request aid": [
                        "Your request has reached {recipient}, {sender}, and our treasurers have begun assessing what assistance would cost. The Empire is not a charity, but it does value good partners. Tell us what you can offer in return, and we will consider your appeal.",
                        "Aid is an investment like any other, and our ministers are reviewing the likely return on this one. {recipient} will weigh the risk, the cost, and the benefit to our own interests. Expect a reply once the accounts are balanced."
            ],
            "Apologize": [
                        "Your apology has been received and recorded, {sender}. The Empire values a clean ledger, and goodwill can be restored with the right gesture. Our ministers will decide whether words alone are enough.",
                        "{recipient} accepts that errors happen and that costs follow from them. Our court is reviewing whether your apology settles the matter or whether compensation would be more appropriate. A reply will follow."
            ],
            "Open relations": [
                        "Greetings, {sender}. The Empire is always glad to hear from new partners, and our merchants are eager to learn what you might offer. Our envoys are at your disposal, should you wish to discuss opportunities of mutual benefit.",
                        "{recipient} welcomes your message and the possibility of closer ties. Every great partnership begins with an introduction, and ours is open to receive yours. Tell us what interests you, and we will see what can be arranged."
            ],
            "Trade": [
                        "Now this is a conversation the Empire enjoys, {sender}. Our merchants are reviewing your proposal, from goods and quantities to prices and routes. {recipient} will return with terms once the margins have been examined.",
                        "Commerce is the lifeblood of the Empire, and your offer has been passed to our trade ministers with interest. They will assess the demand, the shipping costs, and the profit on both sides. Expect a detailed counter-proposal soon."
            ],
            "Gift": [
                        "A gift has arrived, {sender}, and the Empire has noted it with interest. We do not believe in free gestures, so our ministers are considering what you hope to gain by it. {recipient} will respond once we understand your intent.",
                        "Your offering has been received and recorded in the ledger as a credit in your favor. The Empire remembers its debts, and it remembers generosity as well. A fitting reply will follow."
            ],
            "Loan": [
                        "Lending is the Empire's oldest trade, {sender}. Our treasurers are reviewing your request, the interest that would be fair, and the collateral that would be required. {recipient} will send terms once your credit has been assessed.",
                        "{recipient}'s treasury is willing to discuss a loan, but only on proper terms. Our ministers are examining the risk, the repayment schedule, and what security you can offer. Do not expect charity, only a fair rate."
            ],
            "Crystals": [
                        "Crystals are among the most valuable commodities in Gaeia, {sender}, and the Empire watches their market closely. Our ministers are reviewing your words and what they would mean for supply, price, and power. {recipient} will reply once we know how much your interest is worth.",
                        "Your mention of crystals has been passed to our highest trade advisors. Such resources shape the balance of wealth and arms, and the Empire does not speak of them without careful calculation. A response will follow in time."
            ],
            "Migration or refuge": [
                        "Your request regarding refuge has reached {recipient}, {sender}. Our ministers are calculating the cost of housing and feeding those in need, as well as what labor and goodwill they might offer in return. A decision will follow.",
                        "The Empire has always valued skilled hands, and our advisors are considering what those seeking shelter could contribute. Settlement requires land, coin, and order, all of which must be accounted for. We will respond once the plan is costed."
            ],
            "Puppet or annex": [
                        "Questions of sovereignty are expensive ones, {sender}. The Empire's ministers are assessing what such an arrangement would cost to establish, to maintain, and to defend, against what it would earn. {recipient} will respond once the full ledger is complete.",
                        "Your proposal has been placed before our treasury and our council. The Empire has built its fortune on knowing which acquisitions pay for themselves and which do not. A reply will follow after careful review."
            ]
        },
        fallback: [
            "The Empire's clerks have read your message several times, {sender}, and still cannot find the transaction in it. {recipient} values clarity above all else in its dealings. Please state plainly what you are offering or requesting.",
            "Your message arrived, but its purpose was unclear, and the Empire does not act on unclear terms. Our ministers suggest you resubmit your request, preferably with specific details, such as a trade offer, a treaty, or a loan."
]
    }
};
