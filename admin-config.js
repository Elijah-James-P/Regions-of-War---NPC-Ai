/*
  ADMIN SETTINGS
  --------------
  This file holds the passcode lock for the authority panel (the gear button).

  Only a scrambled version of the passcode (a "hash") is stored here, never the
  passcode itself. To change the passcode:
    1. Open passcode-maker.html in your browser.
    2. Type your new passcode and press the button.
    3. Copy the line it gives you and paste it over the ADMIN_PASSCODE_HASH line below.

  PLEASE READ: this lock runs in the visitor's browser, so it keeps casual visitors
  out but it is not bank-level security. Someone with technical skill could get past it,
  but all they could change is their own copy of the page. The relations everyone
  else sees come from relations.js in your GitHub repository, and changing that
  needs your GitHub token as well, so the token (not this passcode) is the real key
  to the live site. Pick a long passcode (a few random words works well) so it
  cannot be guessed from the hash.
*/

const ADMIN_SALT = "regions-of-war";
const ADMIN_HASH_ROUNDS = 20000;

// The passcode for the first run is: gaeia-admin   (change it as described above!)
const ADMIN_PASSCODE_HASH = "780965d73bf8eeb1fa6c61b387f4c59e36e5b38cc1f5abeecbd475f381a7b5dd";

/*
  GITHUB PUBLISHING
  -----------------
  The "Publish to GitHub" button in the Relations Ledger saves the new relations.js
  straight into your repository, so every visitor sees the change once GitHub Pages
  has rebuilt the site (usually a minute or two).

    owner  - the GitHub user or organisation that owns the site's repository
    repo   - the repository's name
    branch - the branch GitHub Pages publishes from (leave "" for the default branch)
    path   - where relations.js sits inside the repository ("relations.js" if it is in
             the top folder, or something like "docs/relations.js" if the site lives
             in a docs folder)

  If owner and repo are left empty and the site is on a github.io address, they are
  worked out from the address automatically.

  The access token is NOT stored in this file or anywhere else. You paste it into the
  panel each visit. Create a "fine-grained personal access token" that is limited to
  this one repository, with "Contents: Read and write" permission.
*/
const GITHUB_PUBLISH = {
    owner: "",
    repo: "",
    branch: "",
    path: "relations.js"
};

/* ---------- Scrambling code (SHA-256). No need to edit anything below. ---------- */

function adminSha256(message) {
    const K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);

    function rotr(x, n) {
        return (x >>> n) | (x << (32 - n));
    }

    const data = new TextEncoder().encode(message);
    const paddedLength = ((data.length + 9 + 63) >> 6) << 6;
    const padded = new Uint8Array(paddedLength);
    padded.set(data);
    padded[data.length] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, Math.floor((data.length * 8) / 4294967296));
    view.setUint32(paddedLength - 4, (data.length * 8) >>> 0);

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    for (let offset = 0; offset < paddedLength; offset += 64) {
        for (let i = 0; i < 16; i++) {
            w[i] = view.getUint32(offset + i * 4);
        }
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = w[i - 16] + s0 + w[i - 7] + s1;
        }

        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) >>> 0;
            h = g; g = f; f = e;
            e = (d + t1) >>> 0;
            d = c; c = b; b = a;
            a = (t1 + t2) >>> 0;
        }

        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7].map(function (n) {
        return ("00000000" + n.toString(16)).slice(-8);
    }).join("");
}

// Scrambles a passcode many times over, which makes guessing it from the hash much slower
function adminHash(passcode) {
    const clean = String(passcode).trim();
    let digest = adminSha256(ADMIN_SALT + ":" + clean);
    for (let i = 1; i < ADMIN_HASH_ROUNDS; i++) {
        digest = adminSha256(digest + clean);
    }
    return digest;
}
