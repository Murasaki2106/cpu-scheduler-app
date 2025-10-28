// We can use 'require' because we set nodeIntegration: true in main.js
const scheduler = require('./scheduler');

// --- Globals ---
let processList = [];
let pidCounter = 1;

// --- DOM Elements ---
const addProcessForm = document.getElementById('add-process-form');
const pidInput = document.getElementById('pid');
const arrivalInput = document.getElementById('arrival-time');
const burstInput = document.getElementById('burst-time');
const priorityInput = document.getElementById('priority');
const processTableBody = document.querySelector('#process-table tbody');

const timeQuantumInput = document.getElementById('time-quantum');
const compareButton = document.getElementById('compare-button');
const resetButton = document.getElementById('reset-button');

const recommendationBox = document.getElementById('recommendation-box');
const bestWaitEl = document.getElementById('best-wait');
const bestTurnaroundEl = document.getElementById('best-turnaround');

// --- Event Listeners ---

addProcessForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addProcess();
});

compareButton.addEventListener('click', runComparison);
resetButton.addEventListener('click', resetAll);

// --- Functions ---

function addProcess() {
  // 1. Get values from form
  const pid = pidInput.value;
  const arrivalTime = parseInt(arrivalInput.value);
  const burstTime = parseInt(burstInput.value);
  const priority = parseInt(priorityInput.value);

  // 2. Basic validation
  if (!pid || isNaN(arrivalTime) || isNaN(burstTime) || isNaN(priority)) {
    alert('Please fill in all fields with valid numbers.');
    return;
  }
  if (processList.some(p => p.pid === pid)) {
    alert(`Process ID "${pid}" already exists. Please use a unique ID.`);
    return;
  }

  // 3. Create process object
  const newProcess = { pid, arrivalTime, burstTime, priority };

  // 4. Add to global list
  processList.push(newProcess);

  // 5. Update the process table UI
  renderProcessTable();

  // 6. Reset form for next entry
  pidCounter++;
  pidInput.value = `P${pidCounter}`;
  arrivalInput.value = '0';
  burstInput.value = '1';
  priorityInput.value = '1';
}

function renderProcessTable() {
  processTableBody.innerHTML = ''; // Clear existing table

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

function runComparison() {
  if (processList.length === 0) {
    alert('Please add at least one process.');
    return;
  }

  // Get the time quantum and validate it
  const timeQuantum = parseInt(timeQuantumInput.value);
  if (isNaN(timeQuantum) || timeQuantum <= 0) {
    alert('Please enter a valid Time Quantum (>= 1) for Round Robin.');
    return;
  }

  // We must pass a *copy* of the process list, so the original isn't changed
  const processListCopy = () => JSON.parse(JSON.stringify(processList));

  // 1. Run all algorithms
  const fcfsResults = scheduler.calculateFCFS(processListCopy());
  const sjfResults = scheduler.calculateSJF(processListCopy());
  const srtfResults = scheduler.calculateSRTF(processListCopy());
  const priorityResults = scheduler.calculatePriority(processListCopy());
  const rrResults = scheduler.calculateRR(processListCopy(), timeQuantum);
  
  
  const allResults = [
      { name: 'FCFS', results: fcfsResults },
      { name: 'SJF', results: sjfResults },
      { name: 'SRTF', results: srtfResults },
      { name: 'Priority', results: priorityResults },
      { name: 'Round Robin', results: rrResults }
  ];

  // 2. Render all results
  renderResults(fcfsResults, 'fcfs-results');
  renderResults(sjfResults, 'sjf-results');
  renderResults(srtfResults, 'srtf-results');
  renderResults(priorityResults, 'priority-results');
  renderResults(rrResults, 'rr-results');

  // 3. Find and display the "best"
  findAndDisplayBest(allResults);
}

function findAndDisplayBest(allResults) {
    // Filter out any null results (from unimplemented algorithms)
    const validResults = allResults.filter(r => r.results);

    if (validResults.length === 0) return;

    // Find best for waiting time
    const bestWait = validResults.reduce((best, current) => {
        return parseFloat(current.results.avgWait) < parseFloat(best.results.avgWait) ? current : best;
    });

    // Find best for turnaround time
    const bestTurnaround = validResults.reduce((best, current) => {
        return parseFloat(current.results.avgTurnaround) < parseFloat(best.results.avgTurnaround) ? current : best;
    });

    // 4. Update recommendation box
    bestWaitEl.textContent = `${bestWait.name} (Avg: ${bestWait.results.avgWait}s)`;
    bestTurnaroundEl.textContent = `${bestTurnaround.name} (Avg: ${bestTurnaround.results.avgTurnaround}s)`;
    recommendationBox.style.display = 'block';
}


function renderResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!results) {
      container.style.display = 'none'; // Hide if algorithm not implemented
      return;
  }

  // Show the results container
  container.style.display = 'block';

  // Find elements *within* this specific container
  const ganttChartDiv = container.querySelector('.gantt-chart');
  const avgWaitTimeP = container.querySelector('.avg-wait-time');
  const avgTurnaroundTimeP = container.querySelector('.avg-turnaround-time');
  const resultsTableBody = container.querySelector('.results-table tbody');


  // --- 1. Render Gantt Chart ---
  ganttChartDiv.innerHTML = '';
  const totalGanttTime = results.ganttChart.length > 0 ? results.ganttChart[results.ganttChart.length - 1].end : 1;

  results.ganttChart.forEach((block) => {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'gantt-block';
    const duration = block.end - block.start;
    const widthPercent = (duration / totalGanttTime) * 100;
    
    // Set a minimum width for visibility, but allow 0 width
    blockDiv.style.width = widthPercent === 0 ? '0' : `${Math.max(widthPercent, 2)}%`; 
    blockDiv.innerText = block.pid;

    if (block.pid === 'IDLE') {
      blockDiv.classList.add('gantt-block-idle');
    } else {
      // Generate a simple hash color based on PID
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

  // --- 2. Render Statistics ---
  avgWaitTimeP.innerText = `Average Waiting Time: ${results.avgWait}`;
  avgTurnaroundTimeP.innerText = `Average Turnaround Time: ${results.avgTurnaround}`;

  // --- 3. Render Results Table ---
  resultsTableBody.innerHTML = '';
  // Sort results by PID for consistent table display
  results.processResults.sort((a,b) => a.pid.localeCompare(b.pid));
  
  results.processResults.forEach((p) => {
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
  
  // Hide all results containers
  recommendationBox.style.display = 'none';
  document.getElementById('fcfs-results').style.display = 'none';
  document.getElementById('sjf-results').style.display = 'none';
  document.getElementById('srtf-results').style.display = 'none';
  document.getElementById('priority-results').style.display = 'none';
  document.getElementById('rr-results').style.display = 'none';

  // Clear the contents of all result areas
  document.querySelectorAll('.gantt-chart').forEach(el => el.innerHTML = '');
  document.querySelectorAll('.avg-wait-time').forEach(el => el.innerText = '');
  document.querySelectorAll('.avg-turnaround-time').forEach(el => el.innerText = '');
  document.querySelectorAll('.results-table tbody').forEach(el => el.innerHTML = '');
}