/*
  CHESS EASTER EGG: DRAVEN MORDE AND CARMILLA CARMINE
  ---------------------------------------------------
  Typing a chess challenge (for example "I want to play Chess") to the
  Carmine Empire summons Draven Morde, Head of the Bureau of Civil Reform and
  Internal and External Affairs, for a game. The visitor chooses White or Black,
  then clicks a piece and a highlighted square.

  Beating Draven earns an introduction to his wife, Carmilla Carmine, Ruler of the
  Carmine Empire. Her game can also be reached early by clicking the bottom-left
  brass corner of the chess window: Draven asks if you are sure, and a Proceed
  button replaces the White/Black choice. Carmilla plays a stronger, more
  unpredictable game (see bestMoveStyled in chess.js). Beating HER makes the
  Carmine Empire a permanent ally of the visitor's nation.

  All of the dialogue is in this file, so it is easy to edit. To give Carmilla a
  portrait, save an image called carmilla.png next to draven.png (a full-length
  picture with a transparent background works best; only the top part is shown).
  Needs chess.js (the engine) and the #modal-chess window in index.html.
*/

// How many moves ahead Draven looks. 3 is quick and beatable; 4 is stronger but slower.
const DRAVEN_DEPTH = 4;

// Carmilla searches up to maxDepth moves ahead but never thinks longer than timeMs milliseconds.
const CARMILLA_SEARCH = { maxDepth: 5, timeMs: 2200 };

// The visitor plays this colour against Carmilla ("b" = Black, so she opens)
const CARMILLA_PLAYER_COLOR = "b";

// Who the visitor is playing: the name and title shown in the window, and the portrait file
const CHESS_OPPONENTS = {
    draven: {
        name: "Draven Morde",
        title: "Head of the Bureau of Civil Reform and Internal and External Affairs",
        image: "draven.png",
        pronoun: "his"
    },
    carmilla: {
        name: "Carmilla Carmine",
        title: "Ruler of the Carmine Empire and CEO of Carmine Industries",
        image: "carmilla.png",
        pronoun: "her"
    }
};

// Draven's reply in the response box when the challenge is accepted.
// {sender} and {recipient} are replaced with the chosen nations.
const dravenIntroReplies = [
    "Draven Morde, Head of the Bureau of Civil Reform and Internal and External Affairs, has stepped forward to answer your challenge, {sender}. He says the Empire believes a good game is the finest form of diplomacy, and that he has been hoping for a visitor with such confidence. You will play White.",
    "Word of your challenge has reached the Head of the Bureau of Civil Reform and Internal and External Affairs, {sender}, and Draven Morde has accepted it personally. He wishes it known that he never refuses a match with a favorable public image, particularly when it is his own. The board awaits, and the first move is yours.",
    "The court of {recipient} sends word, {sender}: Draven Morde, Head of the Bureau of Civil Reform and Internal and External Affairs, will play you. He insists the match be described as friendly in all official records, and that you not read too much into his enthusiasm. Take the white pieces and begin whenever you are ready."
];

