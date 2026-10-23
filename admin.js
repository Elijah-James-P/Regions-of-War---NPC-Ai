/*
  AUTHORITY PANEL (the gear button)
  ---------------------------------
  Lets people with the passcode view and change the relationship between each
  NPC nation and the real nations.

  How the data works:
    - relations.js holds the OFFICIAL relations that every visitor sees.
    - Changes made in the panel are saved in THIS browser only, and are marked
      "unpublished". To make them official, press "Publish to GitHub" (needs a
      GitHub token, see admin-config.js). The other way is "Download relations.js",
      then replace relations.js in the site folder with the download.

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
// The official relations in baseMap with this browser's changes laid on top
function effectiveRelationMap(baseMap) {
    const effective = {};

    [baseMap, localRelationMap].forEach(function (map) {
        Object.keys(map).forEach(function (npcKey) {
            Object.keys(map[npcKey]).forEach(function (realKey) {
                if (!effective[npcKey]) {
                    effective[npcKey] = {};
                }
                effective[npcKey][realKey] = map[npcKey][realKey];
            });
        });
    });

    return effective;
}

// baseMap is optional: the official relations to build on (defaults to the ones loaded with the page)
function buildRelationsFile(baseMap) {
    const npcs = readNationList("recipient-input");
    const reals = readNationList("sender-input");
    const effective = effectiveRelationMap(baseMap || officialRelationMap);

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
        "  change relationships, then press \"Publish to GitHub\" (or \"Download relations.js\"",
        "  and replace this file).",
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

/* ---------- Publishing to GitHub ---------- */

const GITHUB_API = "https://api.github.com";

// Where relations.js lives. Set in admin-config.js, or worked out from a github.io address.
// Returns { owner, repo, branch, path } or null when it cannot be worked out.
function githubTarget() {
    const config = typeof GITHUB_PUBLISH !== "undefined" && GITHUB_PUBLISH ? GITHUB_PUBLISH : {};
    let owner = String(config.owner || "").trim();
    let repo = String(config.repo || "").trim();
    const branch = String(config.branch || "").trim();
    const path = String(config.path || "relations.js").trim().replace(/^\/+/, "");

    if ((!owner || !repo) && typeof location !== "undefined" && /\.github\.io$/i.test(location.hostname)) {
        const siteOwner = location.hostname.split(".")[0];
        const firstFolder = location.pathname.split("/")[1] || "";
        owner = owner || siteOwner;
        // "owner.github.io/some-repo/" is a project site; the bare address is the owner's own site
        repo = repo || (firstFolder && firstFolder.indexOf(".") === -1 ? firstFolder : siteOwner + ".github.io");
    }

    if (!owner || !repo || !path) {
        return null;
    }
    return { owner: owner, repo: repo, branch: branch, path: path };
}

function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
}

function base64ToUtf8(base64) {
    const binary = atob(String(base64).replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

// Reads the relations out of the text of a relations.js file. Returns null if it can't be understood.
function parseRelationsFileText(text) {
    const code = String(text)
        .replace(/\/\*[\s\S]*?\*\//g, "")          // comments, which may contain an example
        .replace(/^\s*\/\/.*$/gm, "");
    const marker = code.indexOf("officialRelations");
    const equals = marker === -1 ? -1 : code.indexOf("=", marker);
    const start = equals === -1 ? -1 : code.indexOf("{", equals);
    const end = code.lastIndexOf("}");
    if (start === -1 || end < start) {
        return null;
    }
    try {
        const literal = code.slice(start, end + 1).replace(/,(\s*})/g, "$1");
        return readRelationMap(JSON.parse(literal));
    } catch (error) {
        return null;
    }
}

// Makes the in-page official relations match a new set (used after a successful publish)
function replaceOfficialRelations(map) {
    Object.keys(officialRelationMap).forEach(function (key) {
        delete officialRelationMap[key];
    });
    Object.keys(map).forEach(function (key) {
        officialRelationMap[key] = map[key];
    });
}

function githubError(message, authFailed) {
    const error = new Error(message);
    error.authFailed = !!authFailed;
    return error;
}

// Turns a GitHub error response into a message that says what to do next
function githubErrorFor(status, data, target) {
    const detail = data && data.message ? " GitHub says: " + data.message : "";
    const where = target.owner + "/" + target.repo;
    if (status === 401) {
        return githubError("GitHub rejected the token. It may be mistyped, expired or revoked. Paste a fresh one and try again.", true);
    }
    if (status === 403) {
        if (data && /rate limit/i.test(String(data.message))) {
            return githubError("GitHub's rate limit was reached. Wait a few minutes and try again.");
        }
        return githubError("The token is not allowed to change " + where + ". It needs \"Contents: Read and write\" permission on that repository." + detail);
    }
    if (status === 404) {
        return githubError("GitHub can't find " + where + " (or the branch) with this token. Check the names in admin-config.js and that the token has access to that repository." + detail);
    }
    return githubError("GitHub returned an error (" + status + ")." + detail);
}

async function githubRequest(token, method, url, body) {
    let response;
    try {
        const options = {
            method: method,
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + token,
                "X-GitHub-Api-Version": "2022-11-28"
            }
        };
        if (body) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }
        response = await fetch(url, options);
    } catch (error) {
        throw githubError("Could not reach GitHub. Check your internet connection and try again.");
    }

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        // Some responses have no body
    }
    return { status: response.status, data: data };
}

