const board = document.getElementById('board');
const tabsContainer = document.getElementById('tabs');

/* ---------- STATE ---------- */

const state = JSON.parse(localStorage.getItem('boardly-data')) || {
  currentBoard: 'health',

  tabs: [
    { name: 'health', color: 1 },
    { name: 'admin', color: 2 },
    { name: 'chores', color: 3 },
    { name: 'learning', color: 4 },
    { name: 'personal', color: 5 },
    { name: 'relationships', color: 6 },
    { name: 'passions', color: 7 }
  ],

  boards: {}
};

/* ---------- SAVE ---------- */

function saveState() {
  localStorage.setItem('boardly-data', JSON.stringify(state));
}

/* ---------- BOARDS ---------- */

function ensureBoardExists(tabName) {
  if (!state.boards[tabName]) {
    state.boards[tabName] = [];
  }
}

function getCurrentBoardData() {
  ensureBoardExists(state.currentBoard);
  return state.boards[state.currentBoard];
}

/* ---------- BOARD ---------- */

function renderBoard() {
  board.innerHTML = '';
  getCurrentBoardData().forEach(createCardElement);
}

/* ---------- CARDS ---------- */

function createCard(type) {

  const card = {
    id: Date.now(),
    type,
    x: 100,
    y: 100,
    text: ''
  };

  getCurrentBoardData().push(card);

  saveState();
  renderBoard();
}

function createCardElement(cardData) {

  const card = document.createElement('div');

  card.classList.add('card', cardData.type);

  card.style.left = `${cardData.x}px`;
  card.style.top = `${cardData.y}px`;

  const textarea = document.createElement('textarea');

  textarea.value = cardData.text;

  textarea.addEventListener('input', () => {
    cardData.text = textarea.value;
    saveState();
  });

  card.appendChild(textarea);

  enableDragging(card, cardData);

  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    state.boards[state.currentBoard] =
      getCurrentBoardData().filter(c => c.id !== cardData.id);

    saveState();
    renderBoard();
  });

  board.appendChild(card);
}

/* ---------- DRAG CARDS ---------- */

function enableDragging(element, cardData) {

  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  element.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'TEXTAREA') return;

    isDragging = true;

    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;

    element.style.zIndex = 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    cardData.x = x;
    cardData.y = y;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) saveState();
    isDragging = false;
    element.style.zIndex = 1;
  });
}

/* ---------- TABS ---------- */

function renderTabs() {

  tabsContainer.innerHTML = '';

  state.tabs.forEach((tabObj) => {

    const name = tabObj.name;

    const button = document.createElement('button');

    button.classList.add('tab', `color-${tabObj.color}`);

    if (name === state.currentBoard) {
      button.classList.add('active');
    }

    button.textContent = name;
    button.setAttribute('draggable', 'true');

    /* SWITCH TAB */
    button.addEventListener('click', () => {
      state.currentBoard = name;
      saveState();
      renderTabs();
      renderBoard();
    });

    /* RENAME TAB */
    button.addEventListener('dblclick', (e) => {
      e.stopPropagation();

      const newName = prompt('Rename tab:', name);
      if (!newName) return;

      const formatted = newName.toLowerCase().trim();
      if (!formatted || formatted === name) return;

      if (state.tabs.find(t => t.name === formatted)) {
        alert('Tab already exists');
        return;
      }

      state.tabs = state.tabs.map(t =>
        t.name === name ? { ...t, name: formatted } : t
      );

      state.boards[formatted] = state.boards[name] || [];
      delete state.boards[name];

      if (state.currentBoard === name) {
        state.currentBoard = formatted;
      }

      saveState();
      renderTabs();
      renderBoard();
    });

    /* DRAG */
    button.addEventListener('dragstart', (e) => {
      button.classList.add('dragging');
      e.dataTransfer.setData('text/plain', name);
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });

    /* DROP REORDER */
    button.addEventListener('drop', (e) => {

      e.preventDefault();

      const dragged = e.dataTransfer.getData('text/plain');

      if (dragged === name) return;

      const from = state.tabs.findIndex(t => t.name === dragged);
      const to = state.tabs.findIndex(t => t.name === name);

      const temp = state.tabs[from];
      state.tabs.splice(from, 1);
      state.tabs.splice(to, 0, temp);

      saveState();
      renderTabs();
    });

    tabsContainer.appendChild(button);
  });
}

/* ---------- ADD TAB ---------- */

document.getElementById('add-tab')
.addEventListener('click', () => {

  if (state.tabs.length >= 10) {
    alert('Maximum 10 tabs allowed');
    return;
  }

  const tabName = prompt('Enter tab name');
  if (!tabName) return;

  const formatted = tabName.toLowerCase().trim();

  if (state.tabs.find(t => t.name === formatted)) {
    alert('Tab already exists');
    return;
  }

  state.tabs.push({
    name: formatted,
    color: Math.floor(Math.random() * 10) + 1
  });

  state.boards[formatted] = [];

  saveState();
  renderTabs();
});

/* ---------- BUTTONS ---------- */

document.getElementById('add-goal')
.addEventListener('click', () => createCard('goal'));

document.getElementById('add-task')
.addEventListener('click', () => createCard('task'));

document.getElementById('add-note')
.addEventListener('click', () => createCard('note'));

/* ---------- INIT ---------- */

function initializeBoardly() {
  renderTabs();
  renderBoard();
}

initializeBoardly();
