import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download, Upload, Search, CheckSquare, Filter, ChevronDown, Check, X, Cloud, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenUploadModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onToggleMobileTasks: () => void;
  pendingTasksCount: number;
  totalPins: number;
  allTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  tagCounts: Record<string, number>;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUploadModal,
  searchQuery,
  onSearchChange,
  onExportBackup,
  onImportBackup,
  onToggleMobileTasks,
  pendingTasksCount,
  totalPins,
  allTags,
  selectedTag,
  onSelectTag,
  tagCounts,
}) => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading, signIn, logOut, openSetupModal, isConfigured } = useAuth();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b-[2.5px] border-black shadow-[0_2px_0_#000]">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Logo/Title + Add Image + Filter Dropdown Button */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div className="flex items-center gap-1.5 cursor-pointer select-none">
            {/* Neo-brutalist logo badge */}
            <div className="w-8 h-8 rounded-lg bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-bold text-sm text-black">
              📌
            </div>
            {/* Header title styled as "Pin" in black + "board" in purple */}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center">
              <span className="text-black">Pin</span>
              <span className="text-brutal-purple ml-0.5">board</span>
            </h1>
          </div>

          {/* "Add Image" primary button next to logo */}
          <button
            onClick={onOpenUploadModal}
            className="btn-brutal px-3 sm:px-4 py-2 rounded-lg bg-brutal-purple text-white font-bold text-xs sm:text-sm border-2 border-black shadow-brutal flex items-center gap-1.5 hover:bg-brutal-purple-hover"
            title="Add new images to pinboard"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="inline">Add Image</span>
          </button>

          {/* Filter Button with Dropdown Menu (Replaces the horizontal filter bar) */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`btn-brutal px-3 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 border-black flex items-center gap-1.5 transition-all ${
                selectedTag
                  ? 'bg-brutal-yellow text-black shadow-brutal'
                  : 'bg-white text-black shadow-brutal hover:bg-zinc-50'
              }`}
              title="Filter pins by tags"
            >
              <Filter className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="max-w-[110px] sm:max-w-[140px] truncate">
                {selectedTag ? `#${selectedTag}` : 'Filter'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu of Tags */}
            {isFilterDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white border-[2.5px] border-black rounded-xl shadow-brutal-lg py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-500 border-b border-black/10 flex items-center justify-between">
                  <span>Tags ({allTags.length})</span>
                  {selectedTag && (
                    <button
                      onClick={() => {
                        onSelectTag(null);
                        setIsFilterDropdownOpen(false);
                      }}
                      className="text-brutal-purple hover:underline lowercase font-bold"
                    >
                      clear filter
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto p-1">
                  {/* Option: All Pins */}
                  <button
                    onClick={() => {
                      onSelectTag(null);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-bold rounded-lg flex items-center justify-between transition-colors ${
                      selectedTag === null ? 'bg-purple-100 text-brutal-purple' : 'hover:bg-zinc-100 text-black'
                    }`}
                  >
                    <span>All Pins</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-semibold text-zinc-500">
                        ({totalPins})
                      </span>
                      {selectedTag === null && <Check className="w-4 h-4 text-brutal-purple stroke-[3]" />}
                    </div>
                  </button>

                  {/* List of Unique Tags */}
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        onSelectTag(tag === selectedTag ? null : tag);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-mono font-bold rounded-lg flex items-center justify-between transition-colors ${
                        selectedTag === tag ? 'bg-amber-100 text-black' : 'hover:bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      <span className="truncate">#{tag}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-sans font-semibold text-zinc-500">
                          ({tagCounts[tag] || 1})
                        </span>
                        {selectedTag === tag && <Check className="w-4 h-4 text-black stroke-[3]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="flex-1 max-w-xs sm:max-w-sm hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              placeholder="Search pins, tags, notes..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-[#faf8ff] border-2 border-black shadow-[2px_2px_0px_#000] focus:shadow-brutal rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm font-medium text-black placeholder-zinc-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: Data Actions & Mobile Tasks Trigger */}
        <div className="flex items-center gap-2">
          {/* Export JSON */}
          <button
            onClick={onExportBackup}
            className="btn-brutal hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs border-2 border-black shadow-brutal hover:bg-zinc-50"
            title="Export all pins and tasks as JSON"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-brutal hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs border-2 border-black shadow-brutal hover:bg-zinc-50"
            title="Import JSON backup"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Google Auth / User Account Section */}
          <div className="relative ml-1" ref={userMenuRef}>
            {authLoading ? (
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border-2 border-black animate-pulse" />
            ) : user ? (
              /* Signed-in User Avatar */
              <div>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="btn-brutal flex items-center gap-1.5 p-1 rounded-lg bg-white border-2 border-black shadow-brutal hover:bg-zinc-50"
                  title={`Signed in as ${user.displayName || user.email}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded border border-black object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-brutal-purple text-white font-black text-xs flex items-center justify-center border border-black">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border-[2.5px] border-black rounded-xl shadow-brutal-lg p-3 z-50 animate-fadeIn space-y-3">
                    <div className="border-b border-black/10 pb-2.5">
                      <p className="font-black text-xs text-black truncate">
                        {user.displayName || 'Google User'}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500 truncate">
                        {user.email}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 border border-black text-[10px] font-bold text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Cloud Synced (Isolated Data)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openSetupModal();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-800 hover:bg-zinc-100 flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Firebase Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logOut();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Google Sign In Button */
              <button
                onClick={signIn}
                className="btn-brutal flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-bold text-xs border-2 border-black shadow-brutal hover:bg-zinc-50"
                title="Sign in with Google to sync your data securely"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign in</span>
              </button>
            )}
          </div>

          {/* Mobile Tasks Square Button (visible on smaller screens) */}
          <button
            onClick={onToggleMobileTasks}
            className="btn-brutal lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brutal-yellow text-black font-bold text-xs border-2 border-black shadow-brutal hover:bg-yellow-300 relative"
            title="Open Daily Tasks"
          >
            <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brutal-purple text-white text-[10px] font-black border border-black flex items-center justify-center -mr-1">
                {pendingTasksCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
