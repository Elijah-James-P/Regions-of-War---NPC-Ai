/*
  CHESS ENGINE
  ------------
  A self-contained chess rules engine and computer opponent. It has no
  dependencies and does not touch the page, so it can be tested on its own.

  Supports: all piece moves, castling, en passant, promotion, check,
  checkmate, stalemate, insufficient material, the fifty-move rule and
  position keys (for repetition). The computer opponent searches a few moves
  ahead, so it plays sensibly but is beatable.

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

    return {
        startState: startState,
        fromFEN: fromFEN,
        legalMoves: legalMoves,
        applyMove: applyMove,
        inCheck: inCheck,
        gameStatus: gameStatus,
        positionKey: positionKey,
        perft: perft,
        bestMove: bestMove
    };
})();
