const triggers = document.querySelectorAll(".modal-trigger");
const overlays = document.querySelectorAll(".modal-overlay");
const closeButtons = document.querySelectorAll(".modal-close");

function openModal(name) {
    const overlay = document.getElementById("modal-" + name);
    if (overlay) {
        overlay.classList.add("active");
    }
}

function closeModal(overlay) {
    overlay.classList.remove("active");
}

triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
        event.preventDefault();
        const name = trigger.getAttribute("data-modal");
        openModal(name);
    });
});

closeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const overlay = button.closest(".modal-overlay");
        closeModal(overlay);
    });
});

overlays.forEach(function (overlay) {
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closeModal(overlay);
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        overlays.forEach(function (overlay) {
            closeModal(overlay);
        });
    }
});

const nationPickers = document.querySelectorAll(".nation-picker");

function closeAllDropdowns() {
    nationPickers.forEach(function (picker) {
        picker.querySelector(".nation-dropdown").classList.remove("open");
    });
}

nationPickers.forEach(function (picker) {
    const input = picker.querySelector("input");
    const dropdown = picker.querySelector(".nation-dropdown");

    function open() {
        closeAllDropdowns();
        dropdown.classList.add("open");
    }

    input.addEventListener("focus", open);
    input.addEventListener("click", open);

    dropdown.querySelectorAll("li").forEach(function (item) {
        item.addEventListener("click", function () {
            input.value = item.textContent;
            closeAllDropdowns();
        });
    });
});

document.addEventListener("click", function (event) {
    if (!event.target.closest(".nation-picker")) {
        closeAllDropdowns();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeAllDropdowns();
    }
});


/* ---------- Response algorithm ---------- */

const senderInput = document.getElementById("sender-input");
const recipientInput = document.getElementById("recipient-input");
const actionInput = document.getElementById("visitor-text");
const responseBox = document.getElementById("ai-response");
const sendButton = document.getElementById("send-button");

// Remembers the last reply used for each action so it doesn't repeat back-to-back
const lastReplyUsed = {};

