import React, { useState } from 'react';
import { ImagePin, PinStyle } from '../types';
import { ImageCard } from './ImageCard';
import { Plus, Sparkles, Filter, X } from 'lucide-react';

interface NoticeBoardProps {
  pins: ImagePin[];
  onOpenLightbox: (pin: ImagePin) => void;
  onDeletePin: (id: string) => void;
  onUpdatePin: (id: string, updates: { title?: string; caption?: string; note?: string; pinStyle?: PinStyle }) => void;
  onReorderPins: (reordered: ImagePin[]) => void;
  onOpenUploadModal: () => void;
  onLoadSamples: () => void;
  searchQuery: string;
  selectedTag: string | null;
  onClearTagFilter: () => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  pins,
  onOpenLightbox,
  onDeletePin,
  onUpdatePin,
  onReorderPins,
  onOpenUploadModal,
  onLoadSamples,
  searchQuery,
  selectedTag,
  onClearTagFilter,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Filter pins based on search and selected tag
  const filteredPins = pins.filter(pin => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      pin.title.toLowerCase().includes(q) ||
      (pin.caption && pin.caption.toLowerCase().includes(q)) ||
      (pin.note && pin.note.toLowerCase().includes(q)) ||
      (pin.tags && pin.tags.some(t => t.toLowerCase().includes(q)));

    const matchesTag = !selectedTag || (pin.tags && pin.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  // Drag and drop reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Perform reorder preview
    const updated = [...pins];
    const itemToMove = updated.splice(draggedIndex, 1)[0];
    updated.splice(targetIndex, 0, itemToMove);

    // Update order indices
    const normalized = updated.map((p, idx) => ({ ...p, order: idx }));
    setDraggedIndex(targetIndex);
    onReorderPins(normalized);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Active Filter Indicator (Only shown if a tag or search query is active) */}
      {(selectedTag || searchQuery) && (
        <div className="w-full px-4 sm:px-6 py-2.5 bg-yellow-50/90 border-b-2 border-black flex items-center justify-between text-xs font-bold text-black animate-fadeIn">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-black" />
            <span>
              {selectedTag ? `Filtered by tag: ` : 'Search results: '}
              {selectedTag && <span className="font-mono bg-brutal-yellow px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">#{selectedTag}</span>}
              {searchQuery && <span className="font-mono bg-purple-100 px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0_#000] ml-1">"{searchQuery}"</span>}
            </span>
            <span className="text-zinc-600 font-mono text-[11px]">
              ({filteredPins.length} {filteredPins.length === 1 ? 'pin' : 'pins'} found)
            </span>
          </div>

          <button
            onClick={onClearTagFilter}
            className="flex items-center gap-1 text-xs font-bold text-black hover:text-brutal-purple underline decoration-2"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>Clear filter</span>
          </button>
        </div>
      )}

      {/* Main Notice Board Area - Flex Wrap layout where card width follows aspect ratio */}
      <div className="flex-1 w-full px-4 sm:px-6 py-6 lg:pr-96">
        {filteredPins.length === 0 ? (
          /* Empty State: friendly message with big "Add your first image" button */
          <div className="my-16 max-w-md mx-auto bg-white border-[3px] border-black rounded-2xl p-8 text-center shadow-brutal-lg">
            <div className="w-16 h-16 rounded-xl bg-brutal-yellow border-[2.5px] border-black shadow-brutal flex items-center justify-center text-3xl mx-auto mb-4">
              📌
            </div>
            <h2 className="text-xl font-black text-black tracking-tight mb-2">
              {searchQuery || selectedTag ? 'No matching pins found' : 'Your Pinboard is Empty!'}
            </h2>
            <p className="text-sm font-medium text-zinc-600 mb-6 leading-relaxed">
              {searchQuery || selectedTag
                ? 'Try clearing your search query or tag filter to view all pins.'
                : 'Pin your favorite design screenshots, system diagrams, architecture sketches, and daily notes.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenUploadModal}
                className="btn-brutal w-full sm:w-auto px-5 py-3 rounded-xl bg-brutal-purple text-white font-black text-sm border-2 border-black shadow-brutal flex items-center justify-center gap-2 hover:bg-brutal-purple-hover"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Add Your First Image</span>
              </button>

              {pins.length === 0 && (
                <button
                  onClick={onLoadSamples}
                  className="btn-brutal w-full sm:w-auto px-4 py-3 rounded-xl bg-brutal-yellow text-black font-black text-sm border-2 border-black shadow-brutal flex items-center justify-center gap-2 hover:bg-yellow-300"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Load Sample Pins</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Flex-wrap layout: No fixed number of columns. Width follows image aspect ratio */
          <div className="flex flex-wrap items-start gap-4 sm:gap-4.5">
            {filteredPins.map((pin, index) => (
              <ImageCard
                key={pin.id}
                pin={pin}
                index={index}
                onOpenLightbox={onOpenLightbox}
                onDelete={onDeletePin}
                onUpdatePin={onUpdatePin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
            ))}

            {/* "Drop an image here" dashed card in flex flow */}
            <div
              onClick={onOpenUploadModal}
              style={{ flex: '1 1 200px', maxWidth: '300px', minWidth: '160px' }}
              className="btn-brutal border-[2.5px] border-dashed border-black rounded-xl p-6 bg-white/60 hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-lg bg-brutal-purple text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000] group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-sm font-black text-black">
                Drop an image here
              </span>
              <p className="text-xs font-semibold text-zinc-500">
                or click to upload
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