// Things Draven says during the game, grouped by what just happened
const dravenLines = {
    choose: [
        "Do choose a side. Most people pick White and call it politeness. I would simply call it optimism.",
        "White or Black, then? Take your time. I have all the patience a Councilor of Public Relations is required to pretend to have.",
        "A small decision before we begin: which color would you like to lose with? Do not answer too quickly. It looks eager."
    ],
    startBlack: [
        "Black, is it? How patient. I will begin, and you may react. It is, after all, the traditional division of labor in public life.",
        "You prefer to respond rather than lead. A very senior instinct. Very well, I will take the opening statement.",
        "Ah, Black. I do enjoy being asked to speak first. It means I get to set the tone."
    ],
    start: [
        "Please, sit. In my experience, the people who challenge me to a game are the same ones who later request a meeting. You may have White, a courtesy I will be mentioning later.",
        "Ah, a challenger. How refreshing. I do so enjoy it when a guest volunteers to be a case study.",
        "Draven Morde, Civil Reform and Internal and External Affairs. I manage the Empire's reputation at home and abroad, which is a polite way of saying I have already won several arguments you have not had yet. Do begin.",
        "I would wish you luck, but I find luck is mostly what people call preparation they did not do.",
        "Welcome. Do relax. Nothing about this game is on the record, which is the only reason I am being so honest."
    ],
    playerCapture: [
        "You took a piece. How bold. I will make sure it is remembered as a learning experience for someone.",
        "A capture. I do admire a person who acts before reading the fine print.",
        "Mm. That one was mine, but I understand that boundaries are a developing concept for some nations.",
        "Take it, please. I have always said that generosity is the cheapest form of strategy.",
        "How decisive. And how very visible. I do hope you have a statement prepared.",
        "Splendid. You have clearly confused having an opportunity with having a plan."
    ],
    dravenCapture: [
        "I do apologize. I thought that piece was available. It was standing so confidently, after all.",
        "A small acquisition. I will send you a very warm note about it.",
        "Do not worry. I will describe it to the press as a misunderstanding on your side of the board.",
        "Your piece has been welcomed into Carmine management. We are told the benefits are excellent.",
        "There. See how smoothly that went? That is what planning looks like, in case you were wondering.",
        "Another one, I am afraid. At this rate, we may need to schedule a review of your arrangements."
    ],
    check: [
        "Your king looks a little tense. Shall I have a statement prepared?",
        "I hate to interrupt, but your king has become a matter of public concern.",
        "A gentle reminder that your king is rather exposed at the moment. Nothing to panic about. Yet.",
        "Check. Please take a moment. I would not want you to answer in haste, though everyone does.",
        "Your king appears to be under review. I am sure it will go perfectly well."
    ],
    playerCheck: [
        "Check. How forward. I will describe it as an unfortunate misunderstanding.",
        "Oh, direct pressure. The Empire values directness, within reason and within a budget.",
        "Careful. That is the kind of move that makes headlines. Unfavorable ones, usually.",
        "My king, concerned? Never. I was planning to move him anyway.",
        "A threat to my king. How charming. Do keep it up, it makes what comes next so satisfying."
    ],
    playerQueenCapture: [
        "My queen. Well. I shall be calling that a strategic divestment, and I will say it with a perfectly straight face.",
        "You took my queen. I will describe it as a restructuring. You may describe it however you like, for now.",
        "Bold. Reckless, perhaps, but bold. Do enjoy it. Public goodwill is fleeting, and so is a material advantage."
    ],
    dravenQueenCapture: [
        "Your queen has retired. We hope she enjoys her new position. It is quite comfortable here.",
        "I am so sorry about your queen. I will be sending flowers, and the invoice, to your nation.",
        "Ah. There goes the most important member of your delegation. I do hope there is a backup."
    ],
    playerCastle: [
        "Castling already? A sensible instinct. I, too, like to put things behind walls when the press arrives.",
        "Safe at last. How prudent. I do respect a leader who knows when to hide behind a rook.",
        "Tucking your king away. Very wise. The best kings are the ones nobody can reach for comment."
    ],
    dravenCastle: [
        "Excuse me while I secure the premises. The Empire does not hold meetings in exposed locations.",
        "A brief tidy-up. One must always protect the principal asset, and the principal asset is me.",
        "There. Safe, comfortable, and entirely unbothered. You may continue."
    ],
    playerPromote: [
        "A new queen. Congratulations. I will see to it that the Empire's response is gracious and entirely scripted.",
        "Oh, a promotion. Even in a game, someone is always trying to rise above their station. I admire it.",
        "Well, you have certainly been busy. Do let me know when you are finished consolidating."
    ],
    dravenPromote: [
        "A promotion, it seems. Do not take it personally. It was entirely a merit decision.",
        "Allow me to introduce my newest advisor. She has a great deal of authority and no sense of humor."
    ],
    idle: [
        "Interesting. I will need a statement for that one.",
        "Take your time. A good press release should never be rushed, and neither should a bad one.",
        "I have a feeling about this position. It is mostly a feeling that it is mine.",
        "Everything is proceeding exactly as planned. That is what I will say regardless.",
        "The best diplomacy is a long silence and a calm face. Both are on offer.",
        "I do enjoy a game where no one has said anything they will regret. Yet.",
        "You play like someone who reads the first page of the briefing. Admirable. Brief.",
        "Mm. Yes. Go on. I am simply taking notes.",
        "I see you have a plan. How lovely. I do so love a plan. They are so much easier to respond to.",
        "I want you to know that I am enjoying this enormously, and that you should not take that as a compliment."
    ],
    // Beating Draven earns an introduction to his wife (the Proceed button appears)
    offerCarmilla: [
        "Checkmate. Remarkably well played, and I will say no more about it in public. Now, my wife has heard of your victory and would like a game of her own. She is Ruler of the Carmine Empire, you understand, and she does not make a request twice. Do you wish to proceed?",
        "You have beaten me. How refreshing. I would like to say I let you win, but she will hear of it either way. Carmilla, my wife, would very much like to play you. She is considerably less forgiving than I am. Shall we proceed?",
        "Well. That was unexpected, and I am told that is the highest compliment I am permitted to give. My wife wishes to meet you across the board. Win, and the Empire's friendship is yours. Lose, and it will be a short conversation. Do you wish to proceed?"
    ],
    // Draven's warning when the brass corner is clicked
    confirmCarmilla: [
        "Ah. You have found the corner. Hardly anyone looks there. Are you certain you wish to proceed? My wife does not play for sport, and she dislikes being interrupted.",
        "That corner has led better people than you into worse rooms. Are you quite sure about this? I can hold your coat, but I cannot hold the board.",
        "You wish to be introduced to Carmilla. Do consider it carefully. I have lost to her more often than I have admitted to anyone, including her."
    ],
    cancelCarmilla: [
        "Wise. Very wise. Shall we return to our own, much friendlier, game?",
        "A sensible retreat. I will tell no one, which is, you will find, a very large favor.",
        "Of course. Some doors are better admired than opened. Choose your side."
    ],
    cornerBusy: [
        "That corner will still be there when we are finished. I do not like being interrupted mid-game, and neither, I promise, does she.",
        "Patience. You cannot leave my table to find hers. Finish what you started.",
        "Curious, are we? Finish the game first. My wife appreciates people who finish things."
    ],
    resign: [
        "You resign. A sensible decision, and I shall describe it in the press as a strategic withdrawal.",
        "Resignation accepted. You leave with your dignity, which is more than most manage.",
        "Conceding already? Do come back when you are feeling less reasonable."
    ],
    dravenWin: [
        "Checkmate. Do not be discouraged. I will describe it as a mutually educational experience, with me as the educator.",
        "And that is the game. A fine result for the Empire, and a very instructive one for you. Please, let us do this again.",
        "Checkmate. I want you to know I enjoyed it enormously, which I recognize is the worst thing I could possibly say."
    ],
    draw: [
        "A draw. The most diplomatic of all outcomes, and the least satisfying. I intend to call it a partnership.",
        "Neither side prevails. I shall describe it as a lasting understanding, and we will both pretend to be pleased."
    ]
};

