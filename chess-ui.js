/*
  CHESS EASTER EGG: DRAVEN MORDE
  ------------------------------
  Typing a chess challenge (for example "I want to play Chess") to the
  Carmine Empire summons Draven Morde, Councilor of Public Relations, for a
  game. The player is White and clicks a piece, then a highlighted square.

  All of Draven's dialogue is in this file, so it is easy to edit.
  Needs chess.js (the engine) and the #modal-chess window in index.html.
*/

// How many moves ahead Draven looks. 3 is quick and beatable; 4 is stronger but slower.
const DRAVEN_DEPTH = 3;

// Draven's reply in the response box when the challenge is accepted.
// {sender} and {recipient} are replaced with the chosen nations.
const dravenIntroReplies = [
    "Draven Morde, Councilor of Public Relations, has stepped forward to answer your challenge, {sender}. The Empire holds that a good game is the finest form of diplomacy, and he has asked for the board to be prepared at once. You will play White.",
    "Word of your challenge has reached the Councilor of Public Relations, {sender}, and Draven Morde has accepted it personally. He wishes it known that he never refuses a match with a favorable public image. The board awaits, and the first move is yours.",
    "The court of {recipient} sends word, {sender}: Draven Morde, Councilor of Public Relations, will play you. He insists the match be described as friendly in all official records. Take the white pieces and begin whenever you are ready."
];

// Things Draven says during the game, grouped by what just happened
const dravenLines = {
    start: [
        "Do sit down. Every diplomatic crisis I have managed began with someone refusing a friendly game. You have the white pieces.",
        "The Empire does not fear a challenge, only an unplanned one. Fortunately, I planned for this. Your move.",
        "Councilor Draven Morde, at your service. I should warn you that I describe every loss as a strategic withdrawal. Please, begin."
    ],
    playerCapture: [
        "A bold exchange. I will be describing it to the press as a calculated loan.",
        "You take a piece, and I take note. It will be reflected in the Empire's quarterly accounts.",
        "Unfortunate. Fortunately, no one outside this room has seen it."
    ],
    dravenCapture: [
        "A small acquisition. Entirely routine, I assure you.",
        "I prefer to call it a merger. You may call it whatever your own council allows.",
        "Your piece is now under Carmine management."
    ],
    check: [
        "Your king appears to be under review.",
        "I am obliged to inform you that your position has become a matter of public concern."
    ],
    playerCheck: [
        "An aggressive move. I will describe it as an unfortunate misunderstanding.",
        "Check. Very direct. The Empire values directness, within reason."
    ],
    idle: [
        "Interesting. I will need a statement for that one.",
        "Take your time. A good press release should never be rushed.",
        "The market for pawns remains stable.",
        "Everything is proceeding exactly as planned. That is what I will say regardless."
    ],
    allianceWin: [
        "Checkmate. By the Empire's long tradition, an opponent who bests its Public Relations Councilor deserves its friendship. I will see to it that our foundries are put at your nation's disposal.",
        "A decisive result. I will be informing the council that the Empire has lost a game and gained an ally, which I intend to describe as an excellent trade. Our arms will be manufactured for your nation from today."
    ],
    playerWin: [
        "Well played. I will announce that the Empire graciously allowed a distinguished guest to win.",
        "Checkmate. I shall issue a statement of congratulations and a very quiet request for a rematch."
    ],
    dravenWin: [
        "Checkmate. I will be sure to describe it as a mutually educational experience.",
        "A fine game, and a better result for the Empire. The papers will call it a triumph of preparation."
    ],
    draw: [
        "A draw. The most diplomatic of all outcomes.",
        "Neither side prevails. I will describe it as a lasting partnership."
    ]
};

