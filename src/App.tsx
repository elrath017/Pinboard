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
  saveStats,
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
import { SAMPLE_PINS, INITIAL_DEMO_TASKS } from './utils/sampleData';
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

      const unsubPins = subscribeToUserPins(
        user.uid,
        async cloudPins => {
          if (cloudPins && cloudPins.length > 0) {
            setPins(cloudPins);
            // Cache latest cloud pins into local IndexedDB so offline/fallback is always up to date
            saveAllPins(cloudPins).catch(console.warn);
          } else {
            // New user cloud collection has no pins yet:
            // Check if user has pins in local storage to preserve/migrate!
            const localPins = await getStoredPins();
            const pinsToSeed = localPins && localPins.length > 0 ? localPins : SAMPLE_PINS;
            setPins(pinsToSeed);
            saveAllUserPins(user.uid, pinsToSeed).catch(err => {
              console.warn('Initial pin seeding to Firestore failed:', err);
            });
          }
        },
        err => {
          console.error('Error listening to user pins:', err);
          setToastMessage(`⚠️ Cloud sync error: ${err.message || 'Permission denied'}. Showing local pins.`);
          setTimeout(() => setToastMessage(null), 5000);
          getStoredPins().then(loaded => {
            if (loaded && loaded.length > 0) setPins(loaded);
            else setPins(SAMPLE_PINS);
          });
        }
      );

      const unsubTasks = subscribeToUserTasks(
        user.uid,
        async cloudTasks => {
          if (cloudTasks && cloudTasks.length > 0) {
            const resetResult = checkAndPerformDailyReset(cloudTasks);
            setTasks(resetResult.tasks);
            if (resetResult.didRefresh) {
              saveUserTasks(user.uid, resetResult.tasks);
            }
          } else {
            const localTasks = getStoredTasks();
            const tasksToSeed = localTasks.length > 0 ? localTasks : INITIAL_DEMO_TASKS;
            const resetResult = checkAndPerformDailyReset(tasksToSeed);
            setTasks(resetResult.tasks);
            saveUserTasks(user.uid, resetResult.tasks).catch(console.warn);
          }
        },
        err => {
          console.error('Error listening to user tasks:', err);
          const localTasks = getStoredTasks();
          const resetResult = checkAndPerformDailyReset(localTasks.length > 0 ? localTasks : INITIAL_DEMO_TASKS);
          setTasks(resetResult.tasks);
        }
      );

      const unsubStats = subscribeToUserStats(
        user.uid,
        cloudStats => {
          if (cloudStats && (cloudStats.streakCount > 0 || cloudStats.lastActiveDate)) {
            setStats(cloudStats);
          } else {
            const localStats = getStoredStats();
            setStats(localStats);
            saveUserStats(user.uid, localStats).catch(console.warn);
          }
        },
        err => {
          console.error('Error listening to user stats:', err);
          setStats(getStoredStats());
        }
      );

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

  // Global window drag & drop handler (strictly for external image file drops from desktop/explorer)
  const handleWindowDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types ? Array.from(e.dataTransfer.types) : [];
    const isFileDrag = types.includes('Files') && !types.includes('application/x-pinboard-pin');

    if (isFileDrag) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isWindowDragging) {
        setIsWindowDragging(true);
      }
    } else {
      if (isWindowDragging) {
        setIsWindowDragging(false);
      }
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

    // Only open the upload modal if real external files were dropped, NEVER for internal pin reorders
    const files = e.dataTransfer.files;
    const hasFiles = files && files.length > 0;
    const isPinReorder = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('application/x-pinboard-pin');

    if (hasFiles && !isPinReorder) {
      setIsUploadModalOpen(true);
    }
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

    // 1. Mirror immediately to local IndexedDB for all users
    for (const p of createdPins) {
      await savePin(p).catch(console.warn);
    }

    // 2. Persist to Firestore if signed in
    if (user) {
      try {
        for (const p of createdPins) {
          await saveUserPin(user.uid, p);
        }
        setToastMessage(`📌 Added ${createdPins.length} ${createdPins.length === 1 ? 'image' : 'images'} & saved to cloud!`);
      } catch (err: any) {
        console.error('Failed to sync pin to Firestore:', err);
        setToastMessage(`⚠️ Pin saved locally, but cloud sync failed: ${err.message || 'Permission or storage limit'}`);
      }
    } else {
      setToastMessage(`📌 Added ${createdPins.length} ${createdPins.length === 1 ? 'image' : 'images'} to pinboard!`);
    }

    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete pin
  const handleDeletePin = async (id: string) => {
    const updated = pins.filter(p => p.id !== id);
    setPins(updated);

    // Always delete locally from IndexedDB
    await deletePinFromDB(id).catch(console.warn);

    // If logged in, delete from Firestore
    if (user) {
      try {
        await deleteUserPin(user.uid, id);
      } catch (err) {
        console.error('Failed to delete pin from Firestore:', err);
      }
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
      // Update locally
      await savePin(target).catch(console.warn);

      // Update in Firestore if logged in
      if (user) {
        try {
          await saveUserPin(user.uid, target);
        } catch (err: any) {
          console.error('Failed to update pin in Firestore:', err);
          setToastMessage(`⚠️ Update saved locally; cloud sync failed: ${err.message}`);
        }
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
    await saveAllPins(reordered).catch(console.warn);
    if (user) {
      try {
        await saveAllUserPins(user.uid, reordered);
      } catch (err) {
        console.error('Failed to save reordered pins to Firestore:', err);
      }
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
    saveTasks(updated); // Mirror locally
    if (user) {
      saveUserTasks(user.uid, updated).catch(err => {
        console.error('Failed to sync task status to Firestore:', err);
      });
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
    saveTasks(updated); // Mirror locally
    if (user) {
      saveUserTasks(user.uid, updated).catch(err => {
        console.error('Failed to sync new task to Firestore:', err);
        setToastMessage(`⚠️ Task saved locally; cloud sync failed: ${err.message}`);
      });
    }
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(updated); // Mirror locally
    if (user) {
      deleteUserTask(user.uid, id).catch(err => {
        console.error('Failed to delete task from Firestore:', err);
      });
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
    saveTasks(updated); // Mirror locally
    if (user) {
      saveUserTasks(user.uid, updated).catch(err => {
        console.error('Failed to update task in Firestore:', err);
      });
    }
  };

  // Simulate new day
  const handleSimulateNewDay = () => {
    const res = simulateNewDay(tasks);
    setTasks(res.tasks);
    setStats(res.stats);
    saveTasks(res.tasks);
    saveStats(res.stats);
    if (user) {
      saveUserTasks(user.uid, res.tasks).catch(console.warn);
      saveUserStats(user.uid, res.stats).catch(console.warn);
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
      className="min-h-screen bg-pinboard-grid text-zinc-900 dark:text-zinc-100 flex flex-col relative selection:bg-brutal-purple-light selection:text-brutal-purple transition-colors"
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
        <div className="bg-rose-100 dark:bg-rose-950/80 border-b-2 border-black dark:border-rose-900 px-4 py-2 text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center justify-between z-40 shadow-[0_2px_0_#000]">
          <div className="flex items-center gap-2 mx-auto">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.5]" />
            <span>{authError}</span>
          </div>
          <button onClick={clearAuthError} className="p-1 hover:bg-rose-200 dark:hover:bg-rose-900 rounded">
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
        onClose={() => {
          closeSetupModal();
          try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('modal')) {
              url.searchParams.delete('modal');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
            }
          } catch (e) {}
        }}
      />

      {/* Neo-brutalist Footer */}
      <footer className="w-full border-t-[2.5px] border-black dark:border-zinc-800 bg-white dark:bg-[#121217] py-6 px-6 text-center text-xs font-mono font-bold text-zinc-700 dark:text-zinc-400 transition-colors">
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
