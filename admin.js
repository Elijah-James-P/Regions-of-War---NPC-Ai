/*
  AUTHORITY PANEL (the gear button)
  ---------------------------------
  Lets people with the passcode view and change the relationship between each
  NPC nation and the real nations.

  How the data works:
    - relations.js holds the OFFICIAL relations that every visitor sees.
    - Changes made in the panel are saved in THIS browser only, and are marked
      "unpublished". To make them official, press "Download relations.js" and
      replace relations.js in the site folder with the download.

  The nation names come from the two dropdown lists in index.html (Sender = real
  nations, Recipient = NPC nations), so editing those lists updates the panel.
  Needs admin-config.js and relations.js to be loaded first.
*/

const RELATION_STATUSES = ["Allied", "Friendly", "Neutral", "Hostile", "At War"];
const RELATION_DEFAULT = "Neutral";
const RELATION_STORAGE_KEY = "regionsOfWarRelationsLocal";
const ADMIN_MAX_ATTEMPTS = 5;      // wrong passcodes allowed before a short lockout
const ADMIN_LOCK_SECONDS = 30;     // how long the lockout lasts

/* ---------- Relationship data ---------- */

function relationName(name) {
    return String(name).trim().toLowerCase();
}

// Reads {"Carmine Empire": {"Real Nation 1": "Allied"}} into lowercase keys, ignoring bad statuses
function readRelationMap(raw) {
    const map = {};
    if (!raw || typeof raw !== "object") {
        return map;
    }
    Object.keys(raw).forEach(function (npc) {
        const pairs = raw[npc];
        if (!pairs || typeof pairs !== "object") {
            return;
        }
        Object.keys(pairs).forEach(function (real) {
            if (RELATION_STATUSES.indexOf(pairs[real]) === -1) {
                return;
            }
            const npcKey = relationName(npc);
            if (!map[npcKey]) {
                map[npcKey] = {};
            }
            map[npcKey][relationName(real)] = pairs[real];
        });
    });
    return map;
}

function loadLocalRelations() {
    try {
        return readRelationMap(JSON.parse(localStorage.getItem(RELATION_STORAGE_KEY)));
    } catch (error) {
        return {};
    }
}

function saveLocalRelations() {
    try {
        localStorage.setItem(RELATION_STORAGE_KEY, JSON.stringify(localRelationMap));
    } catch (error) {
        // Storage unavailable: changes last until the page is closed
    }
}

const officialRelationMap = readRelationMap(typeof officialRelations !== "undefined" ? officialRelations : {});
let localRelationMap = loadLocalRelations();

function lookupRelation(map, npc, real) {
    const pairs = map[relationName(npc)];
    const status = pairs ? pairs[relationName(real)] : null;
    return status || null;
}

// The status an authority has set for this pair, or null if nobody has set one
function getExplicitRelation(npc, real) {
    return lookupRelation(localRelationMap, npc, real) || lookupRelation(officialRelationMap, npc, real);
}

function getRelationStatus(npc, real) {
    return getExplicitRelation(npc, real) || RELATION_DEFAULT;
}

function setLocalRelation(npc, real, status) {
    const npcKey = relationName(npc);
    if (!localRelationMap[npcKey]) {
        localRelationMap[npcKey] = {};
    }
    localRelationMap[npcKey][relationName(real)] = status;
    saveLocalRelations();
}

// True when this pair's status was changed here but is not in relations.js yet
function isUnpublishedRelation(npc, real) {
    const local = lookupRelation(localRelationMap, npc, real);
    return local !== null && local !== lookupRelation(officialRelationMap, npc, real);
}

function countUnpublishedRelations() {
    let count = 0;
    Object.keys(localRelationMap).forEach(function (npcKey) {
        Object.keys(localRelationMap[npcKey]).forEach(function (realKey) {
            if (isUnpublishedRelation(npcKey, realKey)) {
                count++;
            }
        });
    });
    return count;
}

function clearLocalRelations() {
    localRelationMap = {};
    saveLocalRelations();
}

// Reads a dropdown list from the page: "sender-input" = real nations, "recipient-input" = NPC nations
function readNationList(inputId) {
    const input = document.getElementById(inputId);
    const picker = input && input.closest(".nation-picker");
    if (!picker) {
        return [];
    }
    return Array.prototype.map.call(picker.querySelectorAll("li"), function (item) {
        return item.textContent.trim();
    });
}

