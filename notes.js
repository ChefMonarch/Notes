/*  GET DOM ELEMENTS  */
const addFileBtn = document.getElementById("addFileBtn"); // "+" add button
const fileList = document.getElementById("fileList"); // UL container for files
const txtFile = document.getElementById("TxtFile"); // Text editor
const placeholder = document.getElementById("placeholder"); // Placeholder div
const modal = document.getElementById("modal"); // Modal overlay
const modalTitle = document.getElementById("modalTitle"); // Modal title
const modalInput = document.getElementById("modalInput"); // Modal input
const modalOk = document.getElementById("modalOk"); // Modal OK button
const modalCancel = document.getElementById("modalCancel"); // Modal Cancel button
const modeToggle = document.getElementById("modeToggle"); // Dark/Light toggle

/*  STORAGE & DATA  */
const STORAGE_PREFIX = "tester";
const STORAGE_VERSION = "v1";
const STORAGE_KEY = `${STORAGE_PREFIX}_desktop_files_${STORAGE_VERSION}`;
const THEME_KEY = `${STORAGE_PREFIX}_theme_${STORAGE_VERSION}`;

let files = []; 
let activeFileId = null;

/*  MODAL FUNCTIONS  */
// Close modal
function closeModal() {
    modal.classList.add("hidden");
    modalInput.style.display = "block"; // reset input
    modalOk.textContent = "OK"; // reset button text
}

// Show modal for add or rename action
function showModal(title, defaultValue = "") {
    modalTitle.textContent = title;
    modalInput.value = defaultValue;
    modalInput.style.display = "block";
    modal.classList.remove("hidden");
    modalInput.focus();

    return new Promise(resolve => {
        function okHandler() {
            resolve(modalInput.value.trim());
            closeModal();
        }
        function cancelHandler() {
            resolve(null);
            closeModal();
        }
        modalOk.addEventListener("click", okHandler, {once:true});
        modalCancel.addEventListener("click", cancelHandler, {once:true});
    });
}

// Show confirm modal for delete with Yes/Cancel buttons
function showConfirmModal(title) {
    modalTitle.textContent = title;
    modalInput.style.display = "none";
    modalOk.textContent = "Yes";
    modalCancel.textContent = "Cancel";
    modal.classList.remove("hidden");

    return new Promise(resolve => {
        function yesHandler() {
            resolve(true);
            closeModal();
        }
        function cancelHandler() {
            resolve(false);
            closeModal();
        }
        modalOk.addEventListener("click", yesHandler, {once:true});
        modalCancel.addEventListener("click", cancelHandler, {once:true});
    });
}

/*  LOAD & SAVE FILES  */
window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) files = JSON.parse(saved);
    renderFileList();
    updatePlaceholder();

    // Apply saved dark/light mode
    const savedMode = localStorage.getItem(THEME_KEY);
    if (savedMode === "dark") {
        document.body.classList.add("dark-mode");
        modeToggle.checked = true;
    }
});

// Save files to localStorage
function saveFiles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

/*  RENDER FILE LIST  */
function renderFileList() {
    fileList.innerHTML = "";
    files.forEach(file => {
        const li = document.createElement("li");
        li.dataset.id = file.id;
        if (file.id === activeFileId) li.classList.add("active");

        const span = document.createElement("span");
        span.textContent = file.name;
        span.classList.add("fileName");
        li.appendChild(span);

        const renameBtn = document.createElement("button");
        renameBtn.textContent = "✎";
        renameBtn.classList.add("renameBtn");
        li.appendChild(renameBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑";
        deleteBtn.classList.add("deleteBtn");
        li.appendChild(deleteBtn);

        fileList.appendChild(li);
    });
    updatePlaceholder();
}

/*  PLACEHOLDER  */
function updatePlaceholder() {
    if (!activeFileId) {
        placeholder.style.display = "block";
        txtFile.style.display = "none";
    } else {
        placeholder.style.display = "none";
        txtFile.style.display = "block";
    }
}

/*  ADD FILE  */
addFileBtn.addEventListener("click", async () => {
    const name = await showModal("Enter new file name:", "Untitled");
    if (!name) return;
    const id = Date.now().toString();
    files.push({id, name, content:""});
    activeFileId = id;
    txtFile.value = "";
    renderFileList();
    saveFiles();
});

/*  SELECT / RENAME / DELETE FILE  */
fileList.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const file = files.find(f => f.id === li.dataset.id);
    if (!file) return;

    // Rename file
    if (e.target.classList.contains("renameBtn")) {
        const newName = await showModal("Rename file:", file.name);
        if (newName) {
            file.name = newName;
            renderFileList();
            saveFiles();
        }
        return;
    }

    // Delete file
    if (e.target.classList.contains("deleteBtn")) {
        const confirmDelete = await showConfirmModal(`Delete "${file.name}"?`);
        if (confirmDelete) {
            files = files.filter(f => f.id !== file.id);
            if (activeFileId === file.id) activeFileId = null;
            renderFileList();
            saveFiles();
        }
        return;
    }

    // Select file
    activeFileId = file.id;
    txtFile.value = file.content;
    renderFileList();
});

/*  EDIT FILE CONTENT  */
txtFile.addEventListener("input", () => {
    if (!activeFileId) return;
    const file = files.find(f => f.id === activeFileId);
    if (file) {
        file.content = txtFile.value;
        saveFiles();
    }
});

/*  DARK / LIGHT MODE TOGGLE  */
modeToggle.addEventListener("change", () => {
    if (modeToggle.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem(THEME_KEY,"dark");
    } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem(THEME_KEY,"light");
    }
});