const chessResultText = {
    playerWin: "Checkmate. You win!",
    dravenWin: "Checkmate. Draven Morde wins.",
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
const chessNewButton = document.getElementById("chess-new");

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
let chessGameId = 0;    // lets an old game's pending move be ignored after "New Game"

// True when a message is asking to play chess, e.g. "I want to play Chess"
function isChessRequest(text) {
    const t = " " + text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
    return /\schess\s/.test(t) && /\s(play|game|match|challenge|duel)\w*\s/.test(t);
}

function setDravenQuote(eventName) {
    const lines = dravenLines[eventName];
    let line = lines[Math.floor(Math.random() * lines.length)];
    if (lines.length > 1 && "\u201C" + line + "\u201D" === chessLastQuote) {
        line = lines[(lines.indexOf(line) + 1) % lines.length];
    }
    chessLastQuote = "\u201C" + line + "\u201D";
    if (chessQuoteEl) {
        chessQuoteEl.textContent = chessLastQuote;
    }
}

function updateChessStatus() {
    if (!chessStatusEl || !chessState) {
        return;
    }
    if (chessGameOver) {
        chessStatusEl.textContent = (chessResultText[chessResult] || "The game is over.") +
            (chessAllianceFormed ? " The Carmine Empire is now your ally!" : "");
    } else if (chessThinking) {
        chessStatusEl.textContent = "Draven Morde is considering his move...";
    } else if (ChessEngine.inCheck(chessState, "w")) {
        chessStatusEl.textContent = "Check! Your move.";
    } else {
        chessStatusEl.textContent = "Your move. You are playing White.";
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

    let html = "";
    for (let i = 0; i < 64; i++) {
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
}

function recordChessPosition() {
    const key = ChessEngine.positionKey(chessState);
    chessPositionCounts[key] = (chessPositionCounts[key] || 0) + 1;
}

// Returns "playerWin", "dravenWin", "draw:<reason>", or null if the game goes on
function checkChessEnd() {
    const status = ChessEngine.gameStatus(chessState);
    if (status === "checkmate") {
        return chessState.turn === "b" ? "playerWin" : "dravenWin";
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

    // Beating Draven makes the Carmine Empire a permanent ally of the visitor's nation
    if (result === "playerWin" && chessSender && typeof addAlliance === "function") {
        chessAllianceFormed = addAlliance("Carmine Empire", chessSender);
    }

    if (result.indexOf("draw") === 0) {
        setDravenQuote("draw");
    } else {
        setDravenQuote(result === "playerWin" && chessAllianceFormed ? "allianceWin" : result);
    }
    refreshChess();

    if (chessAllianceFormed && typeof announceAlliance === "function") {
        announceAlliance("Carmine Empire", chessSender);
    }
}

function chessPlayerMove(move) {
    const wasCapture = !!move.captured;

    chessState = ChessEngine.applyMove(chessState, move);
    chessLastMove = move;
    chessSelected = null;
    recordChessPosition();

    const result = checkChessEnd();
    if (result) {
        finishChessGame(result);
        return;
    }

    if (wasCapture) {
        setDravenQuote("playerCapture");
    } else if (ChessEngine.inCheck(chessState, "b")) {
        setDravenQuote("playerCheck");
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
    const move = ChessEngine.bestMove(chessState, DRAVEN_DEPTH);
    if (!move) {
        finishChessGame(checkChessEnd() || "draw:stalemate");
        return;
    }

    const wasCapture = !!move.captured;

    chessState = ChessEngine.applyMove(chessState, move);
    chessLastMove = move;
    chessThinking = false;
    recordChessPosition();
    chessLegalMoves = ChessEngine.legalMoves(chessState);

    const result = checkChessEnd();
    if (result) {
        finishChessGame(result);
        return;
    }

    if (wasCapture) {
        setDravenQuote("dravenCapture");
    } else if (ChessEngine.inCheck(chessState, "w")) {
        setDravenQuote("check");
    } else if (Math.random() < 0.3) {
        setDravenQuote("idle");
    }

    refreshChess();
}

function handleChessClick(index) {
    if (!chessState || chessGameOver || chessThinking) {
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
    if (piece && piece === piece.toUpperCase() && index !== chessSelected) {
        chessSelected = index;
    } else {
        chessSelected = null;
    }
    renderChessBoard();
}

// Starts a fresh game for the given nation and opens the chess window. Returns false if the window is missing.
function startChessGame(senderName) {
    if (!chessBoardEl) {
        return false;
    }

    // The New Game button passes no nation, so the previous one is kept
    if (typeof senderName === "string") {
        chessSender = senderName;
    }
    chessAllianceFormed = false;

    chessGameId++;
    chessState = ChessEngine.startState();
    chessLegalMoves = ChessEngine.legalMoves(chessState);
    chessSelected = null;
    chessLastMove = null;
    chessPositionCounts = {};
    chessGameOver = false;
    chessResult = null;
    chessThinking = false;
    chessLastQuote = "";
    recordChessPosition();

    setDravenQuote("start");
    refreshChess();
    openModal("chess");
    return true;
}

if (chessBoardEl) {
    chessBoardEl.addEventListener("click", function (event) {
        const square = event.target.closest(".chess-square");
        if (square) {
            handleChessClick(parseInt(square.getAttribute("data-index"), 10));
        }
    });
}

if (chessNewButton) {
    chessNewButton.addEventListener("click", startChessGame);
}