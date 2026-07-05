/* =========================================================
   TASK MANAGER — script.js
   Pure vanilla JS. No frameworks, no libraries.

   Sections in this file:
   1. State + persistence (localStorage bonus)
   2. Element references
   3. Rendering (DocumentFragment bonus)
   4. Task creation (createElement / createTextNode / append)
   5. Event delegation for task actions (edit / complete / delete)
   6. Search + category filter + counters + clear all (bonus)
   7. Attributes vs properties demo
   8. Theme toggle
   9. Event propagation demo (bubbling + capturing)
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. STATE + PERSISTENCE
     --------------------------------------------------------- */

  const STORAGE_KEY = "dom-explorer-tasks";

  /**
   * Each task looks like:
   * { id: "t3", title: "Write README", category: "work", status: "pending" }
   */
  let tasks = loadTasks();
  let nextId = tasks.reduce((max, t) => Math.max(max, idNumber(t.id)), 0) + 1;

  function idNumber(id) {
    return Number(String(id).replace("t", "")) || 0;
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      // Corrupt or blocked storage shouldn't crash the app.
      console.warn("Could not read saved tasks:", err);
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  /* ---------------------------------------------------------
     2. ELEMENT REFERENCES
     --------------------------------------------------------- */

  const taskForm = document.getElementById("task-form");
  const titleInput = document.getElementById("task-title");
  const categorySelect = document.getElementById("task-category");
  const formError = document.getElementById("form-error");

  const taskListEl = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");

  const searchInput = document.getElementById("task-search");
  const categoryFilter = document.getElementById("category-filter");
  const pendingCountEl = document.getElementById("pending-count");
  const completedCountEl = document.getElementById("completed-count");
  const clearAllBtn = document.getElementById("clear-all");

  /* ---------------------------------------------------------
     3. RENDERING
     --------------------------------------------------------- */

  function currentFilters() {
    return {
      term: searchInput.value.trim().toLowerCase(),
      category: categoryFilter.value,
    };
  }

  function visibleTasks() {
    const { term, category } = currentFilters();
    return tasks.filter((t) => {
      const matchesTerm = t.title.toLowerCase().includes(term);
      const matchesCategory = category === "all" || t.category === category;
      return matchesTerm && matchesCategory;
    });
  }

  function renderList() {
    const list = visibleTasks();

    // Bonus: build every card off-screen in a DocumentFragment, then
    // touch the live DOM exactly once. Cheaper than N separate inserts.
    const fragment = document.createDocumentFragment();
    list.forEach((task) => fragment.append(createTaskCard(task)));

    taskListEl.replaceChildren(); // clear old cards
    taskListEl.append(fragment); // DOM method demo: append()

    emptyState.hidden = list.length !== 0;
    updateCounters();
  }

  function updateCounters() {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    pendingCountEl.textContent = String(pending);
    completedCountEl.textContent = String(completed);
  }

  /* ---------------------------------------------------------
     4. TASK CREATION
     --------------------------------------------------------- */

  function createTaskCard(task) {
    // Every element below is built by hand with createElement /
    // createTextNode, per the assignment brief (no innerHTML for content).

    const li = document.createElement("li");
    li.className = "task-card";

    // Custom data attributes, set explicitly with setAttribute so the
    // intent is visible rather than relying only on the dataset shorthand.
    li.setAttribute("data-id", task.id);
    li.setAttribute("data-status", task.status);
    li.setAttribute("data-category", task.category);

    const main = document.createElement("div");
    main.className = "task-main";

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "task-check";
    checkBtn.setAttribute("aria-label", "Mark task complete");

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.append(document.createTextNode(task.title)); // DOM method demo: append() + createTextNode()

    const tag = document.createElement("span");
    tag.className = "task-category-tag";
    tag.append(document.createTextNode(task.category));

    main.append(checkBtn, titleSpan, tag); // DOM method demo: append() with multiple nodes

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-icon task-edit";
    editBtn.append(document.createTextNode("Edit"));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-icon task-delete";
    deleteBtn.append(document.createTextNode("Delete"));

    actions.append(editBtn, deleteBtn);

    li.append(main, actions); // DOM method demo: append()

    return li;
  }

  taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      formError.hidden = false;
      titleInput.focus();
      return;
    }
    formError.hidden = true;

    const task = {
      id: "t" + nextId++,
      title: title,
      category: categorySelect.value,
      status: "pending",
    };
    tasks.unshift(task); // newest task first
    saveTasks();

    // Insert the new card at the top instantly, without a full re-render,
    // so it visibly appears the moment the form is submitted.
    if (visibleTasks()[0] === task) {
      const card = createTaskCard(task);
      taskListEl.prepend(card); // DOM method demo: prepend()
      emptyState.hidden = true;
      updateCounters();
    } else {
      // The new task doesn't match the active filter — re-render so
      // counts stay correct even though the card itself stays hidden.
      renderList();
    }

    taskForm.reset();
    titleInput.focus();
  });

  /* ---------------------------------------------------------
     5. EVENT DELEGATION FOR TASK ACTIONS
     One listener on the list container handles complete / edit / delete
     for every card, including ones added after the page loaded.
     --------------------------------------------------------- */

  taskListEl.addEventListener("click", function (event) {
    const card = event.target.closest(".task-card");
    if (!card) return;

    const taskId = card.dataset.id; // dataset reads data-id

    if (event.target.closest(".task-check")) {
      toggleComplete(card, taskId);
    } else if (event.target.closest(".task-delete")) {
      deleteTask(card, taskId);
    } else if (event.target.closest(".task-edit")) {
      enterEditMode(card, taskId);
    } else if (event.target.closest(".task-save")) {
      saveEdit(card, taskId);
    } else if (event.target.closest(".task-cancel")) {
      exitEditMode(card);
    }
  });

  function toggleComplete(card, taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isCompleted = card.hasAttribute("data-status") && card.getAttribute("data-status") === "completed";
    const nextStatus = isCompleted ? "pending" : "completed";

    task.status = nextStatus;
    card.setAttribute("data-status", nextStatus); // DOM method demo: setAttribute()
    card.dataset.status = nextStatus; // kept in sync; dataset mirrors the attribute

    saveTasks();
    updateCounters();
  }

  function deleteTask(card, taskId) {
    tasks = tasks.filter((t) => t.id !== taskId);
    saveTasks();
    card.remove(); // DOM method demo: remove()
    updateCounters();
    emptyState.hidden = taskListEl.children.length !== 0;
  }

  function enterEditMode(card, taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    card.classList.add("editing"); // classList demo
    card.setAttribute("data-editing", "true");

    const titleSpan = card.querySelector(".task-title");
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "task-edit-input";
    editInput.value = task.title;

    titleSpan.replaceWith(editInput); // DOM method demo: replaceWith()
    editInput.focus();
    editInput.select();

    const editBtn = card.querySelector(".task-edit");
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-icon task-save";
    saveBtn.append(document.createTextNode("Save"));

    editBtn.replaceWith(saveBtn); // DOM method demo: replaceWith()

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-icon task-cancel";
    cancelBtn.append(document.createTextNode("Cancel"));

    saveBtn.after(cancelBtn); // DOM method demo: after()
  }

  function saveEdit(card, taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const editInput = card.querySelector(".task-edit-input");
    const newTitle = editInput.value.trim() || task.title;
    task.title = newTitle;
    saveTasks();

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.append(document.createTextNode(newTitle));

    editInput.before(titleSpan); // DOM method demo: before()
    editInput.remove(); // DOM method demo: remove()

    exitEditMode(card, titleSpan);
  }

  function exitEditMode(card) {
    card.classList.remove("editing");
    card.removeAttribute("data-editing"); // DOM method demo: removeAttribute()

    const saveBtn = card.querySelector(".task-save");
    const cancelBtn = card.querySelector(".task-cancel");
    const editInput = card.querySelector(".task-edit-input");

    // If the user cancelled instead of saving, put the original title back.
    if (editInput) {
      const task = tasks.find((t) => t.id === card.dataset.id);
      const titleSpan = document.createElement("span");
      titleSpan.className = "task-title";
      titleSpan.append(document.createTextNode(task.title));
      editInput.replaceWith(titleSpan);
    }

    if (saveBtn) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-icon task-edit";
      editBtn.append(document.createTextNode("Edit"));
      saveBtn.replaceWith(editBtn);
    }
    if (cancelBtn) cancelBtn.remove();
  }

  /* ---------------------------------------------------------
     6. SEARCH, FILTER, COUNTERS, CLEAR ALL
     --------------------------------------------------------- */

  searchInput.addEventListener("input", renderList);
  categoryFilter.addEventListener("change", renderList);

  clearAllBtn.addEventListener("click", function () {
    if (tasks.length === 0) return;
    const confirmed = window.confirm("Delete every task? This can't be undone.");
    if (!confirmed) return;
    tasks = [];
    saveTasks();
    renderList();
  });

  /* ---------------------------------------------------------
     7. ATTRIBUTES VS PROPERTIES DEMO
     --------------------------------------------------------- */

  const demoInput = document.getElementById("demo-input");
  const demoCheckBtn = document.getElementById("demo-check");
  const demoPropertyOut = document.getElementById("demo-property");
  const demoAttributeOut = document.getElementById("demo-attribute");

  demoCheckBtn.addEventListener("click", function () {
    // input.value is a PROPERTY: it always reflects what's in the box
    // right now, live, even if the user just typed it.
    const liveValue = demoInput.value;

    // input.getAttribute("value") reads the ATTRIBUTE as written in the
    // markup (or last set via setAttribute). Typing in the box does NOT
    // change this — attributes and properties fall out of sync on purpose.
    const attrValue = demoInput.getAttribute("value");

    demoPropertyOut.textContent = JSON.stringify(liveValue);
    demoAttributeOut.textContent = JSON.stringify(attrValue);
  });

  /* ---------------------------------------------------------
     8. THEME TOGGLE
     --------------------------------------------------------- */

  const themeToggleBtn = document.getElementById("theme-toggle");
  const toggleLabel = themeToggleBtn.querySelector(".toggle-label");
  const THEME_KEY = "dom-explorer-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme); // setAttribute demo
    themeToggleBtn.dataset.themeState = theme; // dataset demo
    themeToggleBtn.setAttribute("aria-pressed", String(theme === "dark"));
    themeToggleBtn.classList.toggle("is-dark", theme === "dark"); // classList demo
    toggleLabel.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  }

  themeToggleBtn.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  // Restore saved theme on load.
  applyTheme(localStorage.getItem(THEME_KEY) || "light");

  /* ---------------------------------------------------------
     9. EVENT PROPAGATION DEMO (bubbling + capturing)

     A single click on the button triggers the browser's real event
     flow in two passes:
       - capturing phase: window -> ... -> Grandparent -> Parent -> Child
       - bubbling phase:  Child -> Parent -> Grandparent -> ... -> window
     We attach a capturing listener AND a bubbling listener to each of
     the three boxes to make both passes visible at once.
     --------------------------------------------------------- */

  const grandparent = document.getElementById("grandparent");
  const parent = document.getElementById("parent");
  const child = document.getElementById("child");
  const propagationBtn = document.getElementById("propagation-btn");
  const propagationLog = document.getElementById("propagation-log");
  const propagationClearBtn = document.getElementById("propagation-clear");

  function logPropagation(phase, label) {
    const line = `[${phase}] ${label}`;
    console.log(line);
    const li = document.createElement("li");
    li.append(document.createTextNode(line));
    propagationLog.append(li);
  }

  function clearPropagationLog() {
    propagationLog.replaceChildren();
    console.clear();
  }

  // Capture phase always runs top-down, starting at the outermost
  // ancestor. Registering this listener on #grandparent, before any
  // other capture listener below, guarantees it's the very first thing
  // that runs on every click inside the box — so the log resets before
  // the new sequence starts printing, instead of after.
  grandparent.addEventListener("click", clearPropagationLog, { capture: true });

  // Bubbling listeners: capture option defaults to false.
  grandparent.addEventListener("click", () => logPropagation("bubble", "Grandparent"));
  parent.addEventListener("click", () => logPropagation("bubble", "Parent"));
  child.addEventListener("click", () => logPropagation("bubble", "Child"));

  // Capturing listeners: capture: true runs them on the way DOWN,
  // before the click ever reaches the target.
  grandparent.addEventListener("click", () => logPropagation("capture", "Grandparent"), { capture: true });
  parent.addEventListener("click", () => logPropagation("capture", "Parent"), { capture: true });
  child.addEventListener("click", () => logPropagation("capture", "Child"), { capture: true });

  propagationBtn.addEventListener("click", () => {
    console.log("— click fired —");
    logPropagation("target", "Button");
  });

  propagationClearBtn.addEventListener("click", clearPropagationLog);

  /* ---------------------------------------------------------
     INITIAL RENDER
     --------------------------------------------------------- */

  renderList();
})();