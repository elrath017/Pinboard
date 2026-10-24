import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NoticeBoard } from './components/NoticeBoard';
import { TasksPanel } from './components/TasksPanel';
import { UploadModal } from './components/UploadModal';
import { Lightbox } from './components/Lightbox';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import { useAuth } from './context/AuthContext';
import { ImagePin, DailyTask, DailyStats, PinStyle } from './types';
import {
  getStoredPins,
  savePin,
  saveAllPins,
  deletePinFromDB,
  getStoredTasks,
  saveTasks,
  getStoredStats,
  checkAndPerformDailyReset,
  simulateNewDay,
  exportAllData,
  importAllData,
} from './utils/storage';
import {
  subscribeToUserPins,
  saveUserPin,
  deleteUserPin,
  saveAllUserPins,
  subscribeToUserTasks,
  saveUserTasks,
  deleteUserTask,
  subscribeToUserStats,
  saveUserStats,
} from './firebase/firestoreService';
import { SAMPLE_PINS } from './utils/sampleData';
import { Sparkles, Layers, AlertTriangle, X } from 'lucide-react';

export function App() {
  const { user, isSetupModalOpen, closeSetupModal, openSetupModal, error: authError, clearError: clearAuthError } = useAuth();

  const [pins, setPins] = useState<ImagePin[]>(SAMPLE_PINS);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [stats, setStats] = useState<DailyStats>({ lastActiveDate: '', streakCount: 3, history: {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxPin, setLightboxPin] = useState<ImagePin | null>(null);
  const [isOpenMobileTasks, setIsOpenMobileTasks] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Data synchronization based on auth state (Cloud vs Local Guest)
  useEffect(() => {
    if (user) {
      // User is logged in -> Bind to isolated Firestore cloud collections
      setToastMessage(`☁️ Signed in as ${user.displayName || user.email}! Your data is saved to your account.`);
      setTimeout(() => setToastMessage(null), 4000);

      const unsubPins = subscribeToUserPins(user.uid, cloudPins => {
        setPins(cloudPins);
      });

      const unsubTasks = subscribeToUserTasks(user.uid, cloudTasks => {
        // Also check if daily rollover is needed in the cloud
        const resetResult = checkAndPerformDailyReset(cloudTasks);
        setTasks(resetResult.tasks);
        if (resetResult.didRefresh) {
          saveUserTasks(user.uid, resetResult.tasks);
        }
      });

      const unsubStats = subscribeToUserStats(user.uid, cloudStats => {
        setStats(cloudStats);
      });

      return () => {
        unsubPins();
        unsubTasks();
        unsubStats();
      };
    } else {
      // Guest Mode -> Read from browser IndexedDB & localStorage
      getStoredPins().then(loadedPins => {
        if (loadedPins && loadedPins.length > 0) {
          setPins(loadedPins);
        } else {
          saveAllPins(SAMPLE_PINS);
        }
      });

      const loadedTasks = getStoredTasks();
      const loadedStats = getStoredStats();
      setStats(loadedStats);

      const resetResult = checkAndPerformDailyReset(loadedTasks);
      setTasks(resetResult.tasks);
    }
  }, [user]);

  // 2. Midnight timer / 60s check to detect daily rollover
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks(currentTasks => {
        const check = checkAndPerformDailyReset(currentTasks);
        if (check.didRefresh) {
          setToastMessage(`✨ Date rolled over to ${check.newDate}! Daily tasks refreshed.`);
          setTimeout(() => setToastMessage(null), 5000);
          if (user) {
            saveUserTasks(user.uid, check.tasks);
          } else {
            saveTasks(check.tasks);
          }
        }
        return check.tasks;
      });
    }, 60000);

    // Deep linking URL query param support (?modal=upload, ?modal=setup, ?lightbox=sample-card-1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('modal') === 'upload') {
      setIsUploadModalOpen(true);
    }
    if (params.get('modal') === 'setup') {
      openSetupModal();
    }
    const lightboxParam = params.get('lightbox');
    if (lightboxParam) {
      getStoredPins().then(loadedPins => {
        const pool = loadedPins && loadedPins.length > 0 ? loadedPins : SAMPLE_PINS;
        const target = pool.find(p => p.id === lightboxParam) || pool[0];
        if (target) setLightboxPin(target);
      });
    }

    return () => clearInterval(timer);
  }, [user]);

  // Compute all unique tags and tag counts for filter dropdown
  const allTags = Array.from(new Set(pins.flatMap(p => p.tags || []))).filter(Boolean);
  const tagCounts = pins.reduce((acc, p) => {
    (p.tags || []).forEach(t => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Global window drag & drop handler
  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsWindowDragging(true);
    }
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsWindowDragging(false);
    }
  };

  const handleWindowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsWindowDragging(false);
    setIsUploadModalOpen(true);
  };

  // Add multiple pins
  const handleAddPins = async (newPinsData: Array<{
    imageUrl: string;
    title: string;
    caption?: string;
    note?: string;
    tags?: string[];
    pinStyle: PinStyle;
  }>) => {
    const startOrder = pins.length;
    const createdPins: ImagePin[] = newPinsData.map((data, idx) => {
      const randomRot = Math.round((Math.random() * 4 - 2) * 10) / 10;
      return {
        id: `pin-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        pinnedAt: Date.now(),
        rotation: randomRot,
        order: startOrder + idx,
      };
    });

    const updated = [...createdPins, ...pins];
    setPins(updated);

    if (user) {
      for (const p of createdPins) {
        await saveUserPin(user.uid, p);
      }
    } else {
      for (const p of createdPins) {
        await savePin(p);
      }
    }

    setToastMessage(`📌 Added ${createdPins.length} ${createdPins.length === 1 ? 'image' : 'images'} to pinboard!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Delete pin
  const handleDeletePin = async (id: string) => {
    const updated = pins.filter(p => p.id !== id);
    setPins(updated);

    if (user) {
      await deleteUserPin(user.uid, id);
    } else {
      await deletePinFromDB(id);
    }

    if (lightboxPin?.id === id) {
      setLightboxPin(null);
    }
  };

  // Update pin (title, caption, note, pinStyle)
  const handleUpdatePin = async (id: string, updates: { title?: string; caption?: string; note?: string; pinStyle?: PinStyle }) => {
    const updated = pins.map(p => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      return p;
    });
    setPins(updated);
    const target = updated.find(p => p.id === id);
    if (target) {
      if (user) {
        await saveUserPin(user.uid, target);
      } else {
        await savePin(target);
      }
    }
    if (lightboxPin?.id === id && target) {
      setLightboxPin(target);
    }
    setToastMessage('✅ Pin details updated!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Reorder pins
  const handleReorderPins = async (reordered: ImagePin[]) => {
    setPins(reordered);
    if (user) {
      await saveAllUserPins(user.uid, reordered);
    } else {
      await saveAllPins(reordered);
    }
  };

  // Task handlers
  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    setTasks(updated);
    if (user) {
      saveUserTasks(user.uid, updated);
    } else {
      saveTasks(updated);
    }
  };

  const handleAddTask = (title: string, repeatDaily: boolean) => {
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      repeatDaily,
      createdAt: Date.now(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    if (user) {
      saveUserTasks(user.uid, updated);
    } else {
      saveTasks(updated);
    }
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (user) {
      deleteUserTask(user.uid, id);
    } else {
      saveTasks(updated);
    }
  };

  const handleEditTask = (id: string, newTitle: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        return { ...t, title: newTitle };
      }
      return t;
    });
    setTasks(updated);
    if (user) {
      saveUserTasks(user.uid, updated);
    } else {
      saveTasks(updated);
    }
  };

  // Simulate new day
  const handleSimulateNewDay = () => {
    const res = simulateNewDay(tasks);
    setTasks(res.tasks);
    setStats(res.stats);
    if (user) {
      saveUserTasks(user.uid, res.tasks);
      saveUserStats(user.uid, res.stats);
    }
    setToastMessage('✨ Tomorrow simulated! Recurring tasks uncheck and one-time tasks clear.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export / Import
  const handleExportBackup = async () => {
    await exportAllData();
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const restored = await importAllData(text);
      setPins(restored.pins);
      setTasks(restored.tasks);
      setStats(restored.stats);
      if (user) {
        await saveAllUserPins(user.uid, restored.pins);
        await saveUserTasks(user.uid, restored.tasks);
        await saveUserStats(user.uid, restored.stats);
      }
      setToastMessage('✅ Backup imported successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Failed to import backup file. Please select a valid JSON backup.');
    }
  };

  const handleLoadSamples = () => {
    setPins(SAMPLE_PINS);
    if (user) {
      saveAllUserPins(user.uid, SAMPLE_PINS);
    } else {
      saveAllPins(SAMPLE_PINS);
    }
  };

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
      className="min-h-screen bg-pinboard-grid text-zinc-900 flex flex-col relative selection:bg-brutal-purple-light selection:text-brutal-purple"
    >
      {/* Drag Over Screen Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-brutal-purple/80 backdrop-blur-sm border-8 border-dashed border-black flex flex-col items-center justify-center p-6 text-white pointer-events-none animate-pulse">
          <Layers className="w-20 h-20 text-brutal-yellow mb-4 stroke-[2.5]" />
          <h2 className="text-3xl font-black tracking-tight text-white">Drop Images to Pinboard</h2>
          <p className="text-base font-bold text-yellow-200 mt-2">Release to open upload preview</p>
        </div>
      )}

      {/* Top Banner Notification */}
      {toastMessage && (
        <div className="bg-brutal-yellow border-b-2 border-black px-4 py-2 text-center text-xs sm:text-sm font-bold text-black flex items-center justify-center gap-2 shadow-[0_2px_0_#000] z-40">
          <Sparkles className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Error Banner if domain unauthorized or config missing */}
      {authError && (
        <div className="bg-rose-100 border-b-2 border-black px-4 py-2 text-xs font-bold text-rose-950 flex items-center justify-between z-40 shadow-[0_2px_0_#000]">
          <div className="flex items-center gap-2 mx-auto">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
            <span>{authError}</span>
          </div>
          <button onClick={clearAuthError} className="p-1 hover:bg-rose-200 rounded">
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Header with Filter Dropdown Button & Google Sign-In */}
      <Header
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onToggleMobileTasks={() => setIsOpenMobileTasks(!isOpenMobileTasks)}
        pendingTasksCount={pendingCount}
        totalPins={pins.length}
        allTags={allTags}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        tagCounts={tagCounts}
      />

      {/* Main Notice Board Area */}
      <main className="flex-1 flex flex-col">
        <NoticeBoard
          pins={pins}
          onOpenLightbox={pin => setLightboxPin(pin)}
          onDeletePin={handleDeletePin}
          onUpdatePin={handleUpdatePin}
          onReorderPins={handleReorderPins}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onLoadSamples={handleLoadSamples}
          searchQuery={searchQuery}
          selectedTag={selectedTag}
          onClearTagFilter={() => setSelectedTag(null)}
        />
      </main>

      {/* Fixed Tile in Right Corner: Daily Tasks Square */}
      <TasksPanel
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
        onSimulateNewDay={handleSimulateNewDay}
        streakCount={stats.streakCount}
        isOpenMobile={isOpenMobileTasks}
        onCloseMobile={() => setIsOpenMobileTasks(false)}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddPins={handleAddPins}
      />

      {/* Fullscreen Lightbox Modal (Shows Complete Image Full Above Page) */}
      <Lightbox
        pin={lightboxPin}
        onClose={() => setLightboxPin(null)}
        onDelete={handleDeletePin}
        onUpdatePin={handleUpdatePin}
      />

      {/* Firebase Cloud Setup Modal */}
      <FirebaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={closeSetupModal}
      />

      {/* Neo-brutalist Footer */}
      <footer className="w-full border-t-[2.5px] border-black bg-white py-6 px-6 text-center text-xs font-mono font-bold text-zinc-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" />
            <span>Pinboard • Neo-Brutalist Visual Canvas & Daily Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Keep your ideas organized and daily habits on track</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