// Carmilla Carmine's lines. The names match Draven's table above, so a key such as
// "dravenCapture" simply means "the opponent captured a piece" and is used for her too.
const carmillaLines = {
    start: [
        "Sit. You asked for an audience, and the Empire does not waste its mornings. Begin.",
        "You have found your way to my table. Few do. Fewer leave with their confidence intact."
    ],
    startBlack: [
        "Sit. You asked for an audience with the Empire, and the Empire does not waste its mornings. I will open. You will answer, as everyone eventually does.",
        "My husband tells me you defeated him. How charming. He is paid to lose gracefully. I am not.",
        "Take the black pieces. It is fitting that you should begin in the dark.",
        "I have signed treaties, broken cartels and closed entire industries before breakfast. Do try to be more interesting than a Tuesday."
    ],
    playerCapture: [
        "You took it. Collect your trophies. I always let the small ones feel they have won something.",
        "Do you know what I do with an asset that has been overvalued? I let someone else carry the loss.",
        "A bold acquisition. Enjoy the paperwork.",
        "That was a loan, not a gift. Interest is due.",
        "How confident. Confidence is the most expensive thing anyone can buy from me, and you have just paid in full."
    ],
    dravenCapture: [
        "Mine now. Everything on this board eventually is.",
        "A hostile acquisition. Do keep still. It will be over soon.",
        "You left that unprotected. I do not believe in leaving things unprotected, and I do not believe in forgiving it.",
        "Thank you. I do appreciate a generous opponent.",
        "Another one. I shall have it framed.",
        "Do not look away. Watching is the least you can do."
    ],
    check: [
        "Your king looks nervous. As he should.",
        "Check. Run, if you like. It will not change what is behind you.",
        "Move your king, or do not. I have time.",
        "There is no shame in fear. There is only a shortage of squares.",
        "Check. I have retired better opposition with quieter moves."
    ],
    playerCheck: [
        "You dare to threaten my king. In my own house. Noted.",
        "A check. How brave. I will remember it fondly while I take you apart.",
        "Impressive. Now consider very carefully what you have woken.",
        "You have my attention. That is rarely a privilege."
    ],
    playerQueenCapture: [
        "You took my queen. Savor it. It is the last thing I will give you.",
        "My queen. Do you believe that was a mistake? It was an invitation.",
        "Well. That was expensive. For you, I mean."
    ],
    dravenQueenCapture: [
        "Your queen is mine. Your position was built on her. Now I own the foundation.",
        "Where is your queen now? Nowhere. That is the point.",
        "She served you well. I will find a use for her."
    ],
    playerCastle: [
        "Hide your king behind his walls. I have taken fortresses before. They merely take longer.",
        "Castling. Of course. People always run to what is familiar.",
        "A fortress. I do so enjoy the sound of one being tested."
    ],
    dravenCastle: [
        "My king is secure. Yours should have considered it earlier.",
        "I cannot be reached. Whether the same applies to you is another matter.",
        "There. Now I may concentrate entirely on you."
    ],
    playerPromote: [
        "A new queen. Impressive. Do not mistake it for victory. You have merely given me a better target.",
        "A promotion. I had hoped to reach one first.",
        "Ambition. I admire it, and I intend to punish it."
    ],
    dravenPromote: [
        "Observe. Even my pawns rise. Yours, I note, do not.",
        "A queen of my own. There is no appeal."
    ],
    idle: [
        "Take your time. I will remember every second of it.",
        "I am not impatient. I simply never forget.",
        "Interesting. Almost interesting enough to be a plan.",
        "Every move you make is a signature. I am reading all of them.",
        "You play as though someone told you that you could win. Who was it?",
        "Quiet. The best positions are built in silence, and then used.",
        "I have overseen hostile takeovers on three continents. This is a rehearsal.",
        "Do continue. I find your hope very useful.",
        "I am your opponent. I am also your supplier, your lender and, if you stay long enough, your employer.",
        "Every piece you move is already accounted for. Even that one."
    ],
    allianceWin: [
        "Checkmate. Do not look so pleased. I will not tolerate an enemy who defeats me, and I will not tolerate an ally who cannot. The Empire's foundries are yours. Do not make me regret the invoice.",
        "Well. It seems the Empire underestimated you, which is a mistake I do not make twice. As of this moment you are an ally of the Carmine Empire. Consider it a promotion, and consider it a leash."
    ],
    playerWin: [
        "Checkmate. Again. You are becoming a habit, and I do not keep habits. I keep investments.",
        "Take your victory. I will remember it as the last one you were permitted."
    ],
    resign: [
        "You resign. Wise. I would have taken it from you either way, but this saves us both the formalities.",
        "Surrender, then. I will have it recorded that you chose it, so no one may say I forced your hand.",
        "Leaving so soon? Everyone does, in the end. Draven will see you out."
    ],
    dravenWin: [
        "Checkmate. You were never going to leave this room with anything of mine.",
        "It is done. Draven will see you out. Do try not to look back.",
        "That is the game. Do not feel poorly. Everyone loses to me eventually. You merely did it faster."
    ],
    draw: [
        "A draw. How unsatisfying. I do not make a habit of accepting them, so consider this a courtesy that will not be repeated.",
        "Neither of us has won. I will not forget which one of us was relieved."
    ]
};

