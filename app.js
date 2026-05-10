const STORAGE_KEYS = {
  chips: "life_site_chips",
  todos: "life_site_todos",
  photos: "life_site_photos",
  memos: "life_site_memos",
  rambles: "life_site_rambles"
};

const DEFAULT_STATE = {
  chips: ["城市漫步", "音乐充电", "快乐追剧"],
  todos: [
    { text: "下班后散步 20 分钟", done: false },
    { text: "听 3 首新歌", done: false }
  ],
  photos: [],
  memos: [],
  rambles: []
};

const chipsEl = document.getElementById("chips");
const chipInput = document.getElementById("chip-input");
const chipAddBtn = document.getElementById("chip-add-btn");

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

const photoTitleInput = document.getElementById("photo-title-input");
const photoFileInput = document.getElementById("photo-file-input");
const photoAddBtn = document.getElementById("photo-add-btn");
const photoList = document.getElementById("photo-list");

const memoInput = document.getElementById("memo-input");
const memoSaveBtn = document.getElementById("memo-save-btn");
const memoList = document.getElementById("memo-list");

const rambleInput = document.getElementById("ramble-input");
const rambleSaveBtn = document.getElementById("ramble-save-btn");
const rambleList = document.getElementById("ramble-list");

const moodButtons = document.querySelectorAll(".mood-btn");

const state = { chips: [], todos: [], photos: [], memos: [], rambles: [] };
let photoPreviewOpen = false;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function safeText(text) { return text.replace(/[<>&"'`]/g, ""); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function withId(item) { return { id: item.id || uid(), ...item }; }

const storage = {
  async readAll() {
    return {
      chips: JSON.parse(localStorage.getItem(STORAGE_KEYS.chips)) || null,
      todos: JSON.parse(localStorage.getItem(STORAGE_KEYS.todos)) || null,
      photos: JSON.parse(localStorage.getItem(STORAGE_KEYS.photos)) || null,
      memos: JSON.parse(localStorage.getItem(STORAGE_KEYS.memos)) || null,
      rambles: JSON.parse(localStorage.getItem(STORAGE_KEYS.rambles)) || null
    };
  },
  async writeAll(nextState) {
    localStorage.setItem(STORAGE_KEYS.chips, JSON.stringify(nextState.chips));
    localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(nextState.todos));
    localStorage.setItem(STORAGE_KEYS.photos, JSON.stringify(nextState.photos));
    localStorage.setItem(STORAGE_KEYS.memos, JSON.stringify(nextState.memos));
    localStorage.setItem(STORAGE_KEYS.rambles, JSON.stringify(nextState.rambles));
  }
};

async function loadState() {
  try {
    const remoteState = await storage.readAll();
    const fallback = clone(DEFAULT_STATE);

    state.chips = Array.isArray(remoteState.chips) ? remoteState.chips : fallback.chips;
    state.todos = Array.isArray(remoteState.todos) ? remoteState.todos.map(withId) : fallback.todos.map(withId);
    state.photos = Array.isArray(remoteState.photos) ? remoteState.photos.map(withId) : fallback.photos.map(withId);
    state.memos = Array.isArray(remoteState.memos) ? remoteState.memos.map(withId) : fallback.memos.map(withId);
    state.rambles = Array.isArray(remoteState.rambles) ? remoteState.rambles.map(withId) : fallback.rambles.map(withId);
  } catch (_err) {
    state.chips = clone(DEFAULT_STATE.chips);
    state.todos = clone(DEFAULT_STATE.todos).map(withId);
    state.photos = clone(DEFAULT_STATE.photos).map(withId);
    state.memos = [];
    state.rambles = [];
  }
}

async function saveState() {
  await storage.writeAll(state);
}

function renderChips() {
  chipsEl.innerHTML = "";
  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: deviceTimeZone
  }).format(new Date());

  const dateChip = document.createElement("span");
  dateChip.className = "chip";
  dateChip.textContent = now;
  chipsEl.appendChild(dateChip);

  state.chips.forEach((chip) => {
    const item = document.createElement("span");
    item.className = "chip";
    item.innerHTML = `<span>${safeText(chip)}</span><button type="button" aria-label="删除标签">×</button>`;
    item.querySelector("button").addEventListener("click", () => {
      state.chips = state.chips.filter((c) => c !== chip);
      saveState();
      renderChips();
    });
    chipsEl.appendChild(item);
  });
}

function addChip() {
  const value = chipInput.value.trim();
  if (!value) return;
  if (state.chips.includes(value)) { chipInput.value = ""; return; }
  state.chips.push(value);
  chipInput.value = "";
  saveState();
  renderChips();
}

