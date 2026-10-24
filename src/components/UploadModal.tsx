import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { PinStyle } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPins: (pins: Array<{
    imageUrl: string;
    title: string;
    caption?: string;
    note?: string;
    tags?: string[];
    pinStyle: PinStyle;
  }>) => void;
}

interface StagedFile {
  id: string;
  dataUrl: string;
  name: string;
  sizeFormatted: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddPins,
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [pinStyle, setPinStyle] = useState<PinStyle>('tape');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    setError('');
    setIsCompressing(true);
    const newStaged: StagedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError('Only valid image files (PNG, JPG, WebP, GIF, SVG) are supported.');
        continue;
      }

      try {
        // Compress / resize image
        const compressed = await compressImage(file, 1400, 1400, 0.85);
        const approxSizeKb = Math.round((compressed.length * 3) / 4 / 1024);
        
        newStaged.push({
          id: `staged-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl: compressed,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          sizeFormatted: `${approxSizeKb} KB`,
        });
      } catch (err) {
        console.error('Error compressing image', err);
        setError('Failed to process one or more images.');
      }
    }

    setStagedFiles(prev => [...prev, ...newStaged]);
    setIsCompressing(false);

    // Default title from the first image if empty
    if (!title && newStaged.length > 0) {
      const first = newStaged[0].name;
      setTitle(first.charAt(0).toUpperCase() + first.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedFiles.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    if (!title.trim() && stagedFiles.length === 1) {
      setError('Please provide a title for your image.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // If multiple images are uploaded at once, create a card for each with shared or auto titles!
    const newPins = stagedFiles.map((item, idx) => ({
      imageUrl: item.dataUrl,
      title: stagedFiles.length === 1 
        ? title.trim() 
        : title.trim() 
          ? `${title.trim()} (#${idx + 1})` 
          : item.name.charAt(0).toUpperCase() + item.name.slice(1),
      caption: caption.trim() || undefined,
      note: note.trim() || undefined,
      tags: tags.length > 0 ? tags : ['Visual'],
      pinStyle,
    }));

    onAddPins(newPins);

    // Reset and close
    setStagedFiles([]);
    setTitle('');
    setCaption('');
    setNote('');
    setTagsInput('');
    setError('');
    onClose();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#181820] border-[3px] border-black dark:border-zinc-700 rounded-2xl shadow-brutal-xl overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b-[2.5px] border-black dark:border-zinc-700 bg-brutal-purple text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brutal-yellow border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center text-black font-bold">
              <ImageIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Add Images to Pinboard</h2>
              <p className="text-xs text-purple-100 font-medium">Multi-upload, drag & drop, and auto-compressed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-black/60 hover:bg-black text-white transition-colors border border-black/40"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 bg-white dark:bg-[#181820]">
          {error && (
            <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-950/70 border-2 border-black dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-[2.5px] border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brutal-purple bg-brutal-purple-light dark:bg-purple-950/40 shadow-brutal'
                : 'border-black dark:border-zinc-600 hover:border-brutal-purple bg-[#faf8ff] dark:bg-[#121218] hover:bg-white dark:hover:bg-[#161622] shadow-[2px_2px_0_#000]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={e => e.target.files && processFiles(e.target.files)}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-brutal-yellow border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center text-black">
                <Upload className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-sm font-bold text-black dark:text-white">
                <span className="text-brutal-purple dark:text-purple-400 underline decoration-2">Click to select images</span> or drag & drop here
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Supports multiple files (PNG, JPG, WebP, GIF, SVG)
              </p>
              {isCompressing && (
                <div className="text-xs font-bold text-brutal-purple dark:text-purple-400 animate-pulse flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Compressing and optimizing images...
                </div>
              )}
            </div>
          </div>

          {/* Staged Images Previews */}
          {stagedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-black dark:text-white tracking-wider">
                  Selected Images ({stagedFiles.length})
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  Auto-optimized
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-40 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-xl">
                {stagedFiles.map(file => (
                  <div key={file.id} className="relative group rounded-lg overflow-hidden border-2 border-black dark:border-zinc-700 aspect-square bg-white dark:bg-zinc-800 shadow-[2px_2px_0_#000]">
                    <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveStaged(file.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-rose-500 text-white border border-black hover:bg-rose-600 transition-colors shadow-[1px_1px_0_#000]"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-mono text-white px-1 py-0.5 truncate text-center">
                      {file.sizeFormatted}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title / Caption Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-1">
              Title <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. System Architecture Diagram"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_#000] focus:shadow-brutal rounded-lg px-3 py-2 text-sm font-semibold text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all focus:border-brutal-purple"
            />
          </div>

          {/* Caption / Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-1">
              Caption <span className="text-zinc-500 dark:text-zinc-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Visual flow of auth workers and database replicas..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_#000] focus:shadow-brutal rounded-lg px-3 py-2 text-sm font-medium text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all focus:border-brutal-purple"
            />
          </div>

          {/* Sticky Note */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-1">
              Sticky Note <span className="text-zinc-500 dark:text-zinc-400 font-normal lowercase">(optional reminder or todo)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Follow up on cache invalidation review by Friday."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-amber-50 dark:bg-amber-950/40 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_#000] focus:shadow-brutal rounded-lg px-3 py-2 text-xs font-mono text-black dark:text-amber-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all resize-none focus:border-amber-400"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-1">
              Tags <span className="text-zinc-500 dark:text-zinc-400 font-normal lowercase">(comma separated)</span>
            </label>
            <input
              type="text"
              placeholder="Architecture, Design, Frontend, UI"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_#000] focus:shadow-brutal rounded-lg px-3 py-2 text-xs font-mono text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all focus:border-brutal-purple"
            />
          </div>

          {/* Notice Board Pin / Tape Style */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
              Pinboard Attachment Style
            </label>
            <div className="flex flex-wrap gap-2">
              {pinStylesList.map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPinStyle(item.id)}
                  className={`btn-brutal px-3 py-1.5 rounded-lg border-2 border-black dark:border-zinc-600 text-xs font-bold flex items-center gap-2 transition-all ${
                    pinStyle === item.id
                      ? 'bg-black text-white dark:bg-zinc-100 dark:text-black shadow-brutal-sm'
                      : 'bg-white text-black hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-[1.5px_1.5px_0_#000]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 border border-black ${item.preview}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t-2 border-black dark:border-zinc-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-brutal px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold text-xs border-2 border-black dark:border-zinc-600 shadow-[2px_2px_0_#000]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={stagedFiles.length === 0}
              className="btn-brutal px-5 py-2 rounded-lg bg-brutal-purple hover:bg-brutal-purple-hover disabled:opacity-50 text-white font-black text-xs border-2 border-black dark:border-zinc-600 shadow-brutal flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Pin to Board ({stagedFiles.length})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
