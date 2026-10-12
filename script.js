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

const recipientInput = document.getElementById("recipient-input");
const nationDropdown = document.getElementById("nation-dropdown");

function openDropdown() {
    nationDropdown.classList.add("open");
}

function closeDropdown() {
    nationDropdown.classList.remove("open");
}

recipientInput.addEventListener("focus", openDropdown);
recipientInput.addEventListener("click", openDropdown);

nationDropdown.querySelectorAll("li").forEach(function (item) {
    item.addEventListener("click", function () {
        recipientInput.value = item.textContent;
        closeDropdown();
    });
});

document.addEventListener("click", function (event) {
    if (event.target !== recipientInput && !nationDropdown.contains(event.target)) {
        closeDropdown();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeDropdown();
    }
});
