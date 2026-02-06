const form = document.querySelector("#task-form");
const backlogList = document.querySelector("#backlog-list");
const completedList = document.querySelector("#completed-list");
const projectList = document.querySelector("#project-list");
const matrixCells = document.querySelectorAll(".matrix-cell");

const STORAGE_KEY = "todo-backlog-matrix-tasks";
const tasks = [];

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const loadTasks = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      tasks.push(
        ...parsed
          .filter((task) => task && typeof task.title === "string")
          .map((task) => ({
            ...task,
            id: task.id || generateId(),
            status: task.status || "none",
          }))
      );
    }
  } catch (error) {
    console.warn("Failed to load tasks from storage", error);
  }
};

const matrixKey = (importance, urgency) => `${importance}-${urgency}`;

const statusLabel = (status) => {
  if (status === "in-progress") {
    return "В работе";
  }
  if (status === "done") {
    return "Готово";
  }
  return "Без статуса";
};

const renderTask = (task) => {
  const item = document.createElement("li");
  item.className = "task";
  item.dataset.taskId = task.id;
  item.innerHTML = `
    <strong>${task.title}</strong>
    ${task.description ? `<span>${task.description}</span>` : ""}
    <small>Проект: ${task.project || "Без проекта"}</small>
    <small>Статус: ${statusLabel(task.status)}</small>
    <label class="task-status">
      Изменить статус
      <select data-role="status-select">
        <option value="none" ${task.status === "none" ? "selected" : ""}>Без статуса</option>
        <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>В работе</option>
        <option value="done" ${task.status === "done" ? "selected" : ""}>Готово</option>
      </select>
    </label>
    <small>Важность: ${task.importance === "high" ? "Высокая" : "Низкая"}</small>
    <small>Срочность: ${task.urgency === "high" ? "Срочная" : "Несрочная"}</small>
  `;
  return item;
};

const renderBacklog = () => {
  backlogList.innerHTML = "";
  tasks
    .filter((task) => task.status !== "done")
    .forEach((task) => backlogList.appendChild(renderTask(task)));
};

const renderMatrix = () => {
  matrixCells.forEach((cell) => {
    cell.querySelector("ul").innerHTML = "";
  });
  tasks.filter((task) => task.status !== "done").forEach((task) => {
    const cell = document.querySelector(`[data-cell="${matrixKey(task.importance, task.urgency)}"] ul`);
    if (cell) {
      cell.appendChild(renderTask(task));
    }
  });
};

const renderProjects = () => {
  const grouped = tasks.reduce((acc, task) => {
    const key = task.project?.trim() || "Без проекта";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {});

  projectList.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "projects-grid";

  Object.entries(grouped).forEach(([project, projectTasks]) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `<h3>${project}</h3>`;
    const list = document.createElement("ul");
    projectTasks.forEach((task) => list.appendChild(renderTask(task)));
    card.appendChild(list);
    grid.appendChild(card);
  });

  projectList.appendChild(grid);
};

const renderCompleted = () => {
  completedList.innerHTML = "";
  tasks
    .filter((task) => task.status === "done")
    .forEach((task) => completedList.appendChild(renderTask(task)));
};

const renderAll = () => {
  renderBacklog();
  renderMatrix();
  renderProjects();
  renderCompleted();
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const task = {
    id: generateId(),
    title: data.get("title").trim(),
    description: data.get("description").trim(),
    project: data.get("project").trim(),
    importance: data.get("importance"),
    urgency: data.get("urgency"),
    status: data.get("status"),
  };

  if (!task.title) {
    return;
  }

  tasks.push(task);
  form.reset();
  saveTasks();
  renderAll();
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }
  if (target.dataset.role !== "status-select") {
    return;
  }
  const taskItem = target.closest(".task");
  if (!taskItem) {
    return;
  }
  const task = tasks.find((entry) => entry.id === taskItem.dataset.taskId);
  if (!task) {
    return;
  }
  task.status = target.value;
  saveTasks();
  renderAll();
});

loadTasks();
renderAll();
