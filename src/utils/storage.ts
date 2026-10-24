import { ImagePin, DailyTask, DailyStats, BackupData } from '../types';

const DB_NAME = 'NeoBrutalistNoticeBoardDB';
const DB_VERSION = 2;
const STORE_NAME = 'pins';
const TASKS_KEY = 'pinboard_neo_tasks';
const STATS_KEY = 'pinboard_neo_stats';
const DATE_KEY = 'pinboard_neo_last_date';

// ---------------- IndexedDB for Image Pins ----------------
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getStoredPins = async (): Promise<ImagePin[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const pins: ImagePin[] = req.result || [];
        // sort by order, then by pinnedAt descending
        pins.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        resolve(pins);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage for pins', err);
    const raw = localStorage.getItem('neo_pinboard_pins_fallback');
    return raw ? JSON.parse(raw) : [];
  }
};

export const savePin = async (pin: ImagePin): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(pin);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const pins = await getStoredPins();
    const updated = [pin, ...pins.filter(p => p.id !== pin.id)];
    localStorage.setItem('neo_pinboard_pins_fallback', JSON.stringify(updated));
  }
};

export const saveAllPins = async (pins: ImagePin[]): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      pins.forEach(pin => store.put(pin));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    localStorage.setItem('neo_pinboard_pins_fallback', JSON.stringify(pins));
  }
};

export const deletePinFromDB = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const pins = await getStoredPins();
    const filtered = pins.filter(p => p.id !== id);
    localStorage.setItem('neo_pinboard_pins_fallback', JSON.stringify(filtered));
  }
};

// ---------------- Date & Daily Refresh Logic ----------------

export const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getStoredDate = (): string => {
  return localStorage.getItem(DATE_KEY) || getTodayKey();
};

export const setStoredDate = (dateStr: string): void => {
  localStorage.setItem(DATE_KEY, dateStr);
};

export const getStoredTasks = (): DailyTask[] => {
  const raw = localStorage.getItem(TASKS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Exact starter tasks from the demo image
  return [
    {
      id: 'task-1',
      title: 'Morning workout',
      completed: true,
      repeatDaily: true,
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'task-2',
      title: 'Apply to 3 jobs',
      completed: true,
      repeatDaily: true,
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: 'task-3',
      title: 'Read for 30 minutes',
      completed: true,
      repeatDaily: true,
      createdAt: Date.now() - 3600000 * 3,
    },
    {
      id: 'task-4',
      title: 'Work on portfolio',
      completed: false,
      repeatDaily: true,
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'task-5',
      title: 'Practice SQL',
      completed: false,
      repeatDaily: true,
      createdAt: Date.now() - 3600000,
    }
  ];
};

export const saveTasks = (tasks: DailyTask[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getStoredStats = (): DailyStats => {
  const raw = localStorage.getItem(STATS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    lastActiveDate: getTodayKey(),
    streakCount: 4, // initial streak matching demo design (Streak: 4 days)
    history: {},
  };
};

export const saveStats = (stats: DailyStats): void => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

/**
 * Checks if a new day has arrived.
 * If yes:
 *  - "Repeat daily" tasks reset completed to false.
 *  - "Today only" tasks are removed.
 *  - Streak updates: increments if yesterday all tasks were completed.
 */
export const checkAndPerformDailyReset = (
  currentTasks: DailyTask[]
): { tasks: DailyTask[]; didRefresh: boolean; newDate: string } => {
  const today = getTodayKey();
  const lastDate = getStoredDate();
  const stats = getStoredStats();

  if (lastDate !== today) {
    // Record yesterday's progress
    const total = currentTasks.length;
    const completed = currentTasks.filter(t => t.completed).length;
    stats.history[lastDate] = { completed, total };

    // Update streak: if all were done yesterday, increase streak; else reset to 1
    if (total > 0 && completed === total) {
      stats.streakCount += 1;
    } else if (completed === 0 && stats.streakCount > 1) {
      stats.streakCount = 1;
    }

    stats.lastActiveDate = today;
    saveStats(stats);
    setStoredDate(today);

    // Refresh tasks: keep only recurring ones and uncheck them!
    const refreshed = currentTasks
      .filter(t => t.repeatDaily) // remove "Today only" tasks
      .map(t => ({
        ...t,
        completed: false, // reset all checkmarks
      }));

    saveTasks(refreshed);
    return {
      tasks: refreshed,
      didRefresh: true,
      newDate: today,
    };
  }

  return {
    tasks: currentTasks,
    didRefresh: false,
    newDate: today,
  };
};

/**
 * Test utility: simulate a new day by setting stored date to yesterday and triggering reset
 */
export const simulateNewDay = (currentTasks: DailyTask[]): { tasks: DailyTask[]; stats: DailyStats } => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  // Set last active date to yesterday
  setStoredDate(yestStr);
  const stats = getStoredStats();
  stats.lastActiveDate = yestStr;
  saveStats(stats);

  const res = checkAndPerformDailyReset(currentTasks);
  const newStats = getStoredStats();
  return { tasks: res.tasks, stats: newStats };
};

// ---------------- JSON Export & Import ----------------

export const exportAllData = async (): Promise<void> => {
  const pins = await getStoredPins();
  const tasks = getStoredTasks();
  const stats = getStoredStats();

  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    pins,
    tasks,
    stats,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noticeboard-backup-${getTodayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importAllData = async (jsonString: string): Promise<{ pins: ImagePin[]; tasks: DailyTask[]; stats: DailyStats }> => {
  const data: BackupData = JSON.parse(jsonString);
  if (!data.pins || !data.tasks) {
    throw new Error('Invalid backup file format');
  }

  await saveAllPins(data.pins);
  saveTasks(data.tasks);
  if (data.stats) saveStats(data.stats);

  return {
    pins: data.pins,
    tasks: data.tasks,
    stats: data.stats || getStoredStats(),
  };
};
