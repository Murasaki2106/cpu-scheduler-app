// This file exports the scheduling functions

exports.calculateFCFS = (processes) => {
  const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const results = [];
  const ganttChart = [];
  let currentTime = 0;

  for (const process of sortedProcesses) {
    if (currentTime < process.arrivalTime) {
      ganttChart.push({
        pid: 'IDLE',
        start: currentTime,
        end: process.arrivalTime,
      });
      currentTime = process.arrivalTime;
    }

    const startTime = currentTime;
    const completionTime = startTime + process.burstTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;

    currentTime = completionTime;

    results.push({
      ...process,
      completionTime,
      turnaroundTime,
      waitingTime,
    });

    ganttChart.push({
      pid: process.pid,
      start: startTime,
      end: completionTime,
    });
  }

  return { processResults: results, ganttChart };
};

exports.calculateSJF = (processes) => {
  const n = processes.length;
  let processQueue = [...processes].map((p) => ({ ...p, isCompleted: false }));
  const results = [];
  const ganttChart = [];
  let currentTime = 0;
  let completed = 0;

  while (completed < n) {
    let availableProcesses = processQueue.filter(
      (p) => p.arrivalTime <= currentTime && !p.isCompleted
    );

    if (availableProcesses.length === 0) {
      let nextArrival = Math.min(
        ...processQueue
          .filter((p) => !p.isCompleted)
          .map((p) => p.arrivalTime)
      );
      if (nextArrival === Infinity) break;

      if (currentTime < nextArrival) {
        ganttChart.push({
          pid: 'IDLE',
          start: currentTime,
          end: nextArrival,
        });
        currentTime = nextArrival;
      }
      availableProcesses = processQueue.filter(
        (p) => p.arrivalTime <= currentTime && !p.isCompleted
      );
    }

    availableProcesses.sort((a, b) => a.burstTime - b.burstTime);

    const job = availableProcesses[0];

    const startTime = currentTime;
    const completionTime = startTime + job.burstTime;
    const turnaroundTime = completionTime - job.arrivalTime;
    const waitingTime = turnaroundTime - job.burstTime;

    currentTime = completionTime;

    ganttChart.push({
      pid: job.pid,
      start: startTime,
      end: completionTime,
    });

    job.isCompleted = true;
    results.push({
      ...job,
      completionTime,
      turnaroundTime,
      waitingTime,
    });
    completed++;
  }

  const finalResults = results.sort((a, b) => a.pid.localeCompare(b.pid));
  return { processResults: finalResults, ganttChart };
};

exports.calculatePriority = (processes) => {
  const n = processes.length;
  let processQueue = [...processes].map((p) => ({ ...p, isCompleted: false }));
  const results = [];
  const ganttChart = [];
  let currentTime = 0;
  let completed = 0;

  while (completed < n) {
    let availableProcesses = processQueue.filter(
      (p) => p.arrivalTime <= currentTime && !p.isCompleted
    );

    if (availableProcesses.length === 0) {
      let nextArrival = Math.min(
        ...processQueue
          .filter((p) => !p.isCompleted)
          .map((p) => p.arrivalTime)
      );
      if (nextArrival === Infinity) break;
      if (currentTime < nextArrival) {
        ganttChart.push({
          pid: 'IDLE',
          start: currentTime,
          end: nextArrival,
        });
        currentTime = nextArrival;
      }
      availableProcesses = processQueue.filter(
        (p) => p.arrivalTime <= currentTime && !p.isCompleted
      );
    }

    availableProcesses.sort((a, b) => a.priority - b.priority);

    const job = availableProcesses[0];

    const startTime = currentTime;
    const completionTime = startTime + job.burstTime;
    const turnaroundTime = completionTime - job.arrivalTime;
    const waitingTime = turnaroundTime - job.burstTime;

    currentTime = completionTime;

    ganttChart.push({
      pid: job.pid,
      start: startTime,
      end: completionTime,
    });

    job.isCompleted = true;
    results.push({
      ...job,
      completionTime,
      turnaroundTime,
      waitingTime,
    });
    completed++;
  }

  const finalResults = results.sort((a, b) => a.pid.localeCompare(b.pid));
  return { processResults: finalResults, ganttChart };
};

exports.calculateSRTF = (processes) => {
  alert('SRTF algorithm is not implemented yet.');
  return {
    processResults: processes,
    ganttChart: [
      { pid: 'SRTF (Not Implemented)', start: 0, end: 10 },
    ],
  };
};

exports.calculateRR = (processes, timeQuantum) => {
  alert(
    `Round Robin algorithm (Quantum: ${timeQuantum}) is not implemented yet.`
  );
  return {
    processResults: processes,
    ganttChart: [
      { pid: 'Round Robin (Not Implemented)', start: 0, end: 10 },
    ],
  };
};
