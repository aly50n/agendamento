import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

window.firebaseApp = null;
window.firebaseAuth = null;
window.firebaseDb = null;
window.currentUserId = null;

async function setupAuth() {
  try {
    const app = initializeApp(firebaseConfig);
    window.firebaseApp = app;
    window.firebaseDb = getFirestore(app);
    window.firebaseAuth = getAuth(app);

    if (initialAuthToken) {
      const userCredential = await signInWithCustomToken(window.firebaseAuth, initialAuthToken);
      window.currentUserId = userCredential.user.uid;
    } else {
      const userCredential = await signInAnonymously(window.firebaseAuth);
      window.currentUserId = userCredential.user.uid;
    }
    console.log('FIREBASE AUTH SETUP CONCLUÍDO. USER ID:', window.currentUserId);
  } catch (error) {
    console.error("FALHA NA AUTENTICAÇÃO FIREBASE:", error);
    window.currentUserId = crypto.randomUUID();
  }
}

// Executa a configuração de autenticação ao carregar o script
setupAuth();


// REFERÊNCIAS DE ELEMENTOS
const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const scheduleBody = document.getElementById('scheduleBody');
const addRowButton = document.getElementById('addRowButton');
const sortButton = document.getElementById('sortButton');


const USERNAME_CORRETO = 'tainara';
const PASSWORD_CORRETA = '2026';

/**
 * LÓGICA DE LOGIN
 */
if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === USERNAME_CORRETO && password === PASSWORD_CORRETA) {
      // SUCESSO NO LOGIN: Esconde a tela de login e mostra o aplicativo
      loginScreen.style.display = 'none';
      appContainer.style.display = 'block';
      // Inicializa as linhas da tabela
      initializeSchedule();
    } else {
      // FALHA NO LOGIN: Mostra a mensagem de erro
      errorMessage.classList.remove('hidden');
      setTimeout(() => errorMessage.classList.add('hidden'), 3000); // Esconde após 3 segundos
    }
  });
}


/**
 * FUNÇÕES DO AGENDAMENTO
 */

/**
 * FUNÇÃO PARA GERAR OS SLOTS DE HORÁRIO DE 30 EM 30 MINUTOS (07:00h ÀS 21:00h)
 */
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

/**
 * ATUALIZA O DESTAQUE DE CONFLITOS DE HORÁRIO (DIA E HORA).
 */
function updateConflictHighlighting() {
  const timeSelectors = document.querySelectorAll('#scheduleBody select[data-column="HORARIO"]');
  const timeCounts = {};

  timeSelectors.forEach(select => {
    const selectedTime = select.value;
    const row = select.closest('tr');
    const dateInput = row.querySelector('input[type="date"]');
    const selectedDate = dateInput ? dateInput.value : 'NODATE';

    if (selectedTime) {
      const key = `${selectedDate}_${selectedTime}`;
      timeCounts[key] = (timeCounts[key] || 0) + 1;
    }
  });

  timeSelectors.forEach(select => {
    const selectedTime = select.value;
    const cell = select.closest('td');
    const row = select.closest('tr');
    const dateInput = row.querySelector('input[type="date"]');
    const selectedDate = dateInput ? dateInput.value : 'NODATE';

    if (selectedTime) {
      const key = `${selectedDate}_${selectedTime}`;
      if (timeCounts[key] > 1) {
        cell.classList.add('bg-orange-100');
        cell.classList.add('border-orange-400');
      } else {
        cell.classList.remove('bg-orange-100');
        cell.classList.remove('border-orange-400');
      }
    } else {
      cell.classList.remove('bg-orange-100');
      cell.classList.remove('border-orange-400');
    }
  });
}

function createTimeSelect() {
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
    select.appendChild(option);
  });

  select.addEventListener('change', updateConflictHighlighting);

  return select;
}

function createInput(type = 'text') {
  const input = document.createElement('input');
  input.type = type;
  input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150';

  if (type === 'date') {
    input.valueAsDate = new Date();
    input.addEventListener('change', updateConflictHighlighting);
  }
  return input;
}

function addRow() {
  if (!scheduleBody) return;

  const tr = document.createElement('tr');
  tr.className = 'hover:bg-gray-50 transition duration-100';


  const tdDia = document.createElement('td');
  tdDia.appendChild(createInput('date'));
  tdDia.setAttribute('data-column', 'DIA');
  tr.appendChild(tdDia);


  const tdHorario = document.createElement('td');
  tdHorario.appendChild(createTimeSelect());
  tdHorario.setAttribute('data-column', 'HORARIO');
  tr.appendChild(tdHorario);


  const tdPaciente = document.createElement('td');
  tdPaciente.appendChild(createInput('text'));
  tdPaciente.setAttribute('data-column', 'PACIENTE');
  tr.appendChild(tdPaciente);


  const tdProcedimento = document.createElement('td');
  tdProcedimento.appendChild(createInput('text'));
  tdProcedimento.setAttribute('data-column', 'PROCEDIMENTO');
  tr.appendChild(tdProcedimento);


  const tdAcao = document.createElement('td');
  tdAcao.className = 'w-1/12 text-center';
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'EXCLUIR';
  deleteButton.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition duration-150 uppercase';
  deleteButton.addEventListener('click', () => {
    tr.remove();
    updateConflictHighlighting();
  });
  tdAcao.appendChild(deleteButton);
  tr.appendChild(tdAcao);

  scheduleBody.appendChild(tr);
}

function sortSchedule() {
  if (!scheduleBody) return;

  const rows = Array.from(scheduleBody.querySelectorAll('tr'));

  rows.sort((a, b) => {
    const dateInputA = a.querySelector('td[data-column="DIA"] input[type="date"]');
    const dateA = dateInputA ? dateInputA.value : null;
    const timeA = a.querySelector('td[data-column="HORARIO"] select').value;

    const dateInputB = b.querySelector('td[data-column="DIA"] input[type="date"]');
    const dateB = dateInputB ? dateInputB.value : null;
    const timeB = b.querySelector('td[data-column="HORARIO"] select').value;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;

    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;

    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;

    return 0;
  });

  scheduleBody.innerHTML = '';
  rows.forEach(row => scheduleBody.appendChild(row));

  updateConflictHighlighting();
}

/**
 * FUNÇÃO PARA INICIALIZAR O AGENDAMENTO APÓS O LOGIN
 */
function initializeSchedule() {
  addRow();
  addRow();
  addRow();
}

document.addEventListener('DOMContentLoaded', () => {
  if (addRowButton) {
    addRowButton.addEventListener('click', addRow);
  }
  if (sortButton) {
    sortButton.addEventListener('click', sortSchedule);
  }
});