// Builds the text of a new relations.js file from the official and local relations
function buildRelationsFile() {
    const npcs = readNationList("recipient-input");
    const reals = readNationList("sender-input");
    const effective = {};

    [officialRelationMap, localRelationMap].forEach(function (map) {
        Object.keys(map).forEach(function (npcKey) {
            Object.keys(map[npcKey]).forEach(function (realKey) {
                if (!effective[npcKey]) {
                    effective[npcKey] = {};
                }
                effective[npcKey][realKey] = map[npcKey][realKey];
            });
        });
    });

    function displayNames(list) {
        const names = {};
        list.forEach(function (name) { names[relationName(name)] = name; });
        return names;
    }

    // Known names keep the page's order and spelling; anything else is kept at the end
    function orderedKeys(known, present) {
        const knownKeys = known.map(relationName).filter(function (key) { return present.indexOf(key) !== -1; });
        const others = present.filter(function (key) { return knownKeys.indexOf(key) === -1; });
        return knownKeys.concat(others);
    }

    const npcNames = displayNames(npcs);
    const realNames = displayNames(reals);
    const blocks = [];

    orderedKeys(npcs, Object.keys(effective)).forEach(function (npcKey) {
        const pairs = effective[npcKey];
        const rows = orderedKeys(reals, Object.keys(pairs)).map(function (realKey) {
            return "        " + JSON.stringify(realNames[realKey] || realKey) + ": " + JSON.stringify(pairs[realKey]);
        });
        blocks.push("    " + JSON.stringify(npcNames[npcKey] || npcKey) + ": {\n" + rows.join(",\n") + "\n    }");
    });

    return [
        "/*",
        "  RELATIONS BETWEEN NATIONS",
        "  Official relationships between NPC nations and real nations.",
        "  Written by the authority panel. To update it, use the gear button on the site,",
        "  change relationships, press \"Download relations.js\" and replace this file.",
        "  Statuses: \"Allied\", \"Friendly\", \"Neutral\", \"Hostile\", \"At War\"",
        "  Any pair that is not listed counts as Neutral.",
        "*/",
        "",
        "const officialRelations = {",
        blocks.join(",\n"),
        "};",
        ""
    ].join("\n").replace("{\n\n};", "{\n};");
}

