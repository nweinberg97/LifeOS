const board = document.getElementById('board');
const tabsContainer = document.getElementById('tabs');

const pastelColors = [
  '#F8BBD0',
  '#C5CAE9',
  '#BBDEFB',
  '#C8E6C9',
  '#FFF9C4',
  '#FFE0B2',
  '#D7CCC8',
  '#E1BEE7'
];

// Pre-load the audio asset immediately at boot to prevent browser autoplay lag
const trashSound = new Audio('sounds/plastic-crunch-83779.mp3');

/* ---------- STATE ---------- */

const state = JSON.parse(localStorage.getItem('boardly-data')) || {
  currentBoard: 'health',

  tabs: [
    'health',
    'admin',
    'chores',
    'learning',
    'personal',
    'relationships',
    'passions'
  ],

  boards: {},
  tabColors: {}
};

/* ---------- SAVE ---------- */

function saveState() {
  localStorage.setItem('boardly-data', JSON.stringify(state));
}

/* ---------- BOARDS ---------- */

function ensureBoardExists(tab) {
  if (!state.boards[tab]) {
    state.boards[tab] = [];
  }
}

/* ---------- COLOR MENU ---------- */

function showColorMenu(event, tab) {
  const existing = document.querySelector('.color-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.className = 'color-menu';

  pastelColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.background = color;

    swatch.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop click from bubbling up to document
      state.tabColors[tab] = color;

      saveState();
      renderTabs();
      cleanupMenu();
    });

    menu.appendChild(swatch);
  });

  document.body.appendChild(menu);

  menu.style.left = `${event.pageX}px`;
  menu.style.top = `${event.pageY}px`;

  const closeOnOutsideClick = (e) => {
    if (!menu.contains(e.target)) {
      cleanupMenu();
    }
  };

  function cleanupMenu() {
    menu.remove();
    document.removeEventListener('click', closeOnOutsideClick);
  }

  // Prevent immediate execution from the initial right-click
  setTimeout(() => {
    document.addEventListener('click', closeOnOutsideClick);
  }, 10);
}

/* ---------- HELPERS ---------- */

function getCurrentBoardData() {
  ensureBoardExists(state.currentBoard);
  return state.boards[state.currentBoard];
}

/* ---------- BOARD ---------- */

function renderBoard() {
  board.innerHTML = '';

  getCurrentBoardData().forEach(card => {
    createCardElement(card);
  });
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

  const onMouseMove = (e) => {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    cardData.x = x;
    cardData.y = y;

    const trashBin = document.querySelector('.trash-bin');
    if (trashBin) {
      element.style.pointerEvents = 'none';
      const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
      element.style.pointerEvents = 'auto'; 

      if (elementUnderMouse && elementUnderMouse.closest('.trash-bin')) {
        trashBin.classList.add('drag-over');
      } else {
        trashBin.classList.remove('drag-over');
      }
    }
  };

  const onMouseUp = (e) => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    element.style.zIndex = 1;
    element.classList.remove('dragging-card');

    const trashBin = document.querySelector('.trash-bin');
    if (trashBin) {
      trashBin.classList.remove('drag-over');

      element.style.pointerEvents = 'none';
      const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
      element.style.pointerEvents = 'auto';

      if (elementUnderMouse && elementUnderMouse.closest('.trash-bin')) {
        state.boards[state.currentBoard] = getCurrentBoardData().filter(c => c.id !== cardData.id);

        trashSound.currentTime = 0;
        trashSound.play().catch(err => console.log("Audio playback prevented:", err));

        saveState();
        renderBoard();
        return; 
      }
    }

    saveState();
  };

  element.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'TEXTAREA') return;

    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;

    element.style.zIndex = 1000;
    element.classList.add('dragging-card');

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

/* ---------- TABS ---------- */

function renderTabs() {
  tabsContainer.innerHTML = '';

  state.tabs.forEach((tab) => {
    const button = document.createElement('button');

    button.classList.add('tab');

    if (tab === state.currentBoard) {
      button.classList.add('active');
    }

    button.textContent = tab;
    button.setAttribute('draggable', 'true');

    // APPLY PICKED TAB COLOR
    button.style.backgroundColor = state.tabColors[tab] || '#ffffff';

    /* SWITCH TAB */
    button.addEventListener('click', () => {
      state.currentBoard = tab;
      saveState();
      renderTabs();
      renderBoard();
    });

    /* RIGHT CLICK → SHOW COLOR MENU */
    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showColorMenu(e, tab);
    });

    /* RENAME TAB */
    button.addEventListener('dblclick', (e) => {
      e.stopPropagation();

      const newName = prompt('Rename tab:', tab);
      if (!newName) return;

      const formatted = newName.toLowerCase().trim();

      if (!formatted || formatted === tab) return;

      if (state.tabs.includes(formatted)) {
        alert('Tab already exists');
        return;
      }

      state.tabs = state.tabs.map(t =>
        t === tab ? formatted : t
      );

      // Deep data migration: Safely copy arrays and clear old key references
      ensureBoardExists(tab);
      state.boards[formatted] = [...state.boards[tab]];
      delete state.boards[tab];

      // Transfer the background color layout configuration cleanly
      if (state.tabColors[tab]) {
        state.tabColors[formatted] = state.tabColors[tab];
        delete state.tabColors[tab];
      }

      if (state.currentBoard === tab) {
        state.currentBoard = formatted;
      }

      saveState();
      renderTabs();
      renderBoard();
    });

    /* DRAG START */
    button.addEventListener('dragstart', (e) => {
      button.classList.add('dragging');
      e.dataTransfer.setData('text/plain', tab);
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });

    /* DROP OVER */
    button.addEventListener('dragover', (e) => {
      e.preventDefault();
      button.classList.add('drag-over');
    });

    button.addEventListener('dragleave', () => {
      button.classList.remove('drag-over');
    });

    /* DROP REORDER */
    button.addEventListener('drop', (e) => {
      e.preventDefault();

      const draggedTab = e.dataTransfer.getData('text/plain');

      if (!state.tabs.includes(draggedTab)) return;
      if (draggedTab === tab) return;

      const fromIndex = state.tabs.indexOf(draggedTab);
      const toIndex = state.tabs.indexOf(tab);

      state.tabs.splice(fromIndex, 1);
      state.tabs.splice(toIndex, 0, draggedTab);

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

  if (state.tabs.includes(formatted)) {
    alert('Tab already exists');
    return;
  }

  state.tabs.push(formatted);
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

/* ---------- TRASH BIN ---------- */

function enableTrashBin() {
  const trashBin = document.querySelector('.trash-bin');
  if (!trashBin) return;

  trashBin.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashBin.classList.add('drag-over');
  });

  trashBin.addEventListener('dragleave', () => {
    trashBin.classList.remove('drag-over');
  });

  trashBin.addEventListener('drop', (e) => {
    e.preventDefault();
    trashBin.classList.remove('drag-over');

    const draggedTab = e.dataTransfer.getData('text/plain');

    if (draggedTab && state.tabs.includes(draggedTab)) {
      state.tabs = state.tabs.filter(t => t !== draggedTab);
      delete state.boards[draggedTab];
      delete state.tabColors[draggedTab];

      if (state.currentBoard === draggedTab) {
        state.currentBoard = state.tabs[0] || '';
      }

      saveState();
      renderTabs();
      renderBoard();
    }
  });
}

/* ---------- INIT ---------- */

function initializeBoardly() {
  renderTabs();
  renderBoard();
  enableTrashBin();
}

initializeBoardly();
