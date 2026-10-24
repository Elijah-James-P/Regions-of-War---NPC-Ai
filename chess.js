/*
  CHESS ENGINE
  ------------
  A self-contained chess rules engine and computer opponent. It has no
  dependencies and does not touch the page, so it can be tested on its own.

  Supports: all piece moves, castling, en passant, promotion, check,
  checkmate, stalemate, insufficient material, the fifty-move rule and
  position keys (for repetition). The computer opponent searches a few moves
  ahead, so it plays sensibly but is beatable. A second, stronger and more
  unpredictable opponent (bestMoveStyled) is used for Carmilla Carmine.

  Board layout: an array of 64 squares, index 0 = a8 (top-left) to 63 = h1.
  Capital letters are white pieces (P N B R Q K), lowercase are black.
*/

const ChessEngine = (function () {
    "use strict";

    const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const MATE_SCORE = 100000;
    const VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

    // Positional bonuses, written from White's point of view (top row = rank 8)
    const PST = {
        P: [
              0,  0,  0,  0,  0,  0,  0,  0,
             50, 50, 50, 50, 50, 50, 50, 50,
             10, 10, 20, 30, 30, 20, 10, 10,
              5,  5, 10, 25, 25, 10,  5,  5,
              0,  0,  0, 20, 20,  0,  0,  0,
              5, -5,-10,  0,  0,-10, -5,  5,
              5, 10, 10,-20,-20, 10, 10,  5,
              0,  0,  0,  0,  0,  0,  0,  0
        ],
        N: [
            -50,-40,-30,-30,-30,-30,-40,-50,
            -40,-20,  0,  0,  0,  0,-20,-40,
            -30,  0, 10, 15, 15, 10,  0,-30,
            -30,  5, 15, 20, 20, 15,  5,-30,
            -30,  0, 15, 20, 20, 15,  0,-30,
            -30,  5, 10, 15, 15, 10,  5,-30,
            -40,-20,  0,  5,  5,  0,-20,-40,
            -50,-40,-30,-30,-30,-30,-40,-50
        ],
        B: [
            -20,-10,-10,-10,-10,-10,-10,-20,
            -10,  0,  0,  0,  0,  0,  0,-10,
            -10,  0,  5, 10, 10,  5,  0,-10,
            -10,  5,  5, 10, 10,  5,  5,-10,
            -10,  0, 10, 10, 10, 10,  0,-10,
            -10, 10, 10, 10, 10, 10, 10,-10,
            -10,  5,  0,  0,  0,  0,  5,-10,
            -20,-10,-10,-10,-10,-10,-10,-20
        ],
        R: [
              0,  0,  0,  0,  0,  0,  0,  0,
              5, 10, 10, 10, 10, 10, 10,  5,
             -5,  0,  0,  0,  0,  0,  0, -5,
             -5,  0,  0,  0,  0,  0,  0, -5,
             -5,  0,  0,  0,  0,  0,  0, -5,
             -5,  0,  0,  0,  0,  0,  0, -5,
             -5,  0,  0,  0,  0,  0,  0, -5,
              0,  0,  0,  5,  5,  0,  0,  0
        ],
        Q: [
            -20,-10,-10, -5, -5,-10,-10,-20,
            -10,  0,  0,  0,  0,  0,  0,-10,
            -10,  0,  5,  5,  5,  5,  0,-10,
             -5,  0,  5,  5,  5,  5,  0, -5,
              0,  0,  5,  5,  5,  5,  0, -5,
            -10,  5,  5,  5,  5,  5,  0,-10,
            -10,  0,  5,  0,  0,  0,  0,-10,
            -20,-10,-10, -5, -5,-10,-10,-20
        ],
        K: [
            -30,-40,-40,-50,-50,-40,-40,-30,
            -30,-40,-40,-50,-50,-40,-40,-30,
            -30,-40,-40,-50,-50,-40,-40,-30,
            -30,-40,-40,-50,-50,-40,-40,-30,
            -20,-30,-30,-40,-40,-30,-30,-20,
            -10,-20,-20,-20,-20,-20,-20,-10,
             20, 20,  0,  0,  0,  0, 20, 20,
             20, 30, 10,  0,  0, 10, 30, 20
        ]
    };

    const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    function colorOf(piece) {
        if (piece === null) {
            return null;
        }
        return piece === piece.toUpperCase() ? "w" : "b";
    }

    function fromFEN(fen) {
        const parts = fen.trim().split(/\s+/);
        const board = new Array(64).fill(null);
        const rows = parts[0].split("/");

        for (let r = 0; r < 8; r++) {
            let c = 0;
            for (const ch of rows[r]) {
                if (/\d/.test(ch)) {
                    c += parseInt(ch, 10);
                } else {
                    board[r * 8 + c] = ch;
                    c++;
                }
            }
        }

        const castleText = parts[2] || "-";
        let ep = -1;
        if (parts[3] && parts[3] !== "-") {
            ep = (8 - parseInt(parts[3][1], 10)) * 8 + (parts[3].charCodeAt(0) - 97);
        }

        return {
            board: board,
            turn: parts[1] === "b" ? "b" : "w",
            castling: {
                K: castleText.includes("K"),
                Q: castleText.includes("Q"),
                k: castleText.includes("k"),
                q: castleText.includes("q")
            },
            ep: ep,
            halfmove: parts[4] ? parseInt(parts[4], 10) : 0
        };
    }

    function startState() {
        return fromFEN(START_FEN);
    }

    function findKing(board, color) {
        const king = color === "w" ? "K" : "k";
        return board.indexOf(king);
    }

    function isAttacked(board, sq, by) {
        const row = sq >> 3;
        const col = sq & 7;
        const white = by === "w";
        const pawn = white ? "P" : "p";
        const knight = white ? "N" : "n";
        const king = white ? "K" : "k";
        const rook = white ? "R" : "r";
        const bishop = white ? "B" : "b";
        const queen = white ? "Q" : "q";
        let i, r, c, p;

        // A white pawn attacks diagonally upward (toward row 0), so it sits one row below the target
        const pawnRow = white ? row + 1 : row - 1;
        if (pawnRow >= 0 && pawnRow < 8) {
            if (col > 0 && board[pawnRow * 8 + col - 1] === pawn) { return true; }
            if (col < 7 && board[pawnRow * 8 + col + 1] === pawn) { return true; }
        }

        for (i = 0; i < 8; i++) {
            r = row + KNIGHT_STEPS[i][0];
            c = col + KNIGHT_STEPS[i][1];
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === knight) { return true; }
            r = row + KING_STEPS[i][0];
            c = col + KING_STEPS[i][1];
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === king) { return true; }
        }

        for (i = 0; i < 4; i++) {
            r = row + ROOK_DIRS[i][0];
            c = col + ROOK_DIRS[i][1];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                p = board[r * 8 + c];
                if (p !== null) {
                    if (p === rook || p === queen) { return true; }
                    break;
                }
                r += ROOK_DIRS[i][0];
                c += ROOK_DIRS[i][1];
            }

            r = row + BISHOP_DIRS[i][0];
            c = col + BISHOP_DIRS[i][1];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                p = board[r * 8 + c];
                if (p !== null) {
                    if (p === bishop || p === queen) { return true; }
                    break;
                }
                r += BISHOP_DIRS[i][0];
                c += BISHOP_DIRS[i][1];
            }
        }

        return false;
    }

    // All moves that follow piece movement rules (may leave own king in check)
    function pseudoMoves(state, capturesOnly) {
        const board = state.board;
        const us = state.turn;
        const them = us === "w" ? "b" : "w";
        const moves = [];

        function addPawnMove(from, to, piece, captured, isPromotion) {
            if (isPromotion) {
                ["q", "r", "b", "n"].forEach(function (promo) {
                    moves.push({ from: from, to: to, piece: piece, captured: captured, promo: promo, flag: null });
                });
            } else {
                moves.push({ from: from, to: to, piece: piece, captured: captured, promo: null, flag: null });
            }
        }

        for (let from = 0; from < 64; from++) {
            const piece = board[from];
            if (piece === null || colorOf(piece) !== us) {
                continue;
            }

            const type = piece.toUpperCase();
            const row = from >> 3;
            const col = from & 7;
            let i, r, c, to, target;

            if (type === "P") {
                const dir = us === "w" ? -1 : 1;
                const startRow = us === "w" ? 6 : 1;
                const promoRow = us === "w" ? 0 : 7;
                const nextRow = row + dir;

                if (nextRow < 0 || nextRow > 7) {
                    continue;
                }

                if (!capturesOnly && board[nextRow * 8 + col] === null) {
                    addPawnMove(from, nextRow * 8 + col, piece, null, nextRow === promoRow);
                    const twoRow = row + 2 * dir;
                    if (row === startRow && board[twoRow * 8 + col] === null) {
                        moves.push({ from: from, to: twoRow * 8 + col, piece: piece, captured: null, promo: null, flag: "double" });
                    }
                }

                for (let dc = -1; dc <= 1; dc += 2) {
                    c = col + dc;
                    if (c < 0 || c > 7) {
                        continue;
                    }
                    to = nextRow * 8 + c;
                    target = board[to];
                    if (target !== null && colorOf(target) === them) {
                        addPawnMove(from, to, piece, target, nextRow === promoRow);
                    } else if (target === null && to === state.ep) {
                        moves.push({ from: from, to: to, piece: piece, captured: us === "w" ? "p" : "P", promo: null, flag: "ep" });
                    }
                }
            } else if (type === "N" || type === "K") {
                const steps = type === "N" ? KNIGHT_STEPS : KING_STEPS;
                for (i = 0; i < 8; i++) {
                    r = row + steps[i][0];
                    c = col + steps[i][1];
                    if (r < 0 || r > 7 || c < 0 || c > 7) {
                        continue;
                    }
                    to = r * 8 + c;
                    target = board[to];
                    if (target === null) {
                        if (!capturesOnly) {
                            moves.push({ from: from, to: to, piece: piece, captured: null, promo: null, flag: null });
                        }
                    } else if (colorOf(target) === them) {
                        moves.push({ from: from, to: to, piece: piece, captured: target, promo: null, flag: null });
                    }
                }

                if (type === "K" && !capturesOnly) {
                    const cr = state.castling;
                    if (us === "w" && from === 60) {
                        if (cr.K && board[61] === null && board[62] === null && board[63] === "R" &&
                            !isAttacked(board, 60, "b") && !isAttacked(board, 61, "b")) {
                            moves.push({ from: 60, to: 62, piece: piece, captured: null, promo: null, flag: "castleK" });
                        }
                        if (cr.Q && board[59] === null && board[58] === null && board[57] === null && board[56] === "R" &&
                            !isAttacked(board, 60, "b") && !isAttacked(board, 59, "b")) {
                            moves.push({ from: 60, to: 58, piece: piece, captured: null, promo: null, flag: "castleQ" });
                        }
                    } else if (us === "b" && from === 4) {
                        if (cr.k && board[5] === null && board[6] === null && board[7] === "r" &&
                            !isAttacked(board, 4, "w") && !isAttacked(board, 5, "w")) {
                            moves.push({ from: 4, to: 6, piece: piece, captured: null, promo: null, flag: "castleK" });
                        }
                        if (cr.q && board[3] === null && board[2] === null && board[1] === null && board[0] === "r" &&
                            !isAttacked(board, 4, "w") && !isAttacked(board, 3, "w")) {
                            moves.push({ from: 4, to: 2, piece: piece, captured: null, promo: null, flag: "castleQ" });
                        }
                    }
                }
            } else {
                const dirs = type === "R" ? ROOK_DIRS : type === "B" ? BISHOP_DIRS : ROOK_DIRS.concat(BISHOP_DIRS);
                for (i = 0; i < dirs.length; i++) {
                    r = row + dirs[i][0];
                    c = col + dirs[i][1];
                    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                        to = r * 8 + c;
                        target = board[to];
                        if (target === null) {
                            if (!capturesOnly) {
                                moves.push({ from: from, to: to, piece: piece, captured: null, promo: null, flag: null });
                            }
                        } else {
                            if (colorOf(target) === them) {
                                moves.push({ from: from, to: to, piece: piece, captured: target, promo: null, flag: null });
                            }
                            break;
                        }
                        r += dirs[i][0];
                        c += dirs[i][1];
                    }
                }
            }
        }

        return moves;
    }

    function updateRights(rights, from, to) {
        const r = { K: rights.K, Q: rights.Q, k: rights.k, q: rights.q };
        [from, to].forEach(function (sq) {
            if (sq === 60) { r.K = false; r.Q = false; }
            if (sq === 4) { r.k = false; r.q = false; }
            if (sq === 63) { r.K = false; }
            if (sq === 56) { r.Q = false; }
            if (sq === 7) { r.k = false; }
            if (sq === 0) { r.q = false; }
        });
        return r;
    }

    // Returns a NEW state with the move played (the old one is not changed)
    function applyMove(state, move) {
        const board = state.board.slice();
        const us = state.turn;
        let placed = move.piece;

        if (move.promo) {
            placed = us === "w" ? move.promo.toUpperCase() : move.promo.toLowerCase();
        }

        board[move.from] = null;
        board[move.to] = placed;

        if (move.flag === "ep") {
            board[us === "w" ? move.to + 8 : move.to - 8] = null;
        } else if (move.flag === "castleK") {
            board[us === "w" ? 61 : 5] = board[us === "w" ? 63 : 7];
            board[us === "w" ? 63 : 7] = null;
        } else if (move.flag === "castleQ") {
            board[us === "w" ? 59 : 3] = board[us === "w" ? 56 : 0];
            board[us === "w" ? 56 : 0] = null;
        }

        return {
            board: board,
            turn: us === "w" ? "b" : "w",
            castling: updateRights(state.castling, move.from, move.to),
            ep: move.flag === "double" ? (move.from + move.to) / 2 : -1,
            halfmove: (move.piece.toUpperCase() === "P" || move.captured) ? 0 : state.halfmove + 1
        };
    }

    // Fully legal moves, each paired with the position it leads to
    function legalPairs(state, capturesOnly) {
        const us = state.turn;
        const them = us === "w" ? "b" : "w";
        const result = [];

        pseudoMoves(state, capturesOnly).forEach(function (move) {
            const next = applyMove(state, move);
            const kingSq = findKing(next.board, us);
            if (kingSq === -1 || !isAttacked(next.board, kingSq, them)) {
                result.push({ move: move, next: next });
            }
        });

        return result;
    }

    function legalMoves(state) {
        return legalPairs(state, false).map(function (pair) { return pair.move; });
    }

    function inCheck(state, color) {
        const kingSq = findKing(state.board, color);
        if (kingSq === -1) {
            return false;
        }
        return isAttacked(state.board, kingSq, color === "w" ? "b" : "w");
    }

    function insufficientMaterial(board) {
        const others = [];
        board.forEach(function (p) {
            if (p !== null && p.toUpperCase() !== "K") {
                others.push(p.toUpperCase());
            }
        });
        if (others.length === 0) {
            return true;
        }
        return others.length === 1 && (others[0] === "N" || others[0] === "B");
    }

    // "ongoing", "checkmate", "stalemate", "insufficient" or "fiftymove"
    function gameStatus(state) {
        if (legalPairs(state, false).length === 0) {
            return inCheck(state, state.turn) ? "checkmate" : "stalemate";
        }
        if (insufficientMaterial(state.board)) {
            return "insufficient";
        }
        if (state.halfmove >= 100) {
            return "fiftymove";
        }
        return "ongoing";
    }

    function positionKey(state) {
        const c = state.castling;
        return state.board.map(function (p) { return p === null ? "-" : p; }).join("") +
            state.turn + (c.K ? "K" : "") + (c.Q ? "Q" : "") + (c.k ? "k" : "") + (c.q ? "q" : "") + state.ep;
    }

    function perft(state, depth) {
        if (depth === 0) {
            return 1;
        }
        const pairs = legalPairs(state, false);
        if (depth === 1) {
            return pairs.length;
        }
        let total = 0;
        pairs.forEach(function (pair) { total += perft(pair.next, depth - 1); });
        return total;
    }

    /* ---------- Computer opponent ---------- */

    // Score from the point of view of the side to move
    function evaluate(state) {
        const board = state.board;
        let score = 0;

        for (let sq = 0; sq < 64; sq++) {
            const p = board[sq];
            if (p === null) {
                continue;
            }
            const type = p.toUpperCase();
            if (p === type) {
                score += VALUES[type] + PST[type][sq];
            } else {
                score -= VALUES[type] + PST[type][(7 - (sq >> 3)) * 8 + (sq & 7)];
            }
        }

        return state.turn === "w" ? score : -score;
    }

    // Tries captures first, valuable victims by cheap attackers first
    function orderPairs(pairs) {
        function rank(pair) {
            const m = pair.move;
            let s = 0;
            if (m.captured) {
                s += 10 * VALUES[m.captured.toUpperCase()] - VALUES[m.piece.toUpperCase()] + 10000;
            }
            if (m.promo === "q") {
                s += 9000;
            }
            return s;
        }
        return pairs.sort(function (a, b) { return rank(b) - rank(a); });
    }

    // Keeps looking at captures so it doesn't stop in the middle of an exchange
    function quiesce(state, alpha, beta, depthLeft) {
        const standPat = evaluate(state);
        if (standPat >= beta) {
            return beta;
        }
        if (standPat > alpha) {
            alpha = standPat;
        }
        if (depthLeft === 0) {
            return alpha;
        }

        const pairs = orderPairs(legalPairs(state, true));
        for (let i = 0; i < pairs.length; i++) {
            const score = -quiesce(pairs[i].next, -beta, -alpha, depthLeft - 1);
            if (score >= beta) {
                return beta;
            }
            if (score > alpha) {
                alpha = score;
            }
        }
        return alpha;
    }

    function negamax(state, depth, alpha, beta, ply) {
        if (depth === 0) {
            return quiesce(state, alpha, beta, 4);
        }

        const pairs = legalPairs(state, false);
        if (pairs.length === 0) {
            return inCheck(state, state.turn) ? -MATE_SCORE + ply : 0;
        }

        orderPairs(pairs);
        for (let i = 0; i < pairs.length; i++) {
            const score = -negamax(pairs[i].next, depth - 1, -beta, -alpha, ply + 1);
            if (score >= beta) {
                return beta;
            }
            if (score > alpha) {
                alpha = score;
            }
        }
        return alpha;
    }

    function shuffle(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }
        return list;
    }

    // Picks a move for the side to move; returns null if there are none
    function bestMove(state, depth) {
        const pairs = legalPairs(state, false);
        if (pairs.length === 0) {
            return null;
        }

        // Shuffle first so equal moves vary between games, then order for speed
        orderPairs(shuffle(pairs));

        let best = null;
        let alpha = -Infinity;
        for (let i = 0; i < pairs.length; i++) {
            const score = -negamax(pairs[i].next, depth - 1, -Infinity, -alpha, 1);
            if (best === null || score > alpha) {
                best = pairs[i].move;
                alpha = Math.max(alpha, score);
            }
        }
        return best;
    }


    /* ---------- Stronger, more varied opponent (used by Carmilla Carmine) ---------- */

    // King table for the endgame, when the king should come out and fight (White's point of view)
    const KING_ENDGAME = [
        -50,-40,-30,-20,-20,-30,-40,-50,
        -30,-20,-10,  0,  0,-10,-20,-30,
        -30,-10, 20, 30, 30, 20,-10,-30,
        -30,-10, 30, 40, 40, 30,-10,-30,
        -30,-10, 30, 40, 40, 30,-10,-30,
        -30,-10, 20, 30, 30, 20,-10,-30,
        -30,-30,  0,  0,  0,  0,-30,-30,
        -50,-30,-30,-30,-30,-30,-30,-50
    ];

    // Bonus for a passed pawn, by how far it has advanced (0 = still on its starting row)
    const PASSED_BONUS = [0, 8, 15, 28, 48, 80, 120];

    // A fuller evaluation than evaluate(): material and position, plus the bishop pair, pawn
    // structure, rooks on open files, king safety, and an active king in the endgame.
    // The score is from the point of view of the side to move.
    function evaluateRich(state) {
        const board = state.board;
        const wCount = [0, 0, 0, 0, 0, 0, 0, 0];
        const bCount = [0, 0, 0, 0, 0, 0, 0, 0];
        const wMaxRow = [-1, -1, -1, -1, -1, -1, -1, -1];   // furthest-back white pawn on each file
        const bMinRow = [99, 99, 99, 99, 99, 99, 99, 99];   // furthest-back black pawn on each file
        const wPawns = [];
        const bPawns = [];
        const rooks = [];
        let wBishops = 0;
        let bBishops = 0;
        let wKing = -1;
        let bKing = -1;
        let material = 0;
        let score = 0;
        let sq, p, type, white, row, col, i, f, value;

        for (sq = 0; sq < 64; sq++) {
            p = board[sq];
            if (p === null) {
                continue;
            }
            type = p.toUpperCase();
            white = p === type;
            row = sq >> 3;
            col = sq & 7;

            if (type === "K") {
                if (white) { wKing = sq; } else { bKing = sq; }
                continue;
            }

            value = VALUES[type] + (white ? PST[type][sq] : PST[type][(7 - row) * 8 + col]);
            score += white ? value : -value;

            if (type === "P") {
                if (white) {
                    wCount[col]++;
                    if (row > wMaxRow[col]) { wMaxRow[col] = row; }
                    wPawns.push(sq);
                } else {
                    bCount[col]++;
                    if (row < bMinRow[col]) { bMinRow[col] = row; }
                    bPawns.push(sq);
                }
                continue;
            }

            material += VALUES[type];
            if (type === "B") {
                if (white) { wBishops++; } else { bBishops++; }
            } else if (type === "R") {
                rooks.push(sq);
            }
        }

        const phase = Math.min(1, material / 5200);   // 1 = full board, 0 = bare endgame

        if (wBishops >= 2) { score += 25; }
        if (bBishops >= 2) { score -= 25; }

        // Pawn structure: doubled and isolated pawns are weak, passed pawns are strong
        for (f = 0; f < 8; f++) {
            if (wCount[f] > 1) { score -= 10 * (wCount[f] - 1); }
            if (bCount[f] > 1) { score += 10 * (bCount[f] - 1); }
            if (wCount[f] > 0 && (f === 0 || wCount[f - 1] === 0) && (f === 7 || wCount[f + 1] === 0)) { score -= 12 * wCount[f]; }
            if (bCount[f] > 0 && (f === 0 || bCount[f - 1] === 0) && (f === 7 || bCount[f + 1] === 0)) { score += 12 * bCount[f]; }
        }

        const passedScale = 1.4 - 0.6 * phase;
        for (i = 0; i < wPawns.length; i++) {
            row = wPawns[i] >> 3;
            col = wPawns[i] & 7;
            if ((col === 0 || bMinRow[col - 1] >= row) && bMinRow[col] >= row && (col === 7 || bMinRow[col + 1] >= row)) {
                score += PASSED_BONUS[6 - row] * passedScale;
            }
        }
        for (i = 0; i < bPawns.length; i++) {
            row = bPawns[i] >> 3;
            col = bPawns[i] & 7;
            if ((col === 0 || wMaxRow[col - 1] <= row) && wMaxRow[col] <= row && (col === 7 || wMaxRow[col + 1] <= row)) {
                score -= PASSED_BONUS[row - 1] * passedScale;
            }
        }

        // Rooks like open and half-open files
        for (i = 0; i < rooks.length; i++) {
            white = board[rooks[i]] === "R";
            col = rooks[i] & 7;
            if (white && wCount[col] === 0) { score += bCount[col] === 0 ? 18 : 9; }
            if (!white && bCount[col] === 0) { score -= wCount[col] === 0 ? 18 : 9; }
        }

        // Kings: hide early in the game (with a pawn shield), come out in the endgame
        let shield;
        if (wKing !== -1) {
            row = wKing >> 3;
            col = wKing & 7;
            score += phase * PST.K[wKing] + (1 - phase) * KING_ENDGAME[wKing];
            if (row >= 6) {
                shield = 0;
                for (f = Math.max(0, col - 1); f <= Math.min(7, col + 1); f++) {
                    if (board[(row - 1) * 8 + f] === "P") { shield += 9; }
                    else if (row >= 2 && board[(row - 2) * 8 + f] === "P") { shield += 4; }
                }
                if (wCount[col] === 0) { shield -= 14; }
                score += phase * shield;
            }
        }
        if (bKing !== -1) {
            row = bKing >> 3;
            col = bKing & 7;
            score -= phase * PST.K[(7 - row) * 8 + col] + (1 - phase) * KING_ENDGAME[(7 - row) * 8 + col];
            if (row <= 1) {
                shield = 0;
                for (f = Math.max(0, col - 1); f <= Math.min(7, col + 1); f++) {
                    if (board[(row + 1) * 8 + f] === "p") { shield += 9; }
                    else if (row <= 5 && board[(row + 2) * 8 + f] === "p") { shield += 4; }
                }
                if (bCount[col] === 0) { shield -= 14; }
                score -= phase * shield;
            }
        }

        return (state.turn === "w" ? score : -score) + 8;   // a small bonus for having the move
    }

    // Information about the last bestMoveStyled search (handy for testing)
    let lastStyledInfo = null;

    /*
      Chooses a move the way a sharp, unpredictable player would. It searches deeper than
      bestMove (iterative deepening up to maxDepth, stopping when timeMs is used up), then
      picks among the moves that are nearly as good as the best one, leaning towards checks,
      captures and pressure on the enemy king, with a little randomness. Because it only
      ever chooses moves within a small margin of the best, it stays tactically sound.

      options: maxDepth, timeMs, moveNumber (half-moves played so far),
               positionCounts (positionKey -> times seen, to avoid repeating positions)
    */
    function bestMoveStyled(state, options) {
        options = options || {};
        const maxDepth = options.maxDepth || 5;
        const timeLimit = options.timeMs || 2200;
        const moveNumber = options.moveNumber || 0;
        const seen = options.positionCounts || {};
        const started = Date.now();
        const killers = [];
        let nodes = 0;
        let stopped = false;

        function checkTime() {
            nodes++;
            if ((nodes & 511) === 0 && Date.now() - started > timeLimit) {
                stopped = true;
            }
            return stopped;
        }

        function sameMove(a, b) {
            return !!a && !!b && a.from === b.from && a.to === b.to;
        }

        function storeKiller(move, ply) {
            if (move.captured) {
                return;
            }
            const k = killers[ply] || (killers[ply] = [null, null]);
            if (!sameMove(k[0], move)) {
                k[1] = k[0];
                k[0] = move;
            }
        }

        function orderStyled(pairs, ply) {
            const k = killers[ply];
            pairs.forEach(function (pair) {
                const m = pair.move;
                let s = 0;
                if (m.captured) {
                    s += 10 * VALUES[m.captured.toUpperCase()] - VALUES[m.piece.toUpperCase()] + 10000;
                } else if (k && (sameMove(k[0], m) || sameMove(k[1], m))) {
                    s += 9000;
                }
                if (m.promo === "q") {
                    s += 9500;
                }
                pair.rank = s;
            });
            return pairs.sort(function (a, b) { return b.rank - a.rank; });
        }

        function quiesceRich(st, alpha, beta, depthLeft) {
            if (checkTime()) {
                return 0;
            }
            const standPat = evaluateRich(st);
            if (standPat >= beta) {
                return beta;
            }
            if (standPat > alpha) {
                alpha = standPat;
            }
            if (depthLeft === 0) {
                return alpha;
            }

            const pairs = orderPairs(legalPairs(st, true));
            for (let i = 0; i < pairs.length; i++) {
                const score = -quiesceRich(pairs[i].next, -beta, -alpha, depthLeft - 1);
                if (stopped) {
                    return 0;
                }
                if (score >= beta) {
                    return beta;
                }
                if (score > alpha) {
                    alpha = score;
                }
            }
            return alpha;
        }

        function negamaxRich(st, depth, alpha, beta, ply) {
            if (checkTime()) {
                return 0;
            }

            const checked = inCheck(st, st.turn);
            if (depth <= 0) {
                if (checked && ply < 14) {
                    depth = 1;          // never stop the search while a king is in check
                } else {
                    return quiesceRich(st, alpha, beta, 5);
                }
            }

            const pairs = legalPairs(st, false);
            if (pairs.length === 0) {
                return checked ? -MATE_SCORE + ply : 0;
            }
            if (st.halfmove >= 100) {
                return 0;
            }

            orderStyled(pairs, ply);
            for (let i = 0; i < pairs.length; i++) {
                const move = pairs[i].move;
                let score;

                if (depth >= 3 && i >= 4 && !checked && !move.captured && !move.promo) {
                    // Late quiet moves get a quicker look first, and a full one only if they surprise us
                    score = -negamaxRich(pairs[i].next, depth - 2, -alpha - 1, -alpha, ply + 1);
                    if (!stopped && score > alpha) {
                        score = -negamaxRich(pairs[i].next, depth - 1, -beta, -alpha, ply + 1);
                    }
                } else {
                    score = -negamaxRich(pairs[i].next, depth - 1, -beta, -alpha, ply + 1);
                }

                if (stopped) {
                    return 0;
                }
                if (score >= beta) {
                    storeKiller(move, ply);
                    return beta;
                }
                if (score > alpha) {
                    alpha = score;
                }
            }
            return alpha;
        }

        const rootPairs = legalPairs(state, false);
        if (rootPairs.length === 0) {
            return null;
        }
        if (rootPairs.length === 1) {
            lastStyledInfo = { depth: 0, nodes: 0, ms: 0, score: 0, candidates: 1 };
            return rootPairs[0].move;
        }

        // Moves this close to the best are all kept and given exact scores
        const windowMargin = moveNumber < 10 ? 75 : 40;

        orderStyled(rootPairs, 0);
        let completed = null;
        let reached = 0;

        for (let depth = 1; depth <= maxDepth && !stopped; depth++) {
            const scored = [];
            let best = -Infinity;

            for (let i = 0; i < rootPairs.length; i++) {
                const lower = best === -Infinity ? -Infinity : best - windowMargin;
                const score = -negamaxRich(rootPairs[i].next, depth - 1, -Infinity, -lower, 1);
                if (stopped) {
                    break;
                }
                rootPairs[i].score = score;
                scored.push({ pair: rootPairs[i], score: score });
                if (score > best) {
                    best = score;
                }
            }

            if (stopped) {
                break;
            }
            completed = scored;
            reached = depth;
            rootPairs.sort(function (a, b) { return b.score - a.score; });
            if (best >= MATE_SCORE - 100) {
                break;      // a forced mate has been found
            }
        }

        if (!completed) {
            return rootPairs[0].move;
        }

        let top = -Infinity;
        completed.forEach(function (c) { if (c.score > top) { top = c.score; } });

        // How much worse than the best move she is willing to go, for variety
        let margin;
        if (top >= MATE_SCORE - 100 || top <= -MATE_SCORE + 100) {
            margin = 0;
        } else if (top > 350) {
            margin = 18;
        } else if (top < -250) {
            margin = 12;
        } else {
            margin = moveNumber < 10 ? 40 : 32;
        }

        const candidates = completed.filter(function (c) {
            return margin === 0 ? c.score === top : c.score > top - margin;
        });

        const enemyKing = state.board.indexOf(state.turn === "w" ? "k" : "K");

        function distance(a, b) {
            return Math.max(Math.abs((a >> 3) - (b >> 3)), Math.abs((a & 7) - (b & 7)));
        }

        function styleBonus(pair) {
            const m = pair.move;
            const type = m.piece.toUpperCase();
            let bonus = 0;

            if (inCheck(pair.next, pair.next.turn)) { bonus += 14; }
            if (m.captured) { bonus += 6; }
            if (m.promo) { bonus += 25; }
            if (moveNumber >= 10 && type !== "P" && type !== "K" && enemyKing !== -1) {
                bonus += Math.max(-4, Math.min(8, (distance(m.from, enemyKing) - distance(m.to, enemyKing)) * 3));
            }

            const repeats = seen[positionKey(pair.next)] || 0;
            if (repeats >= 1) { bonus -= 12 * repeats; }
            if (repeats >= 2 && top > 40) { bonus -= 300; }   // never hand over a draw while better
            return bonus;
        }

        let chosen = candidates[0];
        let chosenValue = -Infinity;
        candidates.forEach(function (c) {
            const value = c.score + styleBonus(c.pair) + Math.random() * (moveNumber < 6 ? 55 : moveNumber < 10 ? 40 : 16);
            if (value > chosenValue) {
                chosenValue = value;
                chosen = c;
            }
        });

        lastStyledInfo = {
            depth: reached, nodes: nodes, ms: Date.now() - started, score: top, candidates: candidates.length,
            scores: completed.map(function (c) { return [c.pair.move.from, c.pair.move.to, Math.round(c.score)]; })
        };
        return chosen.pair.move;
    }

    return {
        startState: startState,
        fromFEN: fromFEN,
        legalMoves: legalMoves,
        applyMove: applyMove,
        inCheck: inCheck,
        gameStatus: gameStatus,
        positionKey: positionKey,
        perft: perft,
        bestMove: bestMove,
        bestMoveStyled: bestMoveStyled,
        evaluateRich: evaluateRich,
        styledInfo: function () { return lastStyledInfo; }
    };
})();
