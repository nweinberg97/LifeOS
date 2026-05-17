const board = document.getElementById('board');

const tabs = document.querySelectorAll('.tab');

const state = JSON.parse(localStorage.getItem('lifeos-data')) || {
  currentBoard: 'health',
  boards: {}
};

function saveState() {
  localStorage.setItem('lifeos-data', JSON.stringify(state));
}

function getCurrentBoardData() {
  if (!state.boards[state.currentBoard]) {
    state.boards[state.currentBoard] = [];
  }

  return state.boards[state.currentBoard];
}

function renderBoard() {
  board.innerHTML = '';

  const cards = getCurrentBoardData();

  cards.forEach(card => {
    createCardElement(card);
  });
}

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

    const boardCards = getCurrentBoardData();

    const updated = boardCards.filter(c => c.id !== cardData.id);

    state.boards[state.currentBoard] = updated;

    saveState();
    renderBoard();
  });

  board.appendChild(card);
}

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
    if (isDragging) {
      saveState();
    }

    isDragging = false;
    element.style.zIndex = 1;
  });
}

document.getElementById('add-goal')
  .addEventListener('click', () => createCard('goal'));

document.getElementById('add-task')
  .addEventListener('click', () => createCard('task'));

document.getElementById('add-note')
  .addEventListener('click', () => createCard('note'));

tabs.forEach(tab => {
  tab.addEventListener('click', () => {

    tabs.forEach(t => t.classList.remove('active'));

    tab.classList.add('active');

    state.currentBoard = tab.dataset.board;

    saveState();
    renderBoard();
  });
});

renderBoard();