const chessResultText = {
    playerWin: "Checkmate. You win!",
    dravenWin: "Checkmate. Draven Morde wins.",
    resign: "You resigned.",
    "draw:stalemate": "Stalemate. The game is a draw.",
    "draw:insufficient": "Draw by insufficient material.",
    "draw:fiftymove": "Draw by the fifty-move rule.",
    "draw:repetition": "Draw by repetition."
};

// Filled symbols for both colors; the CSS colors them white or black.
// \uFE0E stops some devices from turning them into emoji.
const chessGlyphs = {
    K: "\u265A\uFE0E", Q: "\u265B\uFE0E", R: "\u265C\uFE0E",
    B: "\u265D\uFE0E", N: "\u265E\uFE0E", P: "\u265F\uFE0E"
};

const chessBoardEl = document.getElementById("chess-board");
const chessStatusEl = document.getElementById("chess-status");
const chessQuoteEl = document.getElementById("chess-quote");
const chessWhiteButton = document.getElementById("chess-play-white");
const chessBlackButton = document.getElementById("chess-play-black");
const chessProceedButton = document.getElementById("chess-proceed");
const chessResignButton = document.getElementById("chess-resign");
const chessNewGameButton = document.getElementById("chess-new-game");
const chessSecretButton = document.getElementById("chess-secret");
const chessBoxEl = document.getElementById("chess-box");
const chessOpponentEl = document.getElementById("chess-opponent");
const chessFigureEl = document.getElementById("chess-figure");
const chessPortraitEl = document.getElementById("chess-portrait");

