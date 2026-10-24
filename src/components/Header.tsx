import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download, Upload, Search, CheckSquare, Filter, ChevronDown, Check, X } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
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