/*
  Saves the new relations.js into the repository. It first reads the file that is on
  GitHub right now and lays this browser's changes on top of it, so relations published
  from somewhere else in the meantime are kept. Resolves with:
    { unchanged: true }                              GitHub already had exactly this
    { unchanged: false, commitUrl, changeCount, baseUnreadable }
  and rejects with an Error whose message can be shown as it is.
*/
async function publishRelationsToGitHub(token) {
    const target = githubTarget();
    if (!target) {
        throw githubError("The repository is not set. Open admin-config.js and fill in owner and repo in GITHUB_PUBLISH.");
    }

    const repoUrl = GITHUB_API + "/repos/" + encodeURIComponent(target.owner) + "/" + encodeURIComponent(target.repo);
    const fileUrl = repoUrl + "/contents/" + target.path.split("/").map(encodeURIComponent).join("/");
    const changeCount = countUnpublishedRelations();
    let lastProblem = null;

    // A second try is allowed in case the file changed on GitHub between reading and saving it
    for (let attempt = 0; attempt < 3; attempt++) {
        const current = await githubRequest(token, "GET", fileUrl + (target.branch ? "?ref=" + encodeURIComponent(target.branch) : ""));
        let sha = null;
        let remoteText = null;
        let base = officialRelationMap;
        let baseUnreadable = false;

        if (current.status === 200 && current.data && typeof current.data.content === "string") {
            sha = current.data.sha;
            remoteText = base64ToUtf8(current.data.content);
            const parsed = parseRelationsFileText(remoteText);
            if (parsed) {
                base = parsed;
            } else {
                baseUnreadable = true;
            }
        } else if (current.status === 404) {
            // Either the file does not exist yet, or the repository can't be seen with this token
            const repoCheck = await githubRequest(token, "GET", repoUrl);
            if (repoCheck.status !== 200) {
                throw githubErrorFor(repoCheck.status === 401 ? 401 : 404, repoCheck.data, target);
            }
        } else {
            throw githubErrorFor(current.status, current.data, target);
        }

        const merged = effectiveRelationMap(base);
        const newText = buildRelationsFile(base);

        if (remoteText !== null && remoteText.replace(/\r\n/g, "\n") === newText) {
            replaceOfficialRelations(merged);
            clearLocalRelations();
            return { unchanged: true };
        }

        const body = {
            message: "Update relations (" + changeCount + (changeCount === 1 ? " change" : " changes") + ") from the authority panel",
            content: utf8ToBase64(newText)
        };
        if (sha) {
            body.sha = sha;
        }
        if (target.branch) {
            body.branch = target.branch;
        }

        const saved = await githubRequest(token, "PUT", fileUrl, body);
        if (saved.status === 200 || saved.status === 201) {
            replaceOfficialRelations(merged);
            clearLocalRelations();
            return {
                unchanged: false,
                commitUrl: saved.data && saved.data.commit ? saved.data.commit.html_url : "",
                changeCount: changeCount,
                baseUnreadable: baseUnreadable
            };
        }

        if (saved.status === 409 || saved.status === 422) {
            lastProblem = githubErrorFor(saved.status, saved.data, target);
            continue;
        }
        throw githubErrorFor(saved.status, saved.data, target);
    }

    throw githubError("The file kept changing on GitHub while publishing. Wait a moment and try again." +
        (lastProblem ? " (" + lastProblem.message + ")" : ""));
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
    const tokenInput = document.getElementById("admin-token");
    const forgetTokenButton = document.getElementById("admin-forget-token");
    const publishButton = document.getElementById("admin-publish");
    const publishStatus = document.getElementById("admin-publish-status");

    let githubToken = "";            // kept in memory only: never saved, gone on reload or lock

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
                " saved in this browser only. Press \"Publish to GitHub\" to make them official for everyone.";
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

    /* ---------- Publish to GitHub (panel side) ---------- */

    function setPublishStatus(kind, text, linkUrl, linkText) {
        clearElement(publishStatus);
        publishStatus.className = "publish-status" + (kind ? " " + kind : "");
        publishStatus.appendChild(document.createTextNode(text));
        if (linkUrl && /^https:\/\/github\.com\//.test(linkUrl)) {
            publishStatus.appendChild(document.createTextNode(" "));
            const link = document.createElement("a");
            link.href = linkUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = linkText;
            publishStatus.appendChild(link);
        }
    }

    function updateTokenUi() {
        const held = githubToken !== "";
        tokenInput.placeholder = held ? "Token held for this visit" : "Paste your token (needed once per visit)";
        forgetTokenButton.hidden = !held;
    }

    function forgetToken() {
        githubToken = "";
        tokenInput.value = "";
        updateTokenUi();
    }

    function refreshAfterPublish() {
        if (currentNpc) {
            renderRelationMap();
            renderChooser();
        } else {
            renderNpcGrid();
        }
        updateUnpublishedNote();
    }

    async function publishToGitHub() {
        const typed = tokenInput.value.trim();
        if (typed) {
            githubToken = typed;
        }
        if (!githubToken) {
            setPublishStatus("error", "Paste your GitHub token first.");
            tokenInput.focus();
            return;
        }

        const count = countUnpublishedRelations();
        if (count === 0) {
            setPublishStatus("", "Nothing to publish. There are no unpublished changes.");
            return;
        }

        const target = githubTarget();
        if (!target) {
            setPublishStatus("error", "The repository is not set. Open admin-config.js and fill in owner and repo in GITHUB_PUBLISH.");
            return;
        }

        const question = "Publish " + count + (count === 1 ? " change" : " changes") + " to " +
            target.owner + "/" + target.repo + " (" + target.path + ")?\n\nThis updates the relations for every visitor.";
        if (typeof window.confirm === "function" && !window.confirm(question)) {
            return;
        }

        publishButton.disabled = true;
        setPublishStatus("", "Publishing to GitHub...");

        try {
            const result = await publishRelationsToGitHub(githubToken);
            tokenInput.value = "";
            updateTokenUi();
            refreshAfterPublish();

            if (result.unchanged) {
                setPublishStatus("ok", "GitHub already has these relations, so nothing new was saved. The live site shows them within a minute or two.");
            } else {
                setPublishStatus(
                    "ok",
                    "Published " + result.changeCount + (result.changeCount === 1 ? " change" : " changes") +
                        ". The live site updates in a minute or two, and your browser may show the old relations if you reload before then." +
                        (result.baseUnreadable ? " Note: the relations.js already on GitHub could not be read, so the new file was built from this page's copy. If someone else changed relations recently, check the commit." : ""),
                    result.commitUrl,
                    "View the commit"
                );
            }
        } catch (error) {
            if (error.authFailed) {
                forgetToken();
            } else {
                tokenInput.value = "";
                updateTokenUi();
            }
            setPublishStatus("error", error.message || "Publishing failed.");
        } finally {
            publishButton.disabled = false;
        }
    }

    publishButton.addEventListener("click", publishToGitHub);
    forgetTokenButton.addEventListener("click", function () {
        forgetToken();
        setPublishStatus("", "Token forgotten.");
    });
    tokenInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            publishToGitHub();
        }
    });

    document.getElementById("admin-lock").addEventListener("click", function () {
        adminUnlocked = false;
        forgetToken();
        setPublishStatus("", "");
        closeModal(panelOverlay);
    });
}
