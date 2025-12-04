const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

window.scheduleData = [];

const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const scheduleBody = document.getElementById('scheduleBody');
const addRowButton = document.getElementById('addRowButton');
const sortButton = document.getElementById('sortButton');

const USN = 'tai';
const PSW = '2026';

function saveScheduleToLocalStorage() {
  try {
    const dataToSave = JSON.stringify(window.scheduleData);
    localStorage.setItem('tainara_schedule_v1', dataToSave);
  } catch (e) {
    console.error("ERRO AO SALVAR:", e);
  }
}

function loadScheduleFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('tainara_schedule_v1');
    return savedData ? JSON.parse(savedData) : [];
  } catch (e) {
    console.error("ERRO AO CARREGAR:", e);
    return [];
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === USN && password === PSW) {
      loginScreen.style.display = 'none';
      appContainer.style.display = 'block';
      initializeSchedule();
    } else {
      errorMessage.classList.remove('hidden');
      setTimeout(() => errorMessage.classList.add('hidden'), 3000);
    }
  });
}

function generateTimeSlots() {
  const slots = [];
  let time = new Date(1970, 0, 1, 7, 0, 0);
  const endTime = new Date(1970, 0, 1, 21, 0, 0);

  while (time.getTime() <= endTime.getTime()) {
    const h = time.getHours().toString().padStart(2, '0');
    const m = time.getMinutes().toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    time.setMinutes(time.getMinutes() + 30);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function updateConflictHighlighting() {
  const timeCounts = {};

  window.scheduleData.forEach(item => {
    if (item.dia && item.horario) {
      const key = `${item.dia}_${item.horario}`;
      timeCounts[key] = (timeCounts[key] || 0) + 1;
    }
  });

  document.querySelectorAll('#scheduleBody tr').forEach(row => {
    const itemId = row.dataset.itemId;
    const item = window.scheduleData.find(d => d.id === itemId);
    const cell = row.querySelector('td[data-column="HORARIO"]');

    if (item && cell) {
      const key = `${item.dia}_${item.horario}`;

      if (timeCounts[key] > 1) {
        cell.classList.add('bg-orange-100', 'border-orange-400');
      } else {
        cell.classList.remove('bg-orange-100', 'border-orange-400');
      }
    }
  });
}



function applyDateColoring() {
  const today = new Date();

  document.querySelectorAll("#scheduleBody tr").forEach(row => {
    const itemId = row.dataset.itemId;
    const item = window.scheduleData.find(d => d.id === itemId);

    if (!item || !item.dia) return;

    const date = new Date(item.dia);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    row.style.backgroundColor = "";

    if (diffDays <= 5 && diffDays >= 0) {
      const colors = {
        5: "#ffb3b3",
        4: "#ffc6c6",
        3: "#ffd9d9",
        2: "#ffeaea",
        1: "#fff5f5",
        0: "#fff2cc"
      };

      row.style.backgroundColor = colors[diffDays];
    }
  });
}





function updateAndPersist(itemId, fieldName, value) {
  const itemIndex = window.scheduleData.findIndex(d => d.id === itemId);
  if (itemIndex > -1) {
    window.scheduleData[itemIndex][fieldName] = value;
    saveScheduleToLocalStorage();
    sortAndRenderSchedule(window.scheduleData);
  }
}

function createInput(type, initialValue, itemId, fieldName) {
  const input = document.createElement('input');
  input.type = type;
  input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150';

  if (type === 'date') {
    input.value = initialValue || new Date().toISOString().substring(0, 10);
  } else {
    input.value = initialValue || '';
  }

  input.addEventListener('change', () => {
    updateAndPersist(itemId, fieldName, input.value);
  });

  return input;
}

function createTimeSelect(initialValue, itemId) {
  const select = document.createElement('select');
  select.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150';
  select.setAttribute('data-column', 'HORARIO');

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'SELECIONE O HORÁRIO';
  select.appendChild(defaultOption);

  TIME_SLOTS.forEach(time => {
    const option = document.createElement('option');
    option.value = time;
    option.textContent = time;
    if (time === initialValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    updateAndPersist(itemId, 'horario', select.value);
  });

  return select;
}

function createRowElement(entry) {
  const tr = document.createElement('tr');
  tr.className = 'hover:bg-gray-50 transition duration-100';
  tr.dataset.itemId = entry.id;

  const tdDia = document.createElement('td');
  tdDia.appendChild(createInput('date', entry.dia, entry.id, 'dia'));
  tdDia.setAttribute('data-column', 'DIA');
  tdDia.setAttribute('data-label', 'Dia');
  tr.appendChild(tdDia);

  const tdHorario = document.createElement('td');
  tdHorario.appendChild(createTimeSelect(entry.horario, entry.id));
  tdHorario.setAttribute('data-column', 'HORARIO');
  tdHorario.setAttribute('data-label', 'Horário');
  tr.appendChild(tdHorario);

  const tdPaciente = document.createElement('td');
  tdPaciente.appendChild(createInput('text', entry.paciente, entry.id, 'paciente'));
  tdPaciente.setAttribute('data-column', 'PACIENTE');
  tdPaciente.setAttribute('data-label', 'Paciente');
  tr.appendChild(tdPaciente);

  const tdProcedimento = document.createElement('td');
  tdProcedimento.appendChild(createInput('text', entry.procedimento, entry.id, 'procedimento'));
  tdProcedimento.setAttribute('data-column', 'PROCEDIMENTO');
  tdProcedimento.setAttribute('data-label', 'Procedimento');
  tr.appendChild(tdProcedimento);

  const tdAcao = document.createElement('td');
  tdAcao.className = 'w-1/12 text-center';
  tdAcao.setAttribute('data-column', 'ACAO');

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'EXCLUIR';
  deleteButton.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition duration-150 uppercase';

  deleteButton.addEventListener('click', () => {
    const itemIndex = window.scheduleData.findIndex(d => d.id === entry.id);
    if (itemIndex > -1) {
      window.scheduleData.splice(itemIndex, 1);
      saveScheduleToLocalStorage();
      sortAndRenderSchedule(window.scheduleData);
    }
  });

  tdAcao.appendChild(deleteButton);
  tr.appendChild(tdAcao);

  return tr;
}

function addRow() {
  const defaultDate = new Date().toISOString().substring(0, 10);
  const newEntry = {
    id: `schedule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dia: defaultDate,
    horario: '',
    paciente: '',
    procedimento: '',
    createdAt: Date.now()
  };

  window.scheduleData.push(newEntry);
  saveScheduleToLocalStorage();
  sortAndRenderSchedule(window.scheduleData);
}

function sortAndRenderSchedule(data) {
  if (!scheduleBody) return;

  const sortedData = [...data].sort((a, b) => {
    const getSortableValue = (value) => (value || 'zzzzzzzzzz').toLowerCase();

    const diaA = getSortableValue(a.dia);
    const diaB = getSortableValue(b.dia);

    if (diaA < diaB) return -1;
    if (diaA > diaB) return 1;

    const horarioA = getSortableValue(a.horario);
    const horarioB = getSortableValue(b.horario);

    if (horarioA < horarioB) return -1;
    if (horarioA > horarioB) return 1;

    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;

    return 0;
  });

  scheduleBody.innerHTML = '';
  sortedData.forEach(entry => {
    scheduleBody.appendChild(createRowElement(entry));
  });

  updateConflictHighlighting();  
  applyDateColoring(); 
}

function initializeSchedule() {
  const data = loadScheduleFromLocalStorage();
  window.scheduleData = data;

  const isFirstLoad = window.scheduleData.length === 0;

  sortAndRenderSchedule(window.scheduleData);

  if (isFirstLoad) {
    addRow();
    addRow();
    addRow();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (addRowButton) {
    addRowButton.addEventListener('click', addRow);
  }
  if (sortButton) {
    sortButton.addEventListener('click', () => sortAndRenderSchedule(window.scheduleData));
  }
});
