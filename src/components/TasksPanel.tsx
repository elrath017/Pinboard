import React, { useState } from 'react';
import { DailyTask } from '../types';
import { 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw, 
  X, 
  Edit2
} from 'lucide-react';

interface TasksPanelProps {
  tasks: DailyTask[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, repeatDaily: boolean) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, newTitle: string) => void;
  onSimulateNewDay: () => void;
  streakCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onSimulateNewDay,
  streakCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), true);
    setNewTitle('');
  };

  const handleStartEdit = (task: DailyTask) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      onEditTask(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  // Exact card styling from the user's demo image with dark mode support
  const renderPanelContent = () => (
    <div className="bg-[#fef9c3] dark:bg-[#1c1a14] border-[2.5px] border-black dark:border-amber-400/80 rounded-2xl shadow-[5px_5px_0_#000] p-5 w-full flex flex-col justify-between transition-colors">
      
      {/* Top Header Row: "Today's Tasks" + Date */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-lg sm:text-xl font-black text-black dark:text-amber-200 tracking-tight">
          Today's Tasks
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-amber-100/90">
            {formattedDate}
          </span>
          {/* Quick subtle simulate day button */}
          <button
            onClick={onSimulateNewDay}
            className="p-1 rounded hover:bg-yellow-200 dark:hover:bg-amber-900/50 text-zinc-700 dark:text-amber-300 transition-colors"
            title="Simulate day rollover (reset tasks)"
          >
            <RotateCcw className="w-3 h-3 hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Progress Bar Row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-full h-3.5 p-[1.5px] overflow-hidden shadow-[1px_1px_0_#000]">
          <div
            className="bg-[#8b5cf6] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs sm:text-sm font-black text-black dark:text-amber-200 shrink-0">
          {completedCount}/{totalCount} done
        </span>
      </div>

      {/* Checklist of Tasks */}
      <div className="space-y-2.5 mb-5 max-h-[300px] overflow-y-auto pr-1">
        {tasks.map(task => (
          <div
            key={task.id}
            className="group flex items-center justify-between gap-2.5 py-0.5 select-none"
          >
            {editingId === task.id ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  autoFocus
                  className="flex-1 text-xs font-bold px-2 py-1 border-2 border-black dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white outline-none shadow-[1px_1px_0_#000]"
                />
                <button
                  onClick={() => handleSaveEdit(task.id)}
                  className="p-1 bg-[#8b5cf6] text-white rounded-lg border-2 border-black"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                {/* Purple Checkbox when checked, White/Zinc with black border when unchecked */}
                {task.completed ? (
                  <div className="w-5 h-5 rounded-md bg-[#8b5cf6] border-2 border-black flex items-center justify-center text-white shrink-0 shadow-[1.5px_1.5px_0_#000]">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-md bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-500 shrink-0 shadow-[1.5px_1.5px_0_#000] hover:border-[#8b5cf6] transition-colors" />
                )}

                {/* Struck-through text when checked */}
                <span
                  className={`text-sm font-semibold truncate transition-all ${
                    task.completed
                      ? 'line-through text-zinc-500 dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {task.title}
                </span>
              </button>
            )}

            {/* Hover Actions: Edit & Delete */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
              <button
                onClick={() => handleStartEdit(task)}
                className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-yellow-200 dark:hover:bg-zinc-800"
                title="Edit task"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-yellow-200 dark:hover:bg-zinc-800"
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inline Input & Purple Add Button */}
      <form onSubmit={handleCreate} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Add a task"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="flex-1 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-600 rounded-xl px-3 py-2 text-sm font-semibold text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 shadow-[2px_2px_0_#000] focus:shadow-brutal outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="btn-brutal w-10 h-10 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0"
          title="Add task"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>
      </form>

      {/* Footer Row: "Streak: X days" (left) and "Resets at midnight" (right) */}
      <div className="pt-2 border-t-2 border-black/15 dark:border-amber-400/20 flex items-center justify-between text-xs font-bold text-black dark:text-amber-200">
        <span>Streak: {streakCount} {streakCount === 1 ? 'day' : 'days'}</span>
        <span className="text-zinc-800 dark:text-amber-100/70 font-semibold">Resets at midnight</span>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Tile in Right Corner (width ~300-330px matching demo design) */}
      <div className="hidden lg:block fixed top-20 right-6 z-30 w-80 sm:w-84 transition-all duration-200">
        {renderPanelContent()}
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn p-4"
          onClick={onCloseMobile}
        >
          <div 
            className="w-full max-w-sm h-fit my-auto"
            onClick={e => e.stopPropagation()}
          >
            {renderPanelContent()}
          </div>
        </div>
      )}
    </>
  );
};
