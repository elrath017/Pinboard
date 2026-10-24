import React, { useState, useEffect } from 'react';
import { ImagePin } from '../types';
import { X, Trash2, Edit3, Download, Calendar, Tag, Check, StickyNote, Maximize2 } from 'lucide-react';

interface LightboxProps {
  pin: ImagePin | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdatePin: (id: string, updates: { title?: string; caption?: string; note?: string }) => void;
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (pin) {
      setEditedTitle(pin.title || '');
      setEditedCaption(pin.caption || '');
      setEditedNote(pin.note || '');
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
    });
    setIsEditing(false);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(pin.pinnedAt));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl w-full bg-white border-[3px] border-black rounded-2xl shadow-brutal-xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b-[2.5px] border-black bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-brutal-yellow border-2 border-black font-mono font-bold text-[11px] uppercase shadow-[1.5px_1.5px_0_#000] shrink-0">
              {pin.pinStyle.replace('-', ' ')}
            </span>
            <h2 className="text-base sm:text-lg font-black text-black tracking-tight truncate">
              {pin.title}
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 rounded border border-black/40 hover:border-black hover:bg-zinc-100 text-zinc-700 hover:text-black shrink-0"
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
              className="btn-brutal px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-xs border-2 border-black shadow-brutal flex items-center gap-1.5"
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
          <div className="flex-1 bg-[#faf8ff] p-4 sm:p-6 flex items-center justify-center min-h-[360px]">
            <img
              src={pin.imageUrl}
              alt={pin.title}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl border-[2.5px] border-black shadow-brutal-lg bg-white"
            />
          </div>

          {/* Details / Edit Drawer */}
          <div className="border-t-[2.5px] border-black bg-white p-4 sm:p-5">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3 max-w-3xl mx-auto bg-purple-50 p-4 rounded-xl border-2 border-black">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black tracking-wider">
                    ✏️ Edit Pin Details
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">Press Save when done</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Pin Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    placeholder="Enter pin name..."
                    autoFocus
                    className="w-full text-sm font-bold p-2 border-2 border-black rounded-lg bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Caption
                  </label>
                  <textarea
                    rows={2}
                    value={editedCaption}
                    onChange={e => setEditedCaption(e.target.value)}
                    placeholder="Enter image caption..."
                    className="w-full text-xs font-medium p-2 border-2 border-black rounded-lg bg-white outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Sticky Note
                  </label>
                  <textarea
                    rows={2}
                    value={editedNote}
                    onChange={e => setEditedNote(e.target.value)}
                    placeholder="Enter notes or todos..."
                    className="w-full text-xs font-mono p-2 border-2 border-black rounded-lg bg-amber-50 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditedTitle(pin.title);
                      setEditedCaption(pin.caption || '');
                      setEditedNote(pin.note || '');
                      setIsEditing(false);
                    }}
                    className="btn-brutal px-3 py-1.5 text-xs font-bold border-2 border-black rounded-lg bg-zinc-100 hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editedTitle.trim()}
                    className="btn-brutal px-4 py-1.5 text-xs font-black border-2 border-black rounded-lg bg-brutal-purple text-white hover:bg-brutal-purple-hover disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-black tracking-tight">
                      {pin.title}
                    </h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 border border-black/40 text-xs font-bold text-zinc-700 flex items-center gap-1"
                      title="Edit pin name"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Name</span>
                    </button>
                  </div>

                  {pin.caption && (
                    <p className="text-xs sm:text-sm text-zinc-800 font-medium leading-relaxed max-w-3xl">
                      {pin.caption}
                    </p>
                  )}

                  {pin.note && (
                    <div className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-amber-100 border border-black text-xs font-mono text-zinc-900 shadow-[1.5px_1.5px_0_#000]">
                      <StickyNote className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{pin.note}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 mr-2">
                      <Calendar className="w-3 h-3 text-black" />
                      Added {formattedDate}
                    </span>

                    {pin.tags && pin.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-purple-100 border border-black/60 text-brutal-purple"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delete button with confirmation */}
                <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5 bg-rose-100 border-2 border-black p-1 rounded-lg shadow-brutal animate-fadeIn">
                      <span className="text-xs font-bold text-rose-800 px-1">Delete this pin?</span>
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
                        className="btn-brutal px-2 py-1 bg-zinc-200 text-black rounded font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="btn-brutal py-2 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs border-2 border-black shadow-brutal flex items-center gap-1.5"
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
