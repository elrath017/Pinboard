import React, { useState } from 'react';
import { ImagePin } from '../types';
import { Trash2, Edit3, GripVertical, Check, X, Calendar, Tag, Maximize2 } from 'lucide-react';

interface ImageCardProps {
  pin: ImagePin;
  index: number;
  onOpenLightbox: (pin: ImagePin) => void;
  onDelete: (id: string) => void;
  onUpdatePin: (id: string, updates: { title?: string; caption?: string; note?: string }) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  pin,
  index,
  onOpenLightbox,
  onDelete,
  onUpdatePin,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(pin.title);
  const [editedCaption, setEditedCaption] = useState(pin.caption || '');

  // Pin size: random between 14px and 30px (or stored pinSize)
  const pinSize = pin.pinSize || (16 + ((index * 7) % 15)); // stable pseudo-random 16-30px

  // Alternate between tape strip and colorful pins
  const isTape = pin.pinStyle === 'tape' || index % 3 === 2;

  // Pin color palette
  const pinColors = ['#fb923c', '#8b5cf6', '#fde047', '#f87171', '#4ade80', '#38bdf8'];
  const pinBg = pinColors[index % pinColors.length];

  const handleSaveEdit = (e: React.FormEvent) => {
    e.stopPropagation();
    if (!editedTitle.trim()) return;
    onUpdatePin(pin.id, {
      title: editedTitle.trim(),
      caption: editedCaption.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(pin.title);
    setEditedCaption(pin.caption || '');
    setIsEditing(false);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(pin.pinnedAt));

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, index)}
      onDragOver={e => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      style={{ transform: `rotate(${pin.rotation || 0}deg)` }}
      className="group relative bg-white border-[2.5px] border-black rounded-xl shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-all duration-150 flex flex-col cursor-pointer select-none mb-6 break-inside-avoid w-full p-3 pt-4"
      onClick={() => onOpenLightbox(pin)}
    >
      {/* Top Attachment: Either Tape Strip OR Random Size Pin (14-30px) */}
      {isTape ? (
        <div 
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#fde047] border-2 border-black shadow-[2px_2px_0_#000] z-20"
          style={{ transform: 'translateX(-50%) rotate(-1deg)' }}
        />
      ) : (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full border-[2.5px] border-black shadow-[2px_2px_0_#000] z-20 flex items-center justify-center"
          style={{
            width: `${pinSize}px`,
            height: `${pinSize}px`,
            top: `-${Math.round(pinSize / 2)}px`,
            backgroundColor: pinBg,
          }}
        >
          {/* 3D Highlight Dot */}
          <div 
            className="rounded-full bg-white absolute" 
            style={{ 
              width: `${Math.max(3, Math.round(pinSize * 0.22))}px`, 
              height: `${Math.max(3, Math.round(pinSize * 0.22))}px`, 
              top: '20%', 
              left: '20%' 
            }} 
          />
        </div>
      )}

      {/* Floating Hover Controls Bar (Edit, Maximize, Delete) */}
      <div 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 z-30 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded bg-white/95 border border-black hover:bg-yellow-100 text-black text-xs shadow-[1px_1px_0_#000]"
          title="Edit pin name"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onOpenLightbox(pin)}
          className="p-1 rounded bg-white/95 border border-black hover:bg-zinc-100 text-black text-xs shadow-[1px_1px_0_#000]"
          title="View full size image"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {isConfirmingDelete ? (
          <div className="flex items-center gap-0.5 bg-rose-100 border border-black p-0.5 rounded shadow-[1px_1px_0_#000]">
            <button
              onClick={() => onDelete(pin.id)}
              className="p-0.5 bg-rose-500 text-white rounded"
              title="Confirm delete"
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </button>
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="p-0.5 bg-zinc-200 text-black rounded"
              title="Cancel"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className="p-1 rounded bg-white/95 border border-black hover:bg-rose-100 text-rose-600 text-xs shadow-[1px_1px_0_#000]"
            title="Delete pin"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Image Container: Shows Natural Aspect Ratio without fixed height or cropping */}
      <div className="border-2 border-black rounded-lg overflow-hidden bg-white mb-2.5">
        <img
          src={pin.imageUrl}
          alt={pin.title}
          loading="lazy"
          className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>

      {/* Card Info Section: Bold Title + Added Date */}
      <div className="flex flex-col space-y-1">
        {isEditing ? (
          <form 
            onSubmit={handleSaveEdit} 
            onClick={e => e.stopPropagation()} 
            className="space-y-1.5 bg-purple-50 p-2 rounded-lg border-2 border-black"
          >
            <input
              type="text"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              placeholder="Pin name..."
              autoFocus
              className="w-full text-xs font-bold p-1 border-2 border-black rounded bg-white outline-none"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2 py-0.5 text-[10px] font-bold border border-black rounded bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2 py-0.5 text-[10px] font-bold border border-black rounded bg-brutal-purple text-white"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className="font-extrabold text-sm sm:text-base text-black tracking-tight leading-snug">
              {pin.title}
            </h3>
            <p className="text-xs font-semibold text-zinc-500">
              Added {formattedDate}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
