import React, { useState, useEffect } from 'react';
import { ImagePin, PinStyle } from '../types';
import { X, Trash2, Edit3, Download, Calendar, Tag, Check, StickyNote, Maximize2 } from 'lucide-react';

interface LightboxProps {
  pin: ImagePin | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdatePin: (id: string, updates: { title?: string; caption?: string; note?: string; pinStyle?: PinStyle }) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  pin,
  onClose,
  onDelete,
  onUpdatePin,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [editedNote, setEditedNote] = useState('');
  const [editedPinStyle, setEditedPinStyle] = useState<PinStyle>('tape');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (pin) {
      setEditedTitle(pin.title || '');
      setEditedCaption(pin.caption || '');
      setEditedNote(pin.note || '');
      setEditedPinStyle(pin.pinStyle);
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
  }, [pin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!pin) return null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;
    onUpdatePin(pin.id, {
      title: editedTitle.trim(),
      caption: editedCaption.trim() || undefined,
      note: editedNote.trim() || undefined,
      pinStyle: editedPinStyle,
    });
    setIsEditing(false);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(pin.pinnedAt));

  const pinStylesList: { id: PinStyle; label: string; preview: string }[] = [
    { id: 'tape', label: 'Washi Tape', preview: 'bg-brutal-yellow' },
    { id: 'pin-orange', label: 'Orange Pin', preview: 'bg-orange-400 rounded-full' },
    { id: 'pin-purple', label: 'Purple Pin', preview: 'bg-brutal-purple rounded-full' },
    { id: 'pin-yellow', label: 'Yellow Pin', preview: 'bg-brutal-yellow rounded-full' },
    { id: 'pin-red', label: 'Red Pin', preview: 'bg-rose-500 rounded-full' },
    { id: 'pin-green', label: 'Green Pin', preview: 'bg-brutal-green rounded-full' },
    { id: 'pin-blue', label: 'Blue Pin', preview: 'bg-sky-400 rounded-full' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl w-full bg-white dark:bg-[#181820] border-[3px] border-black dark:border-zinc-700 rounded-2xl shadow-brutal-xl overflow-hidden flex flex-col max-h-[95vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b-[2.5px] border-black dark:border-zinc-700 bg-white dark:bg-[#181820] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-brutal-yellow text-black border-2 border-black font-mono font-bold text-[11px] uppercase shadow-[1.5px_1.5px_0_#000] shrink-0">
              {pin.pinStyle.replace('-', ' ')}
            </span>
            <h2 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight truncate">
              {pin.title}
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 rounded border border-black/40 hover:border-black dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white shrink-0"
              title="Edit pin name and details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pin.imageUrl}
              download={`${pin.title || 'pin-image'}.png`}
              target="_blank"
              rel="noreferrer"
              className="btn-brutal px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-black dark:text-white font-bold text-xs border-2 border-black dark:border-zinc-600 shadow-brutal flex items-center gap-1.5"
              title="Download full image"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="btn-brutal p-1.5 rounded-lg bg-brutal-yellow hover:bg-yellow-300 text-black border-2 border-black shadow-brutal"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Modal Main Area: Shows Complete Image Full Above Page */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Complete Image Full Preview Canvas */}
          <div className="flex-1 bg-[#faf8ff] dark:bg-[#0e0e13] p-4 sm:p-6 flex items-center justify-center min-h-[360px]">
            <img
              src={pin.imageUrl}
              alt={pin.title}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl border-[2.5px] border-black dark:border-zinc-700 shadow-brutal-lg bg-white dark:bg-[#121218]"
            />
          </div>

          {/* Details / Edit Drawer */}
          <div className="border-t-[2.5px] border-black dark:border-zinc-700 bg-white dark:bg-[#181820] p-4 sm:p-5 text-black dark:text-white">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3 max-w-3xl mx-auto bg-purple-50 dark:bg-zinc-900/90 p-4 rounded-xl border-2 border-black dark:border-zinc-700 shadow-[3px_3px_0_#000]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black dark:text-white tracking-wider">
                    ✏️ Edit Pin Details
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Press Save when done</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-300 mb-1">
                    Pin Name <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    placeholder="Enter pin name..."
                    autoFocus
                    className="w-full text-sm font-bold p-2 border-2 border-black dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white outline-none focus:border-brutal-purple"
                  />
                </div>

                {/* Attachment Style in Lightbox Edit */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-300 mb-1">
                    Attachment Style
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {pinStylesList.map(item => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setEditedPinStyle(item.id)}
                        className={`px-2 py-1 rounded text-xs font-bold border border-black dark:border-zinc-600 flex items-center gap-1.5 transition-all ${
                          editedPinStyle === item.id
                            ? 'bg-black text-white dark:bg-zinc-100 dark:text-black shadow-[2px_2px_0_#000]'
                            : 'bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span className={`w-3 h-3 border border-black ${item.preview}`} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-300 mb-1">
                    Caption
                  </label>
                  <textarea
                    rows={2}
                    value={editedCaption}
                    onChange={e => setEditedCaption(e.target.value)}
                    placeholder="Enter image caption..."
                    className="w-full text-xs font-medium p-2 border-2 border-black dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white outline-none resize-none focus:border-brutal-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-300 mb-1">
                    Sticky Note
                  </label>
                  <textarea
                    rows={2}
                    value={editedNote}
                    onChange={e => setEditedNote(e.target.value)}
                    placeholder="Enter notes or todos..."
                    className="w-full text-xs font-mono p-2 border-2 border-black dark:border-zinc-700 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-black dark:text-amber-200 outline-none resize-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditedTitle(pin.title);
                      setEditedCaption(pin.caption || '');
                      setEditedNote(pin.note || '');
                      setEditedPinStyle(pin.pinStyle);
                      setIsEditing(false);
                    }}
                    className="btn-brutal px-3 py-1.5 text-xs font-bold border-2 border-black dark:border-zinc-600 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editedTitle.trim()}
                    className="btn-brutal px-4 py-1.5 text-xs font-black border-2 border-black dark:border-zinc-600 rounded-lg bg-brutal-purple text-white hover:bg-brutal-purple-hover disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-black dark:text-white tracking-tight">
                      {pin.title}
                    </h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-black/40 dark:border-zinc-600 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1"
                      title="Edit pin name"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {pin.caption && (
                    <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-300 font-medium leading-relaxed max-w-3xl">
                      {pin.caption}
                    </p>
                  )}

                  {pin.note && (
                    <div className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-black dark:border-amber-700 text-xs font-mono text-zinc-900 dark:text-amber-200 shadow-[1.5px_1.5px_0_#000]">
                      <StickyNote className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>{pin.note}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-2">
                      <Calendar className="w-3 h-3 text-black dark:text-zinc-400" />
                      Added {formattedDate}
                    </span>

                    {pin.tags && pin.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-purple-100 dark:bg-purple-950/70 border border-black/60 dark:border-purple-800 text-brutal-purple dark:text-purple-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delete button with confirmation */}
                <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/80 border-2 border-black dark:border-rose-800 p-1 rounded-lg shadow-brutal animate-fadeIn">
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-200 px-1">Delete this pin?</span>
                      <button
                        onClick={() => {
                          onDelete(pin.id);
                          onClose();
                        }}
                        className="btn-brutal px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded font-bold text-xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(false)}
                        className="btn-brutal px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white rounded font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="btn-brutal py-2 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold text-xs border-2 border-black dark:border-rose-900 shadow-brutal flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Delete Pin</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