function renderTodos() {
  todoList.innerHTML = "";
  state.todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");
    li.innerHTML = `
      <input type="checkbox" ${todo.done ? "checked" : ""} aria-label="完成状态" />
      <span class="todo-text">${safeText(todo.text)}</span>
      <button type="button" class="btn-danger">删除</button>
    `;

    const checkbox = li.querySelector("input");
    const removeBtn = li.querySelector("button");

    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveState();
      renderTodos();
    });

    removeBtn.addEventListener("click", () => {
      state.todos = state.todos.filter((item) => item.id !== todo.id);
      saveState();
      renderTodos();
    });

    todoList.appendChild(li);
  });
}

function addTodo(text) {
  const value = text.trim();
  if (!value) return;
  state.todos.unshift({ id: uid(), text: value, done: false });
  saveState();
  renderTodos();
}

function renderPhotos() {
  photoList.innerHTML = "";
  state.photos.forEach((photo) => {
    const li = document.createElement("li");
    li.className = "photo";
    li.dataset.title = photo.title || "我的照片";
    li.style.backgroundImage = `url("${photo.src}")`;
    li.innerHTML = `<button type="button" class="photo-remove" aria-label="删除照片">×</button>`;
    const removeBtn = li.querySelector("button");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.photos = state.photos.filter((item) => item.id !== photo.id);
      saveState();
      renderPhotos();
    });
    li.addEventListener("click", () => openPhotoPreview(photo));
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `查看大图：${photo.title || "我的照片"}`);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPhotoPreview(photo);
      }
    });
    photoList.appendChild(li);
  });
}

function ensurePhotoPreview() {
  let overlay = document.getElementById("photo-preview-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "photo-preview-overlay";
  overlay.className = "photo-preview-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="photo-preview-dialog" role="dialog" aria-modal="true" aria-label="图片预览">
      <button type="button" class="photo-preview-close" aria-label="关闭预览">×</button>
      <img class="photo-preview-image" alt="预览图片" />
      <p class="photo-preview-title"></p>
    </div>
  `;

  const dialog = overlay.querySelector(".photo-preview-dialog");
  const closeBtn = overlay.querySelector(".photo-preview-close");
  closeBtn.addEventListener("click", closePhotoPreview);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePhotoPreview();
  });
  dialog.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && photoPreviewOpen) closePhotoPreview();
  });

  document.body.appendChild(overlay);
  return overlay;
}

function openPhotoPreview(photo) {
  const overlay = ensurePhotoPreview();
  const image = overlay.querySelector(".photo-preview-image");
  const title = overlay.querySelector(".photo-preview-title");
  image.src = photo.src;
  image.alt = photo.title || "我的照片";
  title.textContent = photo.title || "我的照片";
  overlay.hidden = false;
  photoPreviewOpen = true;
  document.body.classList.add("preview-open");
}

function closePhotoPreview() {
  const overlay = document.getElementById("photo-preview-overlay");
  if (!overlay) return;
  overlay.hidden = true;
  photoPreviewOpen = false;
  document.body.classList.remove("preview-open");
}

function addPhoto() {
  const file = photoFileInput.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    const title = photoTitleInput.value.trim() || file.name.replace(/\.[^/.]+$/, "");
    state.photos.unshift({ id: uid(), title: title.slice(0, 20), src: reader.result });
    saveState();
    renderPhotos();
    photoTitleInput.value = "";
    photoFileInput.value = "";
  };
  reader.readAsDataURL(file);
}

function renderNotes(listEl, items) {
  listEl.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "note-item";
    li.innerHTML = `
      <p class="note-text">${safeText(item.text)}</p>
      <button type="button" class="btn-danger">删除</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      if (listEl.id === "memo-list") {
        state.memos = state.memos.filter((n) => n.id !== item.id);
      } else {
        state.rambles = state.rambles.filter((n) => n.id !== item.id);
      }
      saveState();
      renderAllNotes();
    });
    listEl.appendChild(li);
  });
}

function renderAllNotes() {
  renderNotes(memoList, state.memos);
  renderNotes(rambleList, state.rambles);
}

function saveMemo() {
  const value = memoInput.value.trim();
  if (!value) return;
  state.memos.unshift({ id: uid(), text: value });
  memoInput.value = "";
  saveState();
  renderAllNotes();
}

function saveRamble() {
  const value = rambleInput.value.trim();
  if (!value) return;
  state.rambles.unshift({ id: uid(), text: value });
  rambleInput.value = "";
  saveState();
  renderAllNotes();
}

moodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    moodButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

chipAddBtn.addEventListener("click", addChip);
chipInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addChip(); });

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = "";
  todoInput.focus();
});

photoAddBtn.addEventListener("click", addPhoto);
memoSaveBtn.addEventListener("click", saveMemo);
rambleSaveBtn.addEventListener("click", saveRamble);

async function bootstrap() {
  await loadState();
  renderChips();
  renderTodos();
  renderPhotos();
  renderAllNotes();
}

bootstrap();
