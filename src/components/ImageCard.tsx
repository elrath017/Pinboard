import React, { useState } from 'react';
import { ImagePin, PinStyle } from '../types';
import { Trash2, Edit3, GripVertical, Check, X, Calendar, Tag, Maximize2 } from 'lucide-react';

interface ImageCardProps {
  pin: ImagePin;
  index: number;
  onOpenLightbox: (pin: ImagePin) => void;
  onDelete: (id: string) => void;
  onUpdatePin: (id: string, updates: { title?: string; caption?: string; note?: string; pinStyle?: PinStyle }) => void;
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
  const [editedPinStyle, setEditedPinStyle] = useState<PinStyle>(pin.pinStyle);
  const [measuredRatio, setMeasuredRatio] = useState<number | null>(pin.aspectRatio || null);

  // Exact match to user-selected pinStyle
  const isTape = pin.pinStyle === 'tape';

  // Map exact pin style to color
  const getPinColor = (style: PinStyle) => {
    switch (style) {
      case 'pin-orange':
        return '#fb923c';
      case 'pin-purple':
        return '#8b5cf6';
      case 'pin-yellow':
        return '#fde047';
      case 'pin-red':
        return '#f87171';
      case 'pin-green':
        return '#4ade80';
      case 'pin-blue':
        return '#38bdf8';
      default:
        return '#fb923c';
    }
  };

  const pinBg = getPinColor(pin.pinStyle);
  const pinSize = pin.pinSize || 20;

  // Compute card flex width based on image aspect ratio:
  // Landscape images render large, portrait images render narrow
  const ratio = measuredRatio || pin.aspectRatio || 1.33;
  const baseWidth = Math.round(250 * ratio);
  const flexGrow = Math.round(ratio * 100) / 100;
  const minWidth = Math.max(140, Math.round(baseWidth * 0.75));
  const maxWidth = Math.max(220, Math.round(baseWidth * 1.35));

  const cardFlexStyle: React.CSSProperties = {
    flex: `${flexGrow} 1 ${baseWidth}px`,
    minWidth: `${minWidth}px`,
    maxWidth: `${maxWidth}px`,
    transform: `rotate(${pin.rotation || 0}deg)`,
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.stopPropagation();
    if (!editedTitle.trim()) return;
    onUpdatePin(pin.id, {
      title: editedTitle.trim(),
      caption: editedCaption.trim() || undefined,
      pinStyle: editedPinStyle,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(pin.title);
    setEditedCaption(pin.caption || '');
    setEditedPinStyle(pin.pinStyle);
    setIsEditing(false);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(pin.pinnedAt));

  const pinStylesList: { id: PinStyle; label: string; preview: string }[] = [
    { id: 'tape', label: 'Washi Tape', preview: 'bg-brutal-yellow' },
    { id: 'pin-orange', label: 'Orange', preview: 'bg-orange-400 rounded-full' },
    { id: 'pin-purple', label: 'Purple', preview: 'bg-brutal-purple rounded-full' },
    { id: 'pin-yellow', label: 'Yellow', preview: 'bg-brutal-yellow rounded-full' },
    { id: 'pin-red', label: 'Red', preview: 'bg-rose-500 rounded-full' },
    { id: 'pin-green', label: 'Green', preview: 'bg-brutal-green rounded-full' },
    { id: 'pin-blue', label: 'Blue', preview: 'bg-sky-400 rounded-full' },
  ];

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, index)}
      onDragOver={e => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      style={cardFlexStyle}
      className="group relative bg-white border-[2.5px] border-black rounded-xl shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-all duration-150 flex flex-col cursor-pointer select-none p-3 pt-4 shrink-0 max-w-full"
      onClick={() => onOpenLightbox(pin)}
    >
      {/* Top Attachment: Strictly matches selected pinStyle (Tape Strip vs Specific Color Pin) */}
      {isTape ? (
        <div 
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#fde047] border-2 border-black shadow-[2px_2px_0_#000] z-20 pointer-events-none"
          style={{ transform: 'translateX(-50%) rotate(-1deg)' }}
        />
      ) : (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full border-[2.5px] border-black shadow-[2px_2px_0_#000] z-20 flex items-center justify-center pointer-events-none"
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
          title="Edit pin name & attachment"
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

      {/* Image Container: Never crop images, natural aspect ratio */}
      <div className="border-2 border-black rounded-lg overflow-hidden bg-white mb-2.5 flex items-center justify-center">
        <img
          src={pin.imageUrl}
          alt={pin.title}
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setMeasuredRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
          className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>

      {/* Card Info Section: Bold Title + Added Date */}
      <div className="flex flex-col space-y-1">
        {isEditing ? (
          <form 
            onSubmit={handleSaveEdit} 
            onClick={e => e.stopPropagation()} 
            className="space-y-2 bg-purple-50 p-2.5 rounded-lg border-2 border-black"
          >
            <div>
              <label className="block text-[10px] font-black uppercase text-black mb-0.5">
                Pin Name
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                placeholder="Pin name..."
                autoFocus
                className="w-full text-xs font-bold p-1 border-2 border-black rounded bg-white outline-none"
              />
            </div>

            {/* Attachment Style Picker */}
            <div>
              <label className="block text-[10px] font-black uppercase text-black mb-1">
                Attachment Style
              </label>
              <div className="flex flex-wrap gap-1">
                {pinStylesList.map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setEditedPinStyle(item.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border border-black flex items-center gap-1 ${
                      editedPinStyle === item.id
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 border border-black ${item.preview}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-1 pt-1">
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
