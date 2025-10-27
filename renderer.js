const scheduler = require('./scheduler');

let processList = [];
let pidCounter = 1;

const addProcessForm = document.getElementById('add-process-form');
const pidInput = document.getElementById('pid');
const arrivalInput = document.getElementById('arrival-time');
const burstInput = document.getElementById('burst-time');
const priorityInput = document.getElementById('priority');
const processTableBody = document.querySelector('#process-table tbody');

const algorithmSelect = document.getElementById('algorithm-select');
const quantumGroup = document.getElementById('quantum-group');
const quantumInput = document.getElementById('time-quantum');
const runButton = document.getElementById('run-button');
const resetButton = document.getElementById('reset-button');

const resultsContainer = document.getElementById('results-container');
const ganttChartDiv = document.getElementById('gantt-chart');
const avgWaitTimeP = document.getElementById('avg-wait-time');
const avgTurnaroundTimeP = document.getElementById('avg-turnaround-time');
const resultsTableBody = document.querySelector('#results-table tbody');

pidInput.value = `P${pidCounter}`;

addProcessForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addProcess();
});

algorithmSelect.addEventListener('change', () => {
  if (algorithmSelect.value === 'rr') {
    quantumGroup.style.display = 'block';
  } else {
    quantumGroup.style.display = 'none';
  }
});

runButton.addEventListener('click', runSimulation);
resetButton.addEventListener('click', resetAll);

function addProcess() {
  const pid = pidInput.value;
  const arrivalTime = parseInt(arrivalInput.value);
  const burstTime = parseInt(burstInput.value);
  const priority = parseInt(priorityInput.value);

  if (!pid || isNaN(arrivalTime) || isNaN(burstTime) || isNaN(priority)) {
    alert('Please fill in all fields with valid numbers.');
    return;
  }

  const newProcess = { pid, arrivalTime, burstTime, priority };
  processList.push(newProcess);
  renderProcessTable();

  pidCounter++;
  pidInput.value = `P${pidCounter}`;
  arrivalInput.value = '0';
  burstInput.value = '1';
  priorityInput.value = '1';
}

function renderProcessTable() {
  processTableBody.innerHTML = '';
  processList.forEach((process) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${process.pid}</td>
      <td>${process.arrivalTime}</td>
      <td>${process.burstTime}</td>
      <td>${process.priority}</td>
    `;
    processTableBody.appendChild(row);
  });
}

function runSimulation() {
  if (processList.length === 0) {
    alert('Please add at least one process.');
    return;
  }

  const algorithm = algorithmSelect.value;
  let results;
  const processListCopy = JSON.parse(JSON.stringify(processList));

  switch (algorithm) {
    case 'fcfs':
      results = scheduler.calculateFCFS(processListCopy);
      break;
    case 'sjf':
      results = scheduler.calculateSJF(processListCopy);
      break;
    case 'priority':
      results = scheduler.calculatePriority(processListCopy);
      break;
    case 'srtf':
      results = scheduler.calculateSRTF(processListCopy);
      break;
    case 'rr':
      const timeQuantum = parseInt(quantumInput.value);
      if (isNaN(timeQuantum) || timeQuantum <= 0) {
        alert('Please enter a valid Time Quantum for Round Robin.');
        return;
      }
      results = scheduler.calculateRR(processListCopy, timeQuantum);
      break;
  }

  if (results) {
    renderResults(results);
  }
}

function renderResults({ processResults, ganttChart }) {
  resultsContainer.style.display = 'block';
  ganttChartDiv.innerHTML = '';
  const totalGanttTime = ganttChart[ganttChart.length - 1].end;

  ganttChart.forEach((block) => {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'gantt-block';
    const duration = block.end - block.start;
    const widthPercent = (duration / totalGanttTime) * 100;
    blockDiv.style.width = `${widthPercent}%`;
    blockDiv.innerText = block.pid;

    if (block.pid === 'IDLE') {
      blockDiv.classList.add('gantt-block-idle');
    } else {
      let hash = 0;
      for (let i = 0; i < block.pid.length; i++) {
        hash = block.pid.charCodeAt(i) + ((hash << 5) - hash);
      }
      let color = '#';
      for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xff;
        color += ('00' + value.toString(16)).substr(-2);
      }
      blockDiv.style.backgroundColor = color;
    }

    ganttChartDiv.appendChild(blockDiv);
  });

  let totalWait = 0;
  let totalTurnaround = 0;
  processResults.forEach((p) => {
    totalWait += p.waitingTime || 0;
    totalTurnaround += p.turnaroundTime || 0;
  });

  const avgWait = (totalWait / processResults.length).toFixed(2);
  const avgTurnaround = (totalTurnaround / processResults.length).toFixed(2);

  avgWaitTimeP.innerText = `Average Waiting Time: ${avgWait}`;
  avgTurnaroundTimeP.innerText = `Average Turnaround Time: ${avgTurnaround}`;

  resultsTableBody.innerHTML = '';
  processResults.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.pid}</td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td>${p.priority}</td>
      <td>${p.completionTime || 'N/A'}</td>
      <td>${p.turnaroundTime || 'N/A'}</td>
      <td>${p.waitingTime || 'N/A'}</td>
    `;
    resultsTableBody.appendChild(row);
  });
}

function resetAll() {
  processList = [];
  pidCounter = 1;
  pidInput.value = `P${pidCounter}`;
  processTableBody.innerHTML = '';
  resultsContainer.style.display = 'none';
  ganttChartDiv.innerHTML = '';
  avgWaitTimeP.innerText = '';
  avgTurnaroundTimeP.innerText = '';
  resultsTableBody.innerHTML = '';
  algorithmSelect.value = 'fcfs';
  quantumGroup.style.display = 'none';
}