let chessState = null;
let chessLegalMoves = [];
let chessSelected = null;
let chessLastMove = null;
let chessPositionCounts = {};
let chessGameOver = false;
let chessResult = null;
let chessThinking = false;
let chessLastQuote = "";
let chessSender = "";            // the visitor's nation, who becomes the ally if they win
let chessAllianceFormed = false;
let chessPlayerColor = null;     // "w" or "b" once the visitor has chosen a side
let chessGameId = 0;    // lets an old game's pending move be ignored when a new game starts
let chessOpponent = "draven";    // "draven" or "carmilla"
let chessProceedMode = null;     // null, "confirm" (corner clicked) or "offer" (Draven was beaten): shows Proceed instead of the side buttons
let chessPlies = 0;              // half-moves played in the current game

// True when a message is asking to play chess, e.g. "I want to play Chess"
function isChessRequest(text) {
    const t = " " + text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
    return /\schess\s/.test(t) && /\s(play|game|match|challenge|duel)\w*\s/.test(t);
}

function chessDravenColor() {
    return chessPlayerColor === "w" ? "b" : "w";
}

function setActiveSideButton(color) {
    if (chessWhiteButton && chessWhiteButton.classList) {
        chessWhiteButton.classList.toggle("active", color === "w");
    }
    if (chessBlackButton && chessBlackButton.classList) {
        chessBlackButton.classList.toggle("active", color === "b");
    }
}

function chessOpponentName() {
    return CHESS_OPPONENTS[chessOpponent].name;
}

function setDravenQuote(eventName) {
    const lines = (chessOpponent === "carmilla" ? carmillaLines : dravenLines)[eventName];
    if (!lines) {
        return;
    }
    let line = lines[Math.floor(Math.random() * lines.length)];
    if (lines.length > 1 && "\u201C" + line + "\u201D" === chessLastQuote) {
        line = lines[(lines.indexOf(line) + 1) % lines.length];
    }
    chessLastQuote = "\u201C" + line + "\u201D";
    if (chessQuoteEl) {
        chessQuoteEl.textContent = chessLastQuote;
    }
}

function chessResultLine() {
    if (chessResult === "dravenWin") {
        return "Checkmate. " + chessOpponentName() + " wins.";
    }
    if (chessResult === "resign") {
        return "You resigned. " + chessOpponentName() + " wins.";
    }
    return chessResultText[chessResult] || "The game is over.";
}

function updateChessStatus() {
    if (!chessStatusEl || !chessState) {
        return;
    }
    if (chessProceedMode === "confirm") {
        chessStatusEl.textContent = "Draven Morde asks if you are sure. Press Proceed to continue.";
    } else if (chessProceedMode === "offer") {
        chessStatusEl.textContent = chessResultLine() + " Draven Morde would like you to face his wife. Press Proceed to accept.";
    } else if (!chessPlayerColor) {
        chessStatusEl.textContent = "Choose your side to begin.";
    } else if (chessGameOver) {
        chessStatusEl.textContent = chessResultLine() +
            (chessAllianceFormed ? " The Carmine Empire is now your ally!" : "");
    } else if (chessThinking) {
        chessStatusEl.textContent = chessOpponentName() + " is considering " + CHESS_OPPONENTS[chessOpponent].pronoun + " move...";
    } else if (ChessEngine.inCheck(chessState, chessPlayerColor)) {
        chessStatusEl.textContent = "Check! Your move.";
    } else {
        chessStatusEl.textContent = "Your move. You are playing " + (chessPlayerColor === "w" ? "White" : "Black") + ".";
    }
}

// Decides which single set of buttons is showing:
//   Proceed                 - Draven is asking about Carmilla (corner clicked, or he was beaten)
//   Play as White / Black   - Draven, before a game starts
//   Resign                  - while a game is in progress
//   Play a New Game         - once a game has ended (including by resigning)
function updateChessControls() {
    const proceeding = chessProceedMode !== null;
    const playing = !proceeding && chessPlayerColor !== null && !chessGameOver;
    const ended = !proceeding && chessPlayerColor !== null && chessGameOver;
    const choosing = !proceeding && chessPlayerColor === null;

    if (chessWhiteButton) { chessWhiteButton.hidden = !choosing; }
    if (chessBlackButton) { chessBlackButton.hidden = !choosing; }
    if (chessProceedButton) { chessProceedButton.hidden = !proceeding; }
    if (chessResignButton) { chessResignButton.hidden = !playing; }
    if (chessNewGameButton) { chessNewGameButton.hidden = !ended; }
}

