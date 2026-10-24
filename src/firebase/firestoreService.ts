import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';
import { ImagePin, DailyTask, DailyStats } from '../types';
import { SAMPLE_PINS } from '../utils/sampleData';

/**
 * Multi-tenant User Data Isolation Service
 * All documents are scoped under `users/{userId}/...`
 */

/**
 * Helper to remove any undefined fields before sending to Firestore
 * (Firestore throws an exception if any field value is undefined)
 */
function cleanDocData<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      clean[key] = value;
    }
  });
  return clean;
}

// 1. Subscribe to a user's pins in real-time
export function subscribeToUserPins(
  userId: string,
  onUpdate: (pins: ImagePin[]) => void,
  onError?: (err: Error) => void
) {
  if (!db) return () => {};

  const pinsRef = collection(db, 'users', userId, 'pins');
  const q = query(pinsRef, orderBy('order', 'asc'));

  return onSnapshot(
    q,
    snapshot => {
      const pins: ImagePin[] = [];
      snapshot.forEach(docSnap => {
        pins.push(docSnap.data() as ImagePin);
      });
      onUpdate(pins);
    },
    err => {
      console.error('Error listening to user pins:', err);
      if (onError) onError(err);
    }
  );
}

// 2. Save / update a single pin
export async function saveUserPin(userId: string, pin: ImagePin): Promise<void> {
  if (!db) return;
  const pinDoc = doc(db, 'users', userId, 'pins', pin.id);
  await setDoc(pinDoc, cleanDocData(pin), { merge: true });
}

// 3. Delete a pin
export async function deleteUserPin(userId: string, pinId: string): Promise<void> {
  if (!db) return;
  const pinDoc = doc(db, 'users', userId, 'pins', pinId);
  await deleteDoc(pinDoc);
}

// 4. Save/reorder all pins
export async function saveAllUserPins(userId: string, pins: ImagePin[]): Promise<void> {
  if (!db) return;
  const firestore = db;
  const batch = writeBatch(firestore);
  pins.forEach(pin => {
    const pinDoc = doc(firestore, 'users', userId, 'pins', pin.id);
    batch.set(pinDoc, cleanDocData(pin), { merge: true });
  });
  await batch.commit();
}

// 5. Subscribe to a user's daily tasks in real-time
export function subscribeToUserTasks(
  userId: string,
  onUpdate: (tasks: DailyTask[]) => void,
  onError?: (err: Error) => void
) {
  if (!db) return () => {};

  const tasksRef = collection(db, 'users', userId, 'tasks');
  const q = query(tasksRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    snapshot => {
      const tasks: DailyTask[] = [];
      snapshot.forEach(docSnap => {
        tasks.push(docSnap.data() as DailyTask);
      });
      onUpdate(tasks);
    },
    err => {
      console.error('Error listening to user tasks:', err);
      if (onError) onError(err);
    }
  );
}

// 6. Save all user tasks
export async function saveUserTasks(userId: string, tasks: DailyTask[]): Promise<void> {
  if (!db) return;
  const firestore = db;
  const batch = writeBatch(firestore);

  // Clear existing or set all
  tasks.forEach(task => {
    const taskDoc = doc(firestore, 'users', userId, 'tasks', task.id);
    batch.set(taskDoc, cleanDocData(task), { merge: true });
  });

  await batch.commit();
}

// 7. Delete a specific task
export async function deleteUserTask(userId: string, taskId: string): Promise<void> {
  if (!db) return;
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskDoc);
}

// 8. Subscribe to user's daily statistics (streak count, last active date)
export function subscribeToUserStats(
  userId: string,
  onUpdate: (stats: DailyStats) => void,
  onError?: (err: Error) => void
) {
  if (!db) return () => {};

  const statsDoc = doc(db, 'users', userId, 'stats', 'daily');
  return onSnapshot(
    statsDoc,
    docSnap => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as DailyStats);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const defaultStats: DailyStats = {
          lastActiveDate: todayStr,
          streakCount: 0,
          history: {},
        };
        onUpdate(defaultStats);
      }
    },
    err => {
      console.error('Error listening to user stats:', err);
      if (onError) onError(err);
    }
  );
}

// 9. Save user statistics
export async function saveUserStats(userId: string, stats: DailyStats): Promise<void> {
  if (!db) return;
  const statsDoc = doc(db, 'users', userId, 'stats', 'daily');
  await setDoc(statsDoc, cleanDocData(stats), { merge: true });
}

// 10. Check if user data exists; if brand new user, seed initial pins & tasks
export async function checkAndSeedUserData(userId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const pinsRef = collection(db, 'users', userId, 'pins');
    const pinsSnap = await getDocs(pinsRef);

    if (pinsSnap.empty) {
      // Seed initial sample pins for this new user
      await saveAllUserPins(userId, SAMPLE_PINS);

      // Seed initial sample tasks
      const initialTasks: DailyTask[] = [
        { id: 'task-1', title: 'Morning workout', completed: true, repeatDaily: true, createdAt: Date.now() - 3600000 * 3 },
        { id: 'task-2', title: 'Apply to 3 jobs', completed: true, repeatDaily: true, createdAt: Date.now() - 3600000 * 2 },
        { id: 'task-3', title: 'Read for 30 minutes', completed: true, repeatDaily: true, createdAt: Date.now() - 3600000 },
        { id: 'task-4', title: 'Work on portfolio', completed: false, repeatDaily: true, createdAt: Date.now() - 1800000 },
        { id: 'task-5', title: 'Practice SQL', completed: false, repeatDaily: true, createdAt: Date.now() - 900000 },
      ];
      await saveUserTasks(userId, initialTasks);

      // Seed initial stats (valid YYYY-MM-DD format for firestore.rules)
      const todayStr = new Date().toISOString().split('T')[0];
      await saveUserStats(userId, {
        lastActiveDate: todayStr,
        streakCount: 4,
        history: {},
      });

      return true; // was newly seeded
    }
  } catch (err) {
    console.warn('Failed to seed user data in Firestore:', err);
  }

  return false;
}
