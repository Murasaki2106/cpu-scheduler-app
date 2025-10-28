// This file exports the scheduling functions

function getAverages(processResults) {
    if (processResults.length === 0) {
      return { avgWait: 0, avgTurnaround: 0 };
    }
    let totalWait = 0;
    let totalTurnaround = 0;
    processResults.forEach((p) => {
      totalWait += p.waitingTime || 0;
      totalTurnaround += p.turnaroundTime || 0;
    });
  
    return {
      avgWait: (totalWait / processResults.length).toFixed(2),
      avgTurnaround: (totalTurnaround / processResults.length).toFixed(2),
    };
  }
  
  // --- 1. First Come, First Serve (FCFS) ---
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
  
    const averages = getAverages(results);
    return { processResults: results, ganttChart, ...averages };
  };
  
  // --- 2. Shortest Job First (SJF) (Non-Preemptive) ---
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
      const originalProcess = processes.find(p => p.pid === job.pid);
      results.push({
        ...originalProcess,
        ...job,
        completionTime,
        turnaroundTime,
        waitingTime,
      });
      completed++;
    }
  
    const finalResults = results.sort((a, b) => a.pid.localeCompare(b.pid));
    const averages = getAverages(finalResults);
    return { processResults: finalResults, ganttChart, ...averages };
  };
  
  // --- 3. Shortest Remaining Time First (SRTF) (Preemptive) ---
  exports.calculateSRTF = (processes) => {
    const n = processes.length;
    let processQueue = [...processes].map((p) => ({
      ...p,
      remainingTime: p.burstTime,
      isCompleted: false,
    }));
    const results = [];
    const ganttChart = [];
    let currentTime = 0;
    let completed = 0;
    let lastJobPid = null;
  
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
        continue; // Re-check for available processes
      }
  
      // Sort by *remaining* time
      availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
      const job = availableProcesses[0];
  
      // --- Gantt Chart Logic ---
      // If the job changed, or the last block wasn't this job
      if (ganttChart.length === 0 || lastJobPid !== job.pid) {
        ganttChart.push({ pid: job.pid, start: currentTime, end: currentTime + 1 });
        lastJobPid = job.pid;
      } else {
        // Extend the last block
        ganttChart[ganttChart.length - 1].end = currentTime + 1;
      }
      
      // --- Process Logic ---
      job.remainingTime--;
      currentTime++; // Increment time by 1 unit
  
      if (job.remainingTime === 0) {
        job.isCompleted = true;
        completed++;
        const completionTime = currentTime;
        const turnaroundTime = completionTime - job.arrivalTime;
        const waitingTime = turnaroundTime - job.burstTime;
        
        const originalProcess = processes.find(p => p.pid === job.pid);
        results.push({
          ...originalProcess,
          completionTime,
          turnaroundTime,
          waitingTime,
        });
      }
    }
  
    // Clean up Gantt chart (merge consecutive blocks)
    const mergedGantt = [];
    if (ganttChart.length > 0) {
        mergedGantt.push({ ...ganttChart[0] });
        for (let i = 1; i < ganttChart.length; i++) {
            if (ganttChart[i].pid === mergedGantt[mergedGantt.length - 1].pid) {
                mergedGantt[mergedGantt.length - 1].end = ganttChart[i].end;
            } else {
                mergedGantt.push({ ...ganttChart[i] });
            }
        }
    }
  
    const finalResults = results.sort((a, b) => a.pid.localeCompare(b.pid));
    const averages = getAverages(finalResults);
    return { processResults: finalResults, ganttChart: mergedGantt, ...averages };
  };
  
  // --- 4. Priority (Non-Preemptive) ---
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
  
      // Sort by PRIORITY
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
      const originalProcess = processes.find(p => p.pid === job.pid);
      results.push({
        ...originalProcess,
        ...job,
        completionTime,
        turnaroundTime,
        waitingTime,
      });
      completed++;
    }
  
    const finalResults = results.sort((a, b) => a.pid.localeCompare(b.pid));
    const averages = getAverages(finalResults);
    return { processResults: finalResults, ganttChart, ...averages };
  };
  
  
  // --- 5. Round Robin (RR) ---
  exports.calculateRR = (processes, timeQuantum) => {
    const n = processes.length;
    let processQueue = [...processes].map((p, i) => ({
      ...p,
      remainingTime: p.burstTime,
      originalIndex: i, // To handle arrival tie-breaks
    }));
    const results = new Array(n);
    const readyQueue = [];
    const ganttChart = [];
    let currentTime = 0;
    let completed = 0;
    let processIndex = 0;
    
    // Sort processes by arrival time to know when to add them
    processQueue.sort((a,b) => a.arrivalTime - b.arrivalTime);
  
    while (completed < n) {
      // Add newly arrived processes to the ready queue
      while (processIndex < n && processQueue[processIndex].arrivalTime <= currentTime) {
        readyQueue.push(processQueue[processIndex]);
        processIndex++;
      }
  
      if (readyQueue.length === 0) {
        // If no process is ready, check for idle time
        if (processIndex < n) {
          ganttChart.push({
            pid: 'IDLE',
            start: currentTime,
            end: processQueue[processIndex].arrivalTime,
          });
          currentTime = processQueue[processIndex].arrivalTime;
        }
        continue; // Loop again to add the newly arrived process
      }
  
      const job = readyQueue.shift(); // Get the next process from the front
      const startTime = currentTime;
  
      if (job.remainingTime <= timeQuantum) {
        // Process finishes
        const runDuration = job.remainingTime;
        job.remainingTime = 0;
        currentTime += runDuration;
        
        const completionTime = currentTime;
        const turnaroundTime = completionTime - job.arrivalTime;
        const waitingTime = turnaroundTime - job.burstTime;
  
        // Use originalIndex to place results correctly
        results[job.originalIndex] = {
          ...job,
          completionTime,
          turnaroundTime,
          waitingTime,
        };
        completed++;
  
        ganttChart.push({ pid: job.pid, start: startTime, end: currentTime });
        
      } else {
        // Process runs for a full quantum
        const runDuration = timeQuantum;
        job.remainingTime -= runDuration;
        currentTime += runDuration;
        
        ganttChart.push({ pid: job.pid, start: startTime, end: currentTime });
      }
  
      // Add any processes that arrived *while* this one was running
      while (processIndex < n && processQueue[processIndex].arrivalTime <= currentTime) {
        readyQueue.push(processQueue[processIndex]);
        processIndex++;
      }
  
      // Add the current job back to the end of the queue if it's not finished
      if (job.remainingTime > 0) {
        readyQueue.push(job);
      }
    }
  
    // Clean up Gantt chart (merge consecutive blocks)
    const mergedGantt = [];
    if (ganttChart.length > 0) {
        mergedGantt.push({ ...ganttChart[0] });
        for (let i = 1; i < ganttChart.length; i++) {
            if (ganttChart[i].pid === mergedGantt[mergedGantt.length - 1].pid) {
                mergedGantt[mergedGantt.length - 1].end = ganttChart[i].end;
            } else {
                mergedGantt.push({ ...ganttChart[i] });
            }
        }
    }
  
    const finalResults = results.filter(Boolean); // Remove any empty spots
    const averages = getAverages(finalResults);
    return { processResults: finalResults, ganttChart: mergedGantt, ...averages };
  };