function downloadRelationsFile() {
    const blob = new Blob([buildRelationsFile()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relations.js";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/* ---------- Passcode lock ---------- */

let adminUnlocked = false;       // stays unlocked until the page is reloaded or the panel is locked
let adminFailedAttempts = 0;
let adminLockedUntil = 0;

// Returns { ok: true } or { ok: false, message: "..." }
function checkAdminPasscode(input) {
    const now = Date.now();
    if (now < adminLockedUntil) {
        const wait = Math.ceil((adminLockedUntil - now) / 1000);
        return { ok: false, message: "Too many attempts. Try again in " + wait + " seconds." };
    }
    if (!input.trim()) {
        return { ok: false, message: "Enter the passcode." };
    }
    if (adminHash(input) === ADMIN_PASSCODE_HASH) {
        adminFailedAttempts = 0;
        return { ok: true };
    }
    adminFailedAttempts++;
    if (adminFailedAttempts >= ADMIN_MAX_ATTEMPTS) {
        adminFailedAttempts = 0;
        adminLockedUntil = Date.now() + ADMIN_LOCK_SECONDS * 1000;
        return { ok: false, message: "Too many attempts. Try again in " + ADMIN_LOCK_SECONDS + " seconds." };
    }
    return { ok: false, message: "Incorrect passcode." };
}

/* ---------- Panel interface ---------- */

const adminGear = document.getElementById("admin-gear");

if (adminGear) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const loginOverlay = document.getElementById("modal-admin-login");
    const panelOverlay = document.getElementById("modal-admin");
    const passcodeInput = document.getElementById("admin-passcode");
    const submitButton = document.getElementById("admin-submit");
    const errorText = document.getElementById("admin-error");
    const listView = document.getElementById("admin-list-view");
    const mapView = document.getElementById("admin-map-view");
    const npcGrid = document.getElementById("admin-npc-grid");
    const mapTitle = document.getElementById("admin-map-title");
    const mapSvg = document.getElementById("relation-map");
    const chooser = document.getElementById("admin-chooser");
    const unpublishedNote = document.getElementById("admin-unpublished");

    let currentNpc = "";
    let selectedReal = "";

    function statusSlug(status) {
        return status.toLowerCase().replace(/\s+/g, "-");
    }

    function svgElement(tag, attributes, parent) {
        const element = document.createElementNS(SVG_NS, tag);
        Object.keys(attributes || {}).forEach(function (key) {
            element.setAttribute(key, attributes[key]);
        });
        if (parent) {
            parent.appendChild(element);
        }
        return element;
    }

    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    // Shrinks long names so they fit inside their box
    function fitFontSize(text, maxWidth, baseSize) {
        return Math.max(9, Math.min(baseSize, maxWidth / (text.length * 0.5))).toFixed(1);
    }

    // Splits a long name over two lines at the space nearest the middle
    function splitName(name) {
        if (name.length <= 12 || name.indexOf(" ") === -1) {
            return [name];
        }
        const middle = name.length / 2;
        let best = -1;
        for (let i = 0; i < name.length; i++) {
            if (name[i] === " " && (best === -1 || Math.abs(i - middle) < Math.abs(best - middle))) {
                best = i;
            }
        }
        return [name.slice(0, best), name.slice(best + 1)];
    }

    function updateUnpublishedNote() {
        const count = countUnpublishedRelations();
        unpublishedNote.textContent = count === 0
            ? "No unpublished changes. Everything shown matches relations.js."
            : count + (count === 1 ? " unpublished change" : " unpublished changes") +
                " saved in this browser only. Press \"Download relations.js\" and replace that file in your site folder to make them official.";
    }

    function showListView() {
        currentNpc = "";
        selectedReal = "";
        mapView.hidden = true;
        listView.hidden = false;
        renderNpcGrid();
        updateUnpublishedNote();
    }

    function renderNpcGrid() {
        clearElement(npcGrid);
        const npcs = readNationList("recipient-input");
        if (npcs.length === 0) {
            const empty = document.createElement("p");
            empty.className = "admin-note";
            empty.textContent = "No NPC nations were found in the Recipient Nation list.";
            npcGrid.appendChild(empty);
            return;
        }
        npcs.forEach(function (npc) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "npc-choice";

            const name = document.createElement("span");
            name.className = "npc-choice-name";
            name.textContent = npc;
            button.appendChild(name);

            const set = readNationList("sender-input").filter(function (real) {
                const status = getExplicitRelation(npc, real);
                return status && status !== RELATION_DEFAULT;
            }).length;
            const detail = document.createElement("span");
            detail.className = "npc-choice-detail";
            detail.textContent = set === 0 ? "All neutral" : set + (set === 1 ? " relation set" : " relations set");
            button.appendChild(detail);

            button.addEventListener("click", function () {
                showMapView(npc);
            });
            npcGrid.appendChild(button);
        });
    }

    function showMapView(npc) {
        currentNpc = npc;
        selectedReal = "";
        listView.hidden = true;
        mapView.hidden = false;
        mapTitle.textContent = npc;
        renderRelationMap();
        renderChooser();
        updateUnpublishedNote();
    }

    function selectReal(name) {
        selectedReal = name;
        renderRelationMap();
        renderChooser();
    }

    // Draws the NPC nation in the centre with a line to every real nation
    function renderRelationMap() {
        clearElement(mapSvg);
        const reals = readNationList("sender-input");
        const cx = 380;
        const cy = 250;
        const radiusX = 285;
        const radiusY = 185;
        const pillWidth = reals.length > 8 ? 118 : 142;
        const pillHeight = 44;

        const lines = svgElement("g", { "class": "rel-lines" }, mapSvg);
        const nodes = svgElement("g", { "class": "rel-nodes" }, mapSvg);

        reals.forEach(function (name, i) {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / reals.length;
            const x = cx + radiusX * Math.cos(angle);
            const y = cy + radiusY * Math.sin(angle);
            const status = getRelationStatus(currentNpc, name);
            const slug = statusSlug(status);
            const selected = name === selectedReal;

            svgElement("line", {
                x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1),
                "class": "rel-line status-" + slug + (selected ? " selected" : "")
            }, lines);

            const node = svgElement("g", {
                "class": "rel-node status-" + slug + (selected ? " selected" : ""),
                tabindex: "0",
                role: "button",
                "aria-label": name + ": " + status + ". Press to change."
            }, nodes);

            svgElement("rect", {
                "class": "rel-pill",
                x: (x - pillWidth / 2).toFixed(1), y: (y - pillHeight / 2).toFixed(1),
                width: pillWidth, height: pillHeight, rx: 6
            }, node);

            const nameText = svgElement("text", {
                "class": "rel-name", x: x.toFixed(1), y: (y - 4).toFixed(1),
                "text-anchor": "middle", "font-size": fitFontSize(name, pillWidth - 16, 15)
            }, node);
            nameText.textContent = name;

            const statusText = svgElement("text", {
                "class": "rel-status", x: x.toFixed(1), y: (y + 13).toFixed(1), "text-anchor": "middle"
            }, node);
            statusText.textContent = status + (isUnpublishedRelation(currentNpc, name) ? " \u2022" : "");

            node.addEventListener("click", function () { selectReal(name); });
            node.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectReal(name);
                }
            });
        });

        // The NPC nation sits on top in the middle, covering where the lines meet
        const center = svgElement("g", { "class": "rel-center" }, mapSvg);
        svgElement("circle", { "class": "rel-center-circle", cx: cx, cy: cy, r: 66 }, center);
        svgElement("circle", { "class": "rel-center-ring", cx: cx, cy: cy, r: 58 }, center);
        const parts = splitName(currentNpc);
        parts.forEach(function (part, i) {
            const text = svgElement("text", {
                "class": "rel-center-name", x: cx,
                y: (cy + (parts.length === 1 ? 6 : (i === 0 ? -4 : 18))).toFixed(1),
                "text-anchor": "middle", "font-size": fitFontSize(part, 104, 20)
            }, center);
            text.textContent = part;
        });

        if (reals.length === 0) {
            const empty = svgElement("text", { "class": "rel-empty", x: cx, y: cy + 110, "text-anchor": "middle" }, mapSvg);
            empty.textContent = "No real nations were found in the Sender Nation list.";
        }
    }

    // The row of status buttons for the nation that was clicked
    function renderChooser() {
        clearElement(chooser);

        if (!selectedReal) {
            const hint = document.createElement("p");
            hint.className = "admin-note";
            hint.textContent = "Click a real nation on the map to change its relationship with " + currentNpc + ".";
            chooser.appendChild(hint);
            return;
        }

        const current = getRelationStatus(currentNpc, selectedReal);
        const heading = document.createElement("p");
        heading.className = "chooser-heading";
        heading.textContent = currentNpc + " and " + selectedReal + ": " + current +
            (isUnpublishedRelation(currentNpc, selectedReal) ? " (unpublished)" : "");
        chooser.appendChild(heading);

        const row = document.createElement("div");
        row.className = "status-buttons";
        RELATION_STATUSES.forEach(function (status) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "status-btn status-" + statusSlug(status) + (status === current ? " active" : "");
            button.setAttribute("aria-pressed", status === current ? "true" : "false");
            button.textContent = status;
            button.addEventListener("click", function () {
                setLocalRelation(currentNpc, selectedReal, status);
                renderRelationMap();
                renderChooser();
                updateUnpublishedNote();
            });
            row.appendChild(button);
        });
        chooser.appendChild(row);
    }

    function openLogin() {
        passcodeInput.value = "";
        errorText.textContent = "";
        openModal("admin-login");
        setTimeout(function () { passcodeInput.focus(); }, 60);
    }

    function openPanel() {
        openModal("admin");
        showListView();
    }

    function submitPasscode() {
        const result = checkAdminPasscode(passcodeInput.value);
        if (result.ok) {
            adminUnlocked = true;
            passcodeInput.value = "";
            closeModal(loginOverlay);
            openPanel();
            return;
        }
        errorText.textContent = result.message;
        errorText.classList.remove("shake");
        void errorText.offsetWidth;          // restarts the shake animation
        errorText.classList.add("shake");
        passcodeInput.value = "";
        passcodeInput.focus();
    }

    adminGear.addEventListener("click", function () {
        if (adminUnlocked) {
            openPanel();
        } else {
            openLogin();
        }
    });

    submitButton.addEventListener("click", submitPasscode);
    passcodeInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            submitPasscode();
        }
    });

    document.getElementById("admin-back").addEventListener("click", showListView);
    document.getElementById("admin-download").addEventListener("click", downloadRelationsFile);

    document.getElementById("admin-clear").addEventListener("click", function () {
        if (countUnpublishedRelations() === 0) {
            return;
        }
        if (typeof window.confirm === "function" && !window.confirm("Discard all unpublished changes in this browser?")) {
            return;
        }
        clearLocalRelations();
        if (currentNpc) {
            renderRelationMap();
            renderChooser();
        } else {
            renderNpcGrid();
        }
        updateUnpublishedNote();
    });

    document.getElementById("admin-lock").addEventListener("click", function () {
        adminUnlocked = false;
        closeModal(panelOverlay);
    });
}