// Switches the window between Draven and Carmilla: title, colours and portrait
function setChessOpponent(key) {
    chessOpponent = key;
    const who = CHESS_OPPONENTS[key];

    if (chessOpponentEl) {
        chessOpponentEl.textContent = who.name + ", " + who.title;
    }
    if (chessBoxEl) {
        chessBoxEl.classList.toggle("carmilla", key === "carmilla");
    }
    if (!chessPortraitEl || !chessFigureEl) {
        return;
    }

    function onLoaded() {
        chessFigureEl.classList.remove("missing", "crest");
        if (chessPortraitEl.naturalWidth) {
            chessFigureEl.style.setProperty("--draven-ratio", (chessPortraitEl.naturalHeight / chessPortraitEl.naturalWidth).toFixed(3));
        }
    }
    function onMissing() {
        // No portrait file: Draven's figure is hidden, Carmilla gets a crest until carmilla.png exists
        chessFigureEl.classList.remove("missing", "crest");
        chessFigureEl.classList.add(key === "carmilla" ? "crest" : "missing");
    }

    chessPortraitEl.alt = who.name;
    chessPortraitEl.onload = onLoaded;
    chessPortraitEl.onerror = onMissing;
    if (chessPortraitEl.getAttribute("src") !== who.image) {
        chessPortraitEl.setAttribute("src", who.image);
    } else if (chessPortraitEl.complete) {
        if (chessPortraitEl.naturalWidth) { onLoaded(); } else { onMissing(); }
    }
}

function renderChessBoard() {
    if (!chessBoardEl || !chessState) {
        return;
    }

    const targets = {};
    if (chessSelected !== null) {
        chessLegalMoves.forEach(function (m) {
            if (m.from === chessSelected) {
                targets[m.to] = true;
            }
        });
    }

    const turn = chessState.turn;
    const checkSquare = ChessEngine.inCheck(chessState, turn)
        ? chessState.board.indexOf(turn === "w" ? "K" : "k")
        : -1;

    const flipped = chessPlayerColor === "b";
    let html = "";
    for (let d = 0; d < 64; d++) {
        const i = flipped ? 63 - d : d;
        const piece = chessState.board[i];
        let classes = "chess-square " + ((((i >> 3) + (i & 7)) % 2 === 0) ? "light" : "dark");

        if (i === chessSelected) { classes += " selected"; }
        if (targets[i]) { classes += piece ? " target capture" : " target"; }
        if (chessLastMove && (i === chessLastMove.from || i === chessLastMove.to)) { classes += " lastmove"; }
        if (i === checkSquare) { classes += " in-check"; }

        let content = "";
        if (piece) {
            const side = piece === piece.toUpperCase() ? "white" : "black";
            content = '<span class="chess-piece ' + side + '">' + chessGlyphs[piece.toUpperCase()] + "</span>";
        }
        html += '<div class="' + classes + '" data-index="' + i + '">' + content + "</div>";
    }
    chessBoardEl.innerHTML = html;
}

function refreshChess() {
    renderChessBoard();
    updateChessStatus();
    updateChessControls();
}

function recordChessPosition() {
    const key = ChessEngine.positionKey(chessState);
    chessPositionCounts[key] = (chessPositionCounts[key] || 0) + 1;
}

// Returns "playerWin", "dravenWin", "draw:<reason>", or null if the game goes on
function checkChessEnd() {
    const status = ChessEngine.gameStatus(chessState);
    if (status === "checkmate") {
        return chessState.turn === chessDravenColor() ? "playerWin" : "dravenWin";
    }
    if (status !== "ongoing") {
        return "draw:" + status;
    }
    if ((chessPositionCounts[ChessEngine.positionKey(chessState)] || 0) >= 3) {
        return "draw:repetition";
    }
    return null;
}

