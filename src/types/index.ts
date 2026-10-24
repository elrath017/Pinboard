export type PinStyle = 'tape' | 'pin-yellow' | 'pin-purple' | 'pin-orange' | 'pin-red' | 'pin-green' | 'pin-blue';

export interface ImagePin {
  id: string;
  imageUrl: string;
  title: string;
  caption?: string;
  note?: string;
  tags?: string[];
  pinnedAt: number;
  rotation: number; // -2 to +2 degrees
  pinStyle: PinStyle;
  pinSize?: number; // 14 to 30px
  order: number;
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  repeatDaily: boolean; // true = resets to unchecked everyday; false = "Today only"
  createdAt: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface DailyStats {
  lastActiveDate: string; // YYYY-MM-DD
  streakCount: number;
  history: Record<string, { completed: number; total: number }>;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  pins: ImagePin[];
  tasks: DailyTask[];
  stats: DailyStats;
}