function normalizeText(text) {
    return " " + text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(keyword, text) {
    let pattern;
    if (keyword.endsWith("*")) {
        pattern = escapeRegex(keyword.slice(0, -1)).replace(/ /g, "\\s+") + "[a-z]*";
    } else {
        pattern = escapeRegex(keyword).replace(/ /g, "\\s+") + "(?:s|es|ed|d|ing)?";
    }
    return new RegExp("\\s" + pattern + "(?=\\s)").test(text);
}

function scoreAction(action, text) {
    let score = 0;
    action.keywords.forEach(function (keyword) {
        if (keywordMatches(keyword, text)) {
            // Longer phrases are stronger evidence than single words
            score += keyword.split(" ").length;
        }
    });
    return score;
}

function findAction(rawText) {
    const text = normalizeText(rawText);
    let best = null;
    let bestScore = 0;

    actions.forEach(function (action) {
        const score = scoreAction(action, text);
        if (score > bestScore) {
            best = action;
            bestScore = score;
        }
    });

    return best; // null when nothing matched
}

function pickReply(replies, key) {
    let index = Math.floor(Math.random() * replies.length);
    if (replies.length > 1 && index === lastReplyUsed[key]) {
        index = (index + 1) % replies.length;
    }
    lastReplyUsed[key] = index;
    return replies[index];
}

// Returns the special replies for a nation (see nationReplies in actions.js), or null
function findPersonality(nationName) {
    if (typeof nationReplies === "undefined") {
        return null;
    }
    const wanted = nationName.trim().toLowerCase();
    const match = Object.keys(nationReplies).find(function (name) {
        return name.toLowerCase() === wanted;
    });
    return match ? nationReplies[match] : null;
}

function fillNames(reply, sender, recipient) {
    return reply.split("{sender}").join(sender).split("{recipient}").join(recipient);
}

/* ---------- History and reply delay ---------- */

const MAX_HISTORY = 5;          // how many past exchanges to keep on screen
const MIN_DELAY = 700;          // shortest reply pause in milliseconds
const MAX_DELAY = 1400;         // longest reply pause in milliseconds
const history = [];

// Shows the saved history, plus an optional temporary line at the end
// (used for the pending message and error messages, which are not saved)
function renderResponse(temporaryText) {
    let text = history
        .map(function (entry) { return entry.sent ? entry.sent + "\n" + entry.reply : entry.reply; })
        .join("\n\n");

    if (temporaryText) {
        text += (text ? "\n\n" : "") + temporaryText;
    }

    responseBox.value = text;
    responseBox.scrollTop = responseBox.scrollHeight;
}

/* ---------- Alliances ---------- */

// Alliances are remembered in the visitor's browser so they stay between visits
const ALLIANCE_STORAGE_KEY = "regionsOfWarAlliances";
let alliances = loadAlliances();

function loadAlliances() {
    try {
        const saved = JSON.parse(localStorage.getItem(ALLIANCE_STORAGE_KEY));
        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        return {};
    }
}

function saveAlliances() {
    try {
        localStorage.setItem(ALLIANCE_STORAGE_KEY, JSON.stringify(alliances));
    } catch (error) {
        // Storage unavailable: the alliance lasts until the page is closed
    }
}

function allianceKey(name) {
    return name.trim().toLowerCase();
}

function isAllied(recipient, sender) {
    const list = alliances[allianceKey(recipient)];
    return Array.isArray(list) && list.indexOf(allianceKey(sender)) !== -1;
}

// Returns true if the alliance is new, false if it already existed
function addAlliance(recipient, sender) {
    if (isAllied(recipient, sender)) {
        return false;
    }
    const key = allianceKey(recipient);
    if (!Array.isArray(alliances[key])) {
        alliances[key] = [];
    }
    alliances[key].push(allianceKey(sender));
    saveAlliances();
    return true;
}

// Adds the nation's alliance announcement to the response box
function announceAlliance(recipient, sender) {
    const personality = findPersonality(recipient);
    if (!personality || !personality.allianceAnnouncement) {
        return;
    }
    const text = pickReply(personality.allianceAnnouncement, recipient + "|announcement");
    history.push({ sent: "", reply: recipient + ": " + fillNames(text, sender, recipient) });
    while (history.length > MAX_HISTORY) {
        history.shift();
    }
    renderResponse();
}

// True when the visitor challenges the Carmine Empire to chess (see chess-ui.js)
function isChessEasterEgg(recipient, text) {
    return typeof isChessRequest === "function" &&
        typeof startChessGame === "function" &&
        recipient.trim().toLowerCase() === "carmine empire" &&
        isChessRequest(text);
}

function handleSend() {
    if (typeof actions === "undefined" || typeof fallbackReplies === "undefined") {
        renderResponse("Error: actions.js was not loaded. Make sure actions.js is in the same folder as index.html.");
        return;
    }

    const sender = senderInput.value.trim();
    const recipient = recipientInput.value.trim();
    const actionText = actionInput.value.trim();

    if (!sender) {
        renderResponse("Choose a sender nation first.");
        return;
    }
    if (!recipient) {
        renderResponse("Choose a recipient nation first.");
        return;
    }
    if (!actionText) {
        renderResponse("Enter an action to send.");
        return;
    }

    const sentLine = sender + " to " + recipient + ": " + actionText;
    let replyLine;
    let afterReply = null;

    if (isChessEasterEgg(recipient, actionText)) {
        // Easter egg: Draven Morde of the Carmine Empire accepts a game of chess
        const intro = pickReply(dravenIntroReplies, "draven-intro");
        replyLine = "Draven Morde: " + fillNames(intro, sender, recipient);
        afterReply = startChessGame;
    } else {
        const action = findAction(actionText);
        const personality = findPersonality(recipient);
        const allied = personality && personality.allied && isAllied(recipient, sender) ? personality.allied : null;
        let replies;
        let replyKey;

        if (action) {
            replies = (allied && allied.actions[action.name]) ||
                (personality && personality.actions[action.name]) ||
                action.replies;
            replyKey = recipient + "|" + (allied ? "allied|" : "") + action.name;
        } else {
            replies = (allied && allied.fallback) ||
                (personality && personality.fallback) ||
                fallbackReplies;
            replyKey = recipient + "|" + (allied ? "allied|" : "") + "fallback";
        }

        const reply = pickReply(replies, replyKey);
        replyLine = recipient + ": " + fillNames(reply, sender, recipient);
    }

    // Show the sent message, then reveal the reply after a short pause
    sendButton.disabled = true;
    renderResponse(sentLine);

    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    setTimeout(function () {
        history.push({ sent: sentLine, reply: replyLine });
        while (history.length > MAX_HISTORY) {
            history.shift();
        }
        renderResponse();
        sendButton.disabled = false;
        if (afterReply) {
            afterReply(sender);
        }
    }, delay);
}

sendButton.addEventListener("click", handleSend);
