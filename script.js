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

function fillNames(reply, sender, recipient) {
    return reply.split("{sender}").join(sender).split("{recipient}").join(recipient);
}

function handleSend() {
    if (typeof actions === "undefined" || typeof fallbackReplies === "undefined") {
        responseBox.value = "Error: actions.js was not loaded. Make sure actions.js is in the same folder as index.html.";
        return;
    }

    const sender = senderInput.value.trim();
    const recipient = recipientInput.value.trim();
    const actionText = actionInput.value.trim();

    if (!sender) {
        responseBox.value = "Choose a sender nation first.";
        return;
    }
    if (!recipient) {
        responseBox.value = "Choose a recipient nation first.";
        return;
    }
    if (!actionText) {
        responseBox.value = "Enter an action to send.";
        return;
    }

    const action = findAction(actionText);
    const reply = action
        ? pickReply(action.replies, action.name)
        : pickReply(fallbackReplies, "fallback");

    responseBox.value = fillNames(reply, sender, recipient);
}

sendButton.addEventListener("click", handleSend);