function finishChessGame(result) {
    chessGameOver = true;
    chessThinking = false;
    chessResult = result;
    chessLegalMoves = [];
    chessSelected = null;

    // Beating Carmilla makes the Carmine Empire a permanent ally of the visitor's nation
    if (result === "playerWin" && chessOpponent === "carmilla" && chessSender && typeof addAlliance === "function") {
        chessAllianceFormed = addAlliance("Carmine Empire", chessSender);
    }

    if (result === "playerWin" && chessOpponent === "draven") {
        // Beating Draven earns an introduction to his wife
        chessProceedMode = "offer";
        setDravenQuote("offerCarmilla");
    } else if (result.indexOf("draw") === 0) {
        setDravenQuote("draw");
    } else {
        setDravenQuote(result === "playerWin" && chessAllianceFormed ? "allianceWin" : result);
    }
    refreshChess();

    if (chessAllianceFormed && typeof announceAlliance === "function") {
        announceAlliance("Carmine Empire", chessSender);
    }
}

// Decides which kind of comment (if any) a move deserves
function chessMoveEvent(move, who, givesCheck) {
    const prefix = who === "player" ? "player" : "draven";

    if (move.promo) {
        return prefix + "Promote";
    }
    if (move.captured && move.captured.toUpperCase() === "Q") {
        return prefix + "QueenCapture";
    }
    if (move.captured) {
        return prefix + "Capture";
    }
    if (move.flag === "castleK" || move.flag === "castleQ") {
        return prefix + "Castle";
    }
    if (givesCheck) {
        return who === "player" ? "playerCheck" : "check";
    }
    return null;
}

function chessPlayerMove(move) {
    chessState = ChessEngine.applyMove(chessState, move);
    chessLastMove = move;
    chessSelected = null;
    chessPlies++;
    recordChessPosition();

    const result = checkChessEnd();
    if (result) {
        finishChessGame(result);
        return;
    }

    const playerEvent = chessMoveEvent(move, "player", ChessEngine.inCheck(chessState, chessDravenColor()));
    if (playerEvent) {
        setDravenQuote(playerEvent);
    }

    chessLegalMoves = [];
    chessThinking = true;
    refreshChess();

    const gameId = chessGameId;
    setTimeout(function () {
        if (gameId === chessGameId) {
            chessDravenMove();
        }
    }, 500 + Math.random() * 500);
}

function chessDravenMove() {
    const move = chessOpponent === "carmilla"
        ? ChessEngine.bestMoveStyled(chessState, {
            maxDepth: CARMILLA_SEARCH.maxDepth,
            timeMs: CARMILLA_SEARCH.timeMs,
            moveNumber: chessPlies,
            positionCounts: chessPositionCounts
        })
        : ChessEngine.bestMove(chessState, DRAVEN_DEPTH);
    if (!move) {
        finishChessGame(checkChessEnd() || "draw:stalemate");
        return;
    }

    const isOpeningMove = chessLastMove === null;   // Draven opening as White: keep his greeting on screen

    chessState = ChessEngine.applyMove(chessState, move);
    chessLastMove = move;
    chessThinking = false;
    chessPlies++;
    recordChessPosition();
    chessLegalMoves = ChessEngine.legalMoves(chessState);

    const result = checkChessEnd();
    if (result) {
        finishChessGame(result);
        return;
    }

    const dravenEvent = chessMoveEvent(move, "draven", ChessEngine.inCheck(chessState, chessPlayerColor));
    if (dravenEvent) {
        setDravenQuote(dravenEvent);
    } else if (!isOpeningMove && Math.random() < 0.45) {
        setDravenQuote("idle");
    }

    refreshChess();
}

function handleChessClick(index) {
    if (!chessState || !chessPlayerColor || chessGameOver || chessThinking) {
        return;
    }

    if (chessSelected !== null) {
        // Pawns that reach the last row become queens automatically
        const move = chessLegalMoves.find(function (m) {
            return m.from === chessSelected && m.to === index && (!m.promo || m.promo === "q");
        });
        if (move) {
            chessPlayerMove(move);
            return;
        }
    }

    const piece = chessState.board[index];
    const isOwnPiece = piece && (piece === piece.toUpperCase()) === (chessPlayerColor === "w");
    if (isOwnPiece && index !== chessSelected) {
        chessSelected = index;
    } else {
        chessSelected = null;
    }
    renderChessBoard();
}

// Opens the chess window so the visitor can choose a side. Returns false if the window is missing.
function startChessGame(senderName) {
    if (!chessBoardEl) {
        return false;
    }

    if (typeof senderName === "string") {
        chessSender = senderName;
    }

    chessGameId++;
    chessPlayerColor = null;
    chessState = ChessEngine.startState();
    chessLegalMoves = [];
    chessSelected = null;
    chessLastMove = null;
    chessPositionCounts = {};
    chessGameOver = false;
    chessResult = null;
    chessThinking = false;
    chessAllianceFormed = false;
    chessLastQuote = "";
    chessProceedMode = null;
    chessPlies = 0;

    setChessOpponent("draven");
    setActiveSideButton(null);
    setDravenQuote("choose");
    refreshChess();
    openModal("chess");
    return true;
}

// Begins (or restarts) a game with the visitor playing the given color: "w" or "b"
function beginChessGame(color) {
    if (!chessBoardEl) {
        return;
    }

    chessGameId++;
    chessPlayerColor = color;
    chessState = ChessEngine.startState();
    chessLegalMoves = [];
    chessSelected = null;
    chessLastMove = null;
    chessPositionCounts = {};
    chessGameOver = false;
    chessResult = null;
    chessThinking = false;
    chessAllianceFormed = false;
    chessLastQuote = "";
    chessProceedMode = null;
    chessPlies = 0;
    recordChessPosition();
    setActiveSideButton(color);

    if (color === "w") {
        chessLegalMoves = ChessEngine.legalMoves(chessState);
        setDravenQuote("start");
        refreshChess();
        return;
    }

    // Visitor is Black, so Draven opens as White
    setDravenQuote("startBlack");
    chessThinking = true;
    refreshChess();

    const gameId = chessGameId;
    setTimeout(function () {
        if (gameId === chessGameId) {
            chessDravenMove();
        }
    }, (chessOpponent === "carmilla" ? 1100 : 700) + Math.random() * 400);
}

/* ---------- Carmilla: the brass corner and the Proceed button ---------- */

// Starts the game against Carmilla (also used by her Rematch button)
function beginCarmillaGame() {
    setChessOpponent("carmilla");
    beginChessGame(CARMILLA_PLAYER_COLOR);
}

// Clicking the bottom-left brass corner: Draven asks if the visitor is sure. Clicking it again turns back.
function handleChessCorner() {
    if (!chessState || chessOpponent !== "draven" || chessProceedMode === "offer") {
        return;
    }
    if (chessProceedMode === "confirm") {
        chessProceedMode = null;
        setDravenQuote("cancelCarmilla");
        refreshChess();
        return;
    }
    if (chessPlayerColor && !chessGameOver) {
        setDravenQuote("cornerBusy");     // a game with Draven is still going
        return;
    }
    chessProceedMode = "confirm";
    setDravenQuote("confirmCarmilla");
    refreshChess();
}

// Resign: the visitor concedes the game in progress
function handleChessResign() {
    if (!chessState || !chessPlayerColor || chessGameOver) {
        return;
    }
    chessGameId++;            // cancels any move the opponent was about to play
    finishChessGame("resign");
}

// Play a New Game: Carmilla starts again at once; Draven returns to the choice of side
function handleChessNewGame() {
    if (chessOpponent === "carmilla") {
        beginCarmillaGame();
        return;
    }
    chessGameId++;
    chessPlayerColor = null;
    chessState = ChessEngine.startState();
    chessLegalMoves = [];
    chessSelected = null;
    chessLastMove = null;
    chessPositionCounts = {};
    chessGameOver = false;
    chessResult = null;
    chessThinking = false;
    chessAllianceFormed = false;
    chessProceedMode = null;
    chessPlies = 0;
    setActiveSideButton(null);
    setDravenQuote("choose");
    refreshChess();
}

function handleChessProceed() {
    if (chessProceedMode !== null) {
        beginCarmillaGame();
    }
}

if (chessBoardEl) {
    chessBoardEl.addEventListener("click", function (event) {
        const square = event.target.closest(".chess-square");
        if (square) {
            handleChessClick(parseInt(square.getAttribute("data-index"), 10));
        }
    });
}

if (chessWhiteButton) {
    chessWhiteButton.addEventListener("click", function () {
        beginChessGame("w");
    });
}

if (chessBlackButton) {
    chessBlackButton.addEventListener("click", function () {
        beginChessGame("b");
    });
}

if (chessProceedButton) {
    chessProceedButton.addEventListener("click", handleChessProceed);
}

if (chessResignButton) {
    chessResignButton.addEventListener("click", handleChessResign);
}

if (chessNewGameButton) {
    chessNewGameButton.addEventListener("click", handleChessNewGame);
}

if (chessSecretButton) {
    chessSecretButton.addEventListener("click", handleChessCorner);
}
