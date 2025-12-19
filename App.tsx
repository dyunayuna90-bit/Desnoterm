import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FileText, ChevronDown, ChevronRight, Plus, 
  Settings, Moon, Sun, X, Save, Move, Trash2, Terminal, Github, 
  Search, LayoutGrid, AlertTriangle,
  Download, Upload, GitBranch, Command, Clock, Disc, 
  Check, AlignLeft, Type, Hash, Square
} from 'lucide-react';

// --- DATA INITIALIZATION ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getFormattedTime = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

const initialFolders = [
  {
    id: 'folder-1',
    name: '~/skripsi/sejarah_lisan_indonesia_final_draft_revisi',
    isExpanded: false,
    notes: [
      { id: 'note-1', title: 'wawancara_pak_hartono_mei_98_full.md', content: 'Narasumber utama untuk bab 3. Punya arsip foto 98. Beliau bilang kalau arsip itu harus dijaga baik-baik.', isPeeked: false },
    ]
  },
  {
    id: 'folder-2',
    name: '~/kuliah/filsafat',
    isExpanded: true,
    notes: [
        { id: 'note-f1', title: 'stoikisme_intro_marcus_aurelius.txt', content: 'Fokus pada apa yang bisa dikendalikan. Abaikan opini orang lain.\n\nJangan biarkan masa depan mengganggumu. Kamu akan menghadapinya, jika memang harus, dengan senjata nalar yang sama yang hari ini membekalimu melawan masa kini.', isPeeked: false }
    ]
  }
];

const initialRootNotes = [
  { id: 'root-1', title: 'ide_lukisan_cyberpunk_2077.txt', content: 'Konsep: Cyberpunk Jakarta. Canvas 40x60. Acrylic.\nRef: Blade Runner lighting, tapi setting di Glodok.', isPeeked: false },
  { id: 'root-2', title: 'grocery_list_unj_kantin.list', content: '1. Rokok Ziga\n2. Kopi Hitam\n3. Kertas A3\n4. Cat Minyak', isPeeked: false },
];

// --- SMART TYPEWRITER (ANTI-CRASH) ---
const Typewriter = ({ text = "", speed = 20, delay = 0, triggerKey = null }) => {
  const safeText = text || "";
  const [displayed, setDisplayed] = useState(safeText); 
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  
  const hasTyped = useRef(false);
  const prevTrigger = useRef(triggerKey);
  const prevText = useRef(safeText);

  useEffect(() => {
    if (prevText.current === safeText && prevTrigger.current === triggerKey && hasTyped.current) return;

    hasTyped.current = true;
    prevTrigger.current = triggerKey;
    prevText.current = safeText;

    setDisplayed('');
    setIsCursorVisible(true);
    
    let i = 0;
    let timer;
    const startDelay = Math.random() * 150; 

    const runTyping = () => {
        timer = setInterval(() => {
            if (i < safeText.length) {
                setDisplayed(safeText.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
                setIsCursorVisible(false);
            }
        }, speed);
    };

    const delayTimeout = setTimeout(runTyping, startDelay);

    return () => {
        clearTimeout(delayTimeout);
        if(timer) clearInterval(timer);
    };
  }, [safeText, triggerKey, speed]);

  return (
    <span>
      {displayed}
      {isCursorVisible && <span className="animate-pulse inline-block w-1.5 h-3 bg-current ml-0.5 align-middle opacity-70"></span>}
    </span>
  );
};

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 148, 158, 0.2); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 148, 158, 0.4); }
    
    textarea, input { caret-color: #3fb950; caret-shape: block; }
    ::selection { background: rgba(63, 185, 80, 0.99); color: black; }

    /* Animasi Flash pas klik */
    @keyframes flash {
      0% { background-color: rgba(63, 185, 80, 0.3); }
      100% { background-color: transparent; }
    }
    .flash-active:active { animation: flash 0.1s ease-out; }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `}</style>
);

// --- HELPER: Editor Stats ---
const getEditorStats = (text) => {
    const safeText = text || "";
    const chars = safeText.length;
    const words = safeText.trim() === '' ? 0 : safeText.trim().split(/\s+/).length;
    const lines = safeText.split('\n').length;
    return { chars, words, lines };
};

// --- COMPONENTS ---

const SelectionCheckbox = ({ isSelected, onToggle, isTerminal }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`shrink-0 mr-3 cursor-pointer transition-all duration-200 z-20 ${isSelected ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
    >
        {isSelected 
            ? <div className={`p-0.5 rounded ${isTerminal ? 'bg-[#3fb950] text-black' : 'bg-[#24292f] text-white'}`}><Check size={14} strokeWidth={4} /></div>
            : <Square size={18} className={isTerminal ? 'text-[#8b949e]' : 'text-gray-400'} />
        }
    </div>
);

const NoteCard = ({ note, isTerminal, onOpen, onPeek, refreshKey, isSelectionMode, isSelected, onToggleSelect }) => {
  // --- TAMPILAN LIGHT MODE DIPERBAIKI DISINI ---
  // Kita pake shadow yang lebih nendang dan border yang clean
  const terminalClass = `bg-[#0d1117] border ${isSelected ? 'border-[#3fb950]' : 'border-[#30363d]'} hover:border-[#8b949e]`;
  // Light mode: Shadow agak dalem (shadow-md) + border halus + bg white
  const lightClass = `bg-white border ${isSelected ? 'border-black ring-1 ring-black' : 'border-[#d0d7de]'} hover:border-[#b1bac4] shadow-[0_3px_6px_rgba(140,149,159,0.15)] hover:shadow-[0_8px_24px_rgba(140,149,159,0.2)] hover:-translate-y-0.5`;

  const cardClass = isTerminal ? terminalClass : lightClass;
  
  const getPeekContent = (text) => {
    if (!text) return "Empty...";
    if (text.length <= 150) return text;
    return text.substring(0, 150) + "...";
  };

  const handleCardClick = () => {
      if (isSelectionMode) onToggleSelect();
      else onOpen();
  };

  return (
    <div 
        className={`relative flex flex-col ${cardClass} h-auto overflow-hidden group w-full rounded-lg transition-all duration-300 ${isSelected ? 'translate-x-1' : ''}`}
        onClick={handleCardClick}
    >
       {/* HEADER */}
       <div className={`flex items-start p-3 border-b ${isTerminal ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'} border-opacity-50 min-h-[60px] flash-active cursor-pointer`}>
          {isSelectionMode && <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} isTerminal={isTerminal} />}
          <div className="flex-1 overflow-hidden">
             <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className={isTerminal ? 'text-[#3fb950]' : 'text-[#24292f]'} />
                <span className={`font-bold text-[10px] font-mono uppercase tracking-wide opacity-50`}>DOC</span>
             </div>
             <span className={`font-bold text-xs font-mono leading-snug line-clamp-3 ${isTerminal ? 'text-[#e6edf3]' : 'text-[#24292f]'}`}>
                <Typewriter text={note.title} speed={10} triggerKey={refreshKey} />
             </span>
          </div>
       </div>

       {/* PEEK CONTENT */}
       {note.isPeeked && (
           <div className="p-3 cursor-pointer flex-1 hover:bg-current hover:bg-opacity-5 transition-colors flash-active" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              <div className={`text-[10px] leading-relaxed font-mono ${isTerminal ? 'text-[#8b949e]' : 'text-[#57606a]'}`}>
                  <div className={`pl-2 py-1 border-l-2 ${isTerminal ? 'border-[#3fb950] text-[#e6edf3]' : 'border-[#24292f] text-[#1f2328]'}`}>
                    <Typewriter text={getPeekContent(note.content)} speed={5} triggerKey={note.isPeeked} />
                  </div>
              </div>
           </div>
       )}

       {!isSelectionMode && (
           <button 
             onClick={(e) => { e.stopPropagation(); onPeek(); }}
             className={`w-full py-1.5 flex items-center justify-center border-t ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'} border-opacity-50 text-[9px] font-bold uppercase tracking-wider transition-colors opacity-50 hover:opacity-100 bg-transparent flash-active z-10 ${isTerminal ? 'text-white' : 'text-[#24292f]'}`}
           >
              {note.isPeeked ? '[ CLOSE_STREAM ]' : '[ SCAN_DATA ]'}
           </button>
       )}
    </div>
  );
};

const FolderCard = ({ folder, isTerminal, onToggle, onMoveNote, onDeleteNote, onOpenNote, onPeekNote, onAddNote, refreshKey, isSelectionMode, isSelected, onToggleSelect, selectedSubItems = new Set(), onToggleSubItem }) => {
  const terminalClass = `bg-[#0d1117] border ${isSelected ? 'border-[#3fb950]' : 'border-[#30363d]'} hover:border-[#8b949e]`;
  const lightClass = `bg-white border ${isSelected ? 'border-black ring-1 ring-black' : 'border-[#d0d7de]'} hover:border-[#b1bac4] shadow-[0_3px_6px_rgba(140,149,159,0.15)] hover:shadow-[0_8px_24px_rgba(140,149,159,0.2)] hover:-translate-y-0.5`;

  const cardClass = isTerminal ? terminalClass : lightClass;

  const handleHeaderClick = () => {
      if (isSelectionMode) onToggleSelect();
      else onToggle();
  };

  return (
    <div className={`relative flex flex-col w-full rounded-lg transition-all duration-300 ${cardClass} ${folder.isExpanded ? 'h-full' : ''}`}>
      <div 
        className={`p-3 flex items-start cursor-pointer flash-active ${folder.isExpanded ? (isTerminal ? 'border-b border-[#30363d]' : 'border-b border-[#d0d7de]') : ''} ${isTerminal ? '' : 'bg-[#f6f8fa]'}`}
        onClick={handleHeaderClick}
      >
        {isSelectionMode && <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} isTerminal={isTerminal} />}

        <div className="flex-1 flex items-start gap-2 overflow-hidden">
           <Folder size={16} className={`mt-0.5 ${isTerminal ? 'text-[#3fb950]' : 'text-[#24292f]'}`} />
           <div className="flex flex-col gap-1 w-full">
             <span className={`font-bold text-xs font-mono leading-snug line-clamp-3 ${isTerminal ? 'text-[#e6edf3]' : 'text-[#1f2328]'}`}>
                <Typewriter text={folder.name} speed={15} triggerKey={refreshKey} />
             </span>
             {!folder.isExpanded && <span className="text-[9px] opacity-40 font-mono">SIZE: {folder.notes.length} ITEMS</span>}
           </div>
        </div>
        
        {!isSelectionMode && (
            <div className="flex items-center opacity-40 hover:opacity-100 pl-2">
                {folder.isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </div>
        )}
      </div>

      {folder.isExpanded && (
        <div className="p-2 space-y-2 origin-top border-l-2 border-opacity-10 ml-2 my-2 border-current flex-1">
            {folder.notes.length === 0 ? <div className="text-center opacity-30 text-[10px] py-1 font-mono">// Empty Folder</div> : 
            folder.notes.map(note => (
               <div key={note.id} className={`flex flex-col ${isTerminal ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white border border-[#d0d7de]'} rounded-sm overflow-hidden transition-transform active:scale-[0.99] ${isSelectionMode && selectedSubItems.has(note.id) ? (isTerminal ? 'border-[#3fb950]' : 'border-black') : ''}`}>
                 <div 
                    className="flex items-center justify-between p-2 border-b border-transparent hover:border-current hover:border-opacity-10 cursor-pointer"
                    onClick={() => {
                        if (isSelectionMode) onToggleSubItem(note.id);
                        else onOpenNote(note);
                    }}
                 >
                    {isSelectionMode && (
                        <div className="mr-2">
                            {selectedSubItems.has(note.id) 
                                ? <Check size={12} className={isTerminal ? 'text-[#3fb950]' : 'text-[#24292f]'} /> 
                                : <Square size={12} className="opacity-30" />}
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden flash-active">
                       <span className="text-[10px] font-bold truncate block hover:underline font-mono">
                          <Typewriter text={note.title} speed={10} delay={50} />
                       </span>
                    </div>
                 </div>
                 {!isSelectionMode && note.isPeeked && (
                   <div 
                     className={`mx-2 mb-2 mt-1 pl-2 py-1 border-l-2 text-[9px] font-mono whitespace-pre-wrap cursor-pointer ${isTerminal ? 'border-[#3fb950] text-[#e6edf3]' : 'border-[#24292f] text-[#1f2328]'}`}
                     onClick={() => onOpenNote(note)}
                   >
                     <Typewriter text={note.content ? note.content.substring(0, 100) + "..." : "Empty..."} speed={5} triggerKey={note.isPeeked} />
                   </div>
                 )}
                 {!isSelectionMode && (
                     <button onClick={() => onPeekNote(note.id)} className="w-full py-0.5 bg-black/5 hover:bg-black/10 text-[8px] text-center opacity-40 uppercase tracking-widest hover:opacity-100 transition-opacity flash-active">
                       {note.isPeeked ? '[ - ]' : '[ + ]'}
                     </button>
                 )}
               </div>
            ))}
            {!isSelectionMode && (
                <button 
                    onClick={onAddNote}
                    className="w-full py-1.5 text-[10px] text-center opacity-40 hover:opacity-100 border border-dashed border-current rounded flex justify-center items-center gap-1 hover:bg-current hover:bg-opacity-5 transition-all font-mono flash-active"
                >
                    <Plus size={10}/> Add_File
                </button>
            )}
        </div>
      )}
    </div>
  );
};

const EditorModal = ({ note, isTerminal, onClose, onSave }) => {
  if (!note) return null;
  const stats = getEditorStats(note.content);
  
  const lineCount = Math.max(50, stats.lines + 5); 
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isTerminal ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-white text-[#24292f]'} font-mono animate-in slide-in-from-bottom-5 fade-in duration-200`}>
      <div className={`flex justify-between items-center p-2 px-4 border-b ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
        <div className="flex flex-col gap-1 overflow-hidden flex-1 mr-4">
            <span className="font-bold text-xs truncate">{note.title}</span>
            <div className={`flex gap-3 text-[9px] opacity-60`}>
                <span className="flex items-center gap-1"><AlignLeft size={8}/> {stats.lines}L</span>
                <span className="flex items-center gap-1"><Hash size={8}/> {stats.words}W</span>
                <span className="flex items-center gap-1"><Type size={8}/> {stats.chars}C</span>
                <span className={`px-1 rounded text-[8px] font-bold ${isTerminal ? 'bg-[#238636] text-white' : 'bg-[#24292f] text-white'}`}>INSERT</span>
            </div>
        </div>
        <button onClick={onClose} className={`shrink-0 px-3 py-1.5 text-xs font-bold border rounded flex items-center gap-2 ${isTerminal ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'} transition-colors flash-active`}>
            <Save size={14} /> SAVE
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex overflow-y-auto custom-scrollbar relative">
              <div className={`flex flex-col items-end pt-4 pr-3 pl-1 text-[10px] opacity-30 select-none border-r ${isTerminal ? 'border-[#30363d] bg-[#0d1117]' : 'border-[#d0d7de] bg-[#f6f8fa]'} min-h-full w-8`}>
                  {lines.map(line => (
                      <div key={line} className="leading-relaxed h-[20px]">{line}</div>
                  ))}
              </div>
              {/* FIX: whitespace-pre-wrap agar otomatis ganti baris 
                  tapi tetep ngejaga enter yang manual
              */}
              <textarea 
                value={note.content}
                onChange={(e) => onSave(e.target.value)}
                className={`flex-1 w-full p-4 bg-transparent outline-none resize-none text-xs leading-relaxed font-mono whitespace-pre-wrap`}
                style={{ lineHeight: '20px' }} 
                placeholder={isTerminal ? "// Type code here..." : "Start writing..."}
                spellCheck={false}
                autoFocus
              />
          </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, count, onConfirm, onCancel, isTerminal }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className={`w-full max-w-sm p-6 ${isTerminal ? 'bg-[#161b22] border border-[#30363d] text-[#e6edf3]' : 'bg-white border border-gray-200 text-gray-800'} rounded-lg flex flex-col gap-4 text-center items-center shadow-2xl scale-100 font-mono`}>
          <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-2">
             <AlertTriangle size={32} />
          </div>
          <h3 className="font-bold text-xl">CONFIRM DELETION</h3>
          <p className="opacity-70 text-xs">Delete {count} selected item(s)? This action is irreversible.</p>
          <div className="flex gap-2 w-full mt-4">
              <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-lg flash-active">
                DELETE
              </button>
              <button onClick={onCancel} className="flex-1 py-2 border border-current opacity-60 hover:opacity-100 text-xs font-bold rounded uppercase tracking-wider transition-opacity flash-active">
                CANCEL
              </button>
          </div>
        </div>
    </div>
  );
};

const SelectionBar = ({ isTerminal, selectedCount, onCancel, onDelete, onMove, canMove }) => (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 px-4 rounded-full shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 ${isTerminal ? 'bg-[#161b22] border border-[#30363d] text-white' : 'bg-white border border-gray-200 text-black shadow-lg'}`}>
        <div className="font-bold text-xs pr-2 border-r border-current border-opacity-20">{selectedCount} Selected</div>
        <button onClick={onDelete} className="p-2 hover:text-red-500 transition-colors flex flex-col items-center gap-0.5"><Trash2 size={16} /></button>
        {canMove && <button onClick={onMove} className="p-2 hover:text-yellow-500 transition-colors flex flex-col items-center gap-0.5"><Move size={16} /></button>}
        <button onClick={onCancel} className="p-2 opacity-50 hover:opacity-100 border-l border-current border-opacity-20 pl-3 ml-1"><X size={16} /></button>
    </div>
);

// --- MAIN APP COMPONENT ---

export default function DesnoteAppV7() {
  const [folders, setFolders] = useState(() => { try { return JSON.parse(localStorage.getItem('desnote_folders_v7')) || initialFolders; } catch { return initialFolders; } });
  const [rootNotes, setRootNotes] = useState(() => { try { return JSON.parse(localStorage.getItem('desnote_root_v7')) || initialRootNotes; } catch { return initialRootNotes; } });
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null); 
  const [moveModal, setMoveModal] = useState({ isOpen: false, noteId: null, sourceId: null, isFromRoot: false, multiSelect: false });
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [createModal, setCreateModal] = useState({ isOpen: false, type: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, count: 0 });
  const [viewMode, setViewMode] = useState('ALL'); 
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const fileInputRef = useRef(null);

  // Persistence
  useEffect(() => { localStorage.setItem('desnote_folders_v7', JSON.stringify(folders)); localStorage.setItem('desnote_root_v7', JSON.stringify(rootNotes)); }, [folders, rootNotes]);

  // Logic Functions
  const toggleSelectionMode = () => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); };
  const toggleSelectItem = (id) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
  const isOnlyNotesSelected = useMemo(() => { if (selectedIds.size === 0) return false; return !Array.from(selectedIds).some(id => folders.find(f => f.id === id)); }, [selectedIds, folders]);
  
  const toggleTheme = () => { setTheme(prev => prev === 'dark' ? 'light' : 'dark'); setRefreshKey(prev => prev + 1); };
  const toggleViewMode = (mode) => { viewMode === mode ? setViewMode('ALL') : setViewMode(mode); setRefreshKey(prev => prev + 1); };
  const toggleFolder = (folderId) => { setFolders(folders.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f)); };
  const togglePeek = (folderId, noteId) => {
    if (!folderId) setRootNotes(rootNotes.map(n => n.id === noteId ? { ...n, isPeeked: !n.isPeeked } : n));
    else setFolders(folders.map(f => f.id !== folderId ? f : { ...f, notes: f.notes.map(n => n.id === noteId ? { ...n, isPeeked: !n.isPeeked } : n) }));
  };
  const handleCreate = (name) => {
    if (!name.trim()) return;
    if (createModal.type === 'FOLDER') setFolders([...folders, { id: generateId(), name: name, isExpanded: true, notes: [] }]);
    else setRootNotes([...rootNotes, { id: generateId(), title: name, content: '', isPeeked: false }]);
    setCreateModal({ isOpen: false, type: null }); setAddMenuOpen(false);
  };
  const handleBulkDelete = () => setDeleteModal({ isOpen: true, count: selectedIds.size });
  const confirmBulkDelete = () => {
      const ids = selectedIds;
      setRootNotes(prev => prev.filter(n => !ids.has(n.id)));
      const cleanFolders = folders.filter(f => !ids.has(f.id)).map(f => ({ ...f, notes: f.notes.filter(n => !ids.has(n.id)) }));
      setFolders(cleanFolders); setDeleteModal({ isOpen: false, count: 0 }); setIsSelectionMode(false); setSelectedIds(new Set());
  };
  const handleBulkMove = () => setMoveModal({ isOpen: true, multiSelect: true });
  const executeBulkMove = (targetFolderId) => {
      let notesToMove = [...rootNotes.filter(n => selectedIds.has(n.id))];
      folders.forEach(f => notesToMove.push(...f.notes.filter(n => selectedIds.has(n.id))));
      setRootNotes(prev => prev.filter(n => !selectedIds.has(n.id)));
      const cleanFolders = folders.map(f => ({ ...f, notes: f.notes.filter(n => !selectedIds.has(n.id)) }));
      notesToMove = notesToMove.map(n => ({...n, isPeeked: false}));
      if (targetFolderId === 'ROOT') { setRootNotes(prev => [...prev, ...notesToMove]); setFolders(cleanFolders); } 
      else { setFolders(cleanFolders.map(f => f.id === targetFolderId ? { ...f, notes: [...f.notes, ...notesToMove] } : f)); }
      setMoveModal({ isOpen: false }); setIsSelectionMode(false); setSelectedIds(new Set()); setRefreshKey(prev => prev + 1);
  };
  const saveEditorContent = (content) => {
    if (!activeNote) return;
    if (activeNote.parentId === null) setRootNotes(rootNotes.map(n => n.id === activeNote.id ? { ...n, content } : n));
    else setFolders(folders.map(f => f.id !== activeNote.parentId ? f : { ...f, notes: f.notes.map(n => n.id === activeNote.id ? { ...n, content } : n) }));
    setActiveNote(prev => ({ ...prev, content }));
  };
  
  // --- NEW FEATURES: EXPORT & IMPORT ---
  const handleExport = () => {
    const data = {
      version: "v7",
      timestamp: new Date().toISOString(),
      folders: folders,
      rootNotes: rootNotes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desnote_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSettingsOpen(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.folders && Array.isArray(data.folders)) setFolders(data.folders);
        if (data.rootNotes && Array.isArray(data.rootNotes)) setRootNotes(data.rootNotes);
        alert('Backup restored successfully!');
        setSettingsOpen(false);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        alert('Failed to parse backup file. Please ensure it is a valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  // --- SPATIAL GRID LOGIC ---
  const combinedItems = useMemo(() => {
    let items = [];
    if (viewMode === 'ALL' || viewMode === 'FOLDER') items.push(...folders.map(f => ({ type: 'FOLDER', data: f })));
    if (viewMode === 'ALL' || viewMode === 'NOTE') items.push(...rootNotes.map(n => ({ type: 'NOTE', data: n })));
    return items;
  }, [folders, rootNotes, viewMode]);

  const isTerminal = theme === 'dark';
  const bgClass = isTerminal ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]';
  const textClass = isTerminal ? 'text-[#e6edf3]' : 'text-[#1f2328]';
  const modalBg = isTerminal ? 'bg-[#161b22] border border-[#30363d] text-[#e6edf3]' : 'bg-white border border-[#d0d7de] text-[#1f2328] shadow-2xl rounded-xl';

  return (
    <div className={`min-h-screen w-full relative flex flex-col ${bgClass} ${textClass} font-mono transition-colors duration-500 overflow-hidden`}>
      <GlobalStyles />
      {isTerminal && <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>}

      <div className={`w-full flex items-center justify-between py-1 px-3 text-[9px] font-mono border-b select-none ${isTerminal ? 'bg-[#0d1117] border-[#30363d] text-[#8b949e]' : 'bg-white border-[#d0d7de] text-gray-500'}`}>
        <div className="flex gap-3"><span className="flex items-center gap-1 font-bold text-[#3fb950]"><Terminal size={10}/> <Typewriter text="root@desnote:~" speed={30} triggerKey={refreshKey} /></span></div>
        <div className="flex gap-3 items-center"><span className="uppercase tracking-widest opacity-50 flex gap-1">FILTER: <Typewriter text={viewMode} speed={50} triggerKey={refreshKey} /></span><span className="flex items-center gap-1 text-[#58a6ff]"><GitBranch size={10}/> main</span><span className="flex items-center gap-1"><Clock size={10}/> {getFormattedTime()}</span></div>
      </div>

      <header className={`px-4 py-3 flex flex-col gap-3 z-10 sticky top-0 ${isTerminal ? 'bg-[#0d1117]/95 border-b border-[#30363d]' : 'bg-[#f6f8fa]/90 border-b border-[#d0d7de] backdrop-blur shadow-sm'}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">{isTerminal ? <Terminal className="text-[#e6edf3]" size={18} /> : <Github className="text-black" size={18} />}<h1 className="text-lg font-bold tracking-tight">DESNOTE <span className="text-[10px] font-normal opacity-50 ml-1 border px-1 rounded-sm">v8.4</span></h1></div>
            <div className="flex items-center gap-3">
              <button onClick={toggleSelectionMode} className={`px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all ${isSelectionMode ? (isTerminal ? 'bg-[#238636] border-[#3fb950] text-white' : 'bg-[#24292f] border-black text-white') : (isTerminal ? 'border-[#30363d] hover:border-[#8b949e]' : 'bg-white border-[#d0d7de] hover:border-[#b1bac4] shadow-sm')}`}>{isSelectionMode ? 'DONE' : '[ SELECT ]'}</button>
              <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded-md hover:bg-current hover:bg-opacity-10 transition-colors flash-active"><Settings size={16} /></button>
            </div>
        </div>
        {!searchQuery && (
          <div className="flex gap-2 w-full overflow-x-auto pb-1 scrollbar-none items-center">
             <button onClick={() => toggleViewMode('FOLDER')} className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-[10px] transition-all select-none flash-active ${viewMode === 'FOLDER' ? (isTerminal ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-[#24292f] border-black text-white') : (isTerminal ? 'bg-transparent border-[#30363d] text-[#8b949e]' : 'bg-white border-[#d0d7de] text-[#57606a] shadow-sm')}`}><Folder size={12}/> <span className="font-bold">FOLDERS</span> <span className="opacity-50">{folders.length}</span></button>
             <button onClick={() => toggleViewMode('NOTE')} className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-[10px] transition-all select-none flash-active ${viewMode === 'NOTE' ? (isTerminal ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-[#24292f] border-black text-white') : (isTerminal ? 'bg-transparent border-[#30363d] text-[#8b949e]' : 'bg-white border-[#d0d7de] text-[#57606a] shadow-sm')}`}><FileText size={12}/> <span className="font-bold">NOTES</span> <span className="opacity-50">{rootNotes.length}</span></button>
             <button onClick={() => toggleViewMode('ALL')} className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-[10px] transition-all select-none flash-active ${viewMode === 'ALL' ? (isTerminal ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-[#24292f] border-black text-white') : (isTerminal ? 'bg-transparent border-[#30363d] text-[#8b949e]' : 'bg-white border-[#d0d7de] text-[#57606a] shadow-sm')}`}><Disc size={12}/> <span className="font-bold">ALL</span></button>
          </div>
        )}
        <div className={`relative w-full group`}><div className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50 font-mono text-xs flex items-center gap-1`}><Command size={12}/> {">"}</div><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="grep..." className={`w-full py-2 pl-12 pr-4 text-xs bg-transparent border rounded-md outline-none transition-all font-mono ${isTerminal ? 'border-[#30363d] focus:border-[#58a6ff] placeholder-[#8b949e] bg-[#010409]' : 'border-[#d0d7de] bg-white focus:border-black placeholder-gray-400 shadow-sm'}`}/></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar z-0">
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-min dense`}>
            {combinedItems.filter(item => {
                const q = searchQuery.toLowerCase();
                if (item.type === 'FOLDER') return item.data.name.toLowerCase().includes(q);
                return item.data.title.toLowerCase().includes(q) || item.data.content.toLowerCase().includes(q);
            }).map((item) => (
                <div 
                    key={item.data.id} 
                    className={`
                        ${item.type === 'FOLDER' && item.data.isExpanded ? 'col-span-2 row-span-2' : 'col-span-1'} 
                        ${item.type === 'NOTE' && item.data.isPeeked ? 'col-span-2' : 'col-span-1'}
                        transition-all duration-300
                    `}
                >
                    {item.type === 'FOLDER' 
                        ? <FolderCard 
                            key={item.data.id} 
                            folder={item.data} 
                            isTerminal={isTerminal}
                            onToggle={() => toggleFolder(item.data.id)}
                            onOpenNote={(note) => setActiveNote({...note, parentId: item.data.id})}
                            onPeekNote={(noteId) => togglePeek(item.data.id, noteId)}
                            onAddNote={() => { const t = prompt("Name:"); if(t) setFolders(folders.map(f => f.id === item.data.id ? { ...f, notes: [...f.notes, { id: generateId(), title: t, content: '', isPeeked: false }] } : f)); }}
                            refreshKey={refreshKey}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(item.data.id)}
                            onToggleSelect={() => toggleSelectItem(item.data.id)}
                            selectedSubItems={selectedIds}
                            onToggleSubItem={toggleSelectItem}
                          />
                        : <NoteCard 
                            key={item.data.id} 
                            note={item.data} 
                            isTerminal={isTerminal}
                            onOpen={() => setActiveNote({...item.data, parentId: null})}
                            onPeek={() => togglePeek(null, item.data.id)}
                            refreshKey={refreshKey}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(item.data.id)}
                            onToggleSelect={() => toggleSelectItem(item.data.id)}
                          />
                    }
                </div>
            ))}
        </div>
        {combinedItems.length === 0 && <div className="flex flex-col items-center justify-center py-20 opacity-30 text-xs font-mono gap-4"><Terminal size={32} /><div>// EMPTY_VIEW: {viewMode}</div></div>}
      </main>

      {isSelectionMode && selectedIds.size > 0 && <SelectionBar isTerminal={isTerminal} selectedCount={selectedIds.size} onCancel={toggleSelectionMode} onDelete={handleBulkDelete} onMove={handleBulkMove} canMove={isOnlyNotesSelected} />}
      {!isSelectionMode && <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">{addMenuOpen && <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-auto"><button onClick={() => setCreateModal({isOpen: true, type: 'NOTE'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 ${isTerminal ? 'bg-[#238636] text-white' : 'bg-[#24292f] text-white'}`}><FileText size={16} /> Note</button><button onClick={() => setCreateModal({isOpen: true, type: 'FOLDER'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 ${isTerminal ? 'bg-[#1f6feb] text-white' : 'bg-white border border-[#d0d7de] text-gray-800'}`}><Folder size={16} /> Folder</button></div>}<button onClick={() => setAddMenuOpen(!addMenuOpen)} className={`pointer-events-auto h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${addMenuOpen ? 'rotate-45 bg-red-500' : ''} ${isTerminal ? 'bg-[#3fb950] text-black hover:bg-[#2ea043]' : 'bg-[#24292f] text-white hover:bg-black'}`}><Plus size={24} strokeWidth={3} /></button></div>}

      {createModal.isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 shadow-2xl border-t-4 ${isTerminal ? 'border-t-[#3fb950]' : 'border-t-black'}`}><h3 className="font-bold text-lg uppercase tracking-widest font-mono">NEW_{createModal.type}</h3><input autoFocus placeholder="Enter name..." className="p-3 bg-transparent border rounded outline-none focus:ring-2 ring-opacity-50 ring-current transition-all font-mono" onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(e.target.value) }} onBlur={(e) => handleCreate(e.target.value)} /><button onClick={() => setCreateModal({isOpen: false, type: null})} className="text-xs opacity-50 hover:opacity-100 mt-2 font-mono">CANCEL (Tap outside)</button></div></div>}
      <DeleteConfirmModal isOpen={deleteModal.isOpen} count={deleteModal.count} onConfirm={confirmBulkDelete} onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })} isTerminal={isTerminal} />
      {moveModal.isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 max-h-[80vh] font-mono`}><h3 className="font-bold border-b border-opacity-20 border-current pb-2">mv SOURCE TARGET</h3><div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1"><button onClick={() => executeBulkMove('ROOT')} className="p-3 text-left border border-opacity-20 border-current rounded font-bold flex items-center gap-2 hover:bg-current hover:bg-opacity-10 text-xs flash-active"><LayoutGrid size={14}/> ./root</button>{folders.map(f => (<button key={f.id} onClick={() => executeBulkMove(f.id)} className="p-3 text-left border border-opacity-20 border-current rounded flex items-center gap-2 hover:bg-current hover:bg-opacity-10 text-xs flash-active"><Folder size={14}/> {f.name}</button>))}</div><button onClick={() => setMoveModal({...moveModal, isOpen: false})} className="py-2 opacity-50 hover:opacity-100 text-xs flash-active">ABORT_OPERATION</button></div></div>}
      
      {/* --- SETTINGS MODAL --- */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-6 shadow-2xl font-mono`}>
                <div className="flex justify-between items-center border-b border-current border-opacity-20 pb-2">
                    <h3 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2"><Settings size={18}/> CONFIG</h3>
                    <button onClick={() => setSettingsOpen(false)}><X size={18}/></button>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Interface</div>
                    <button onClick={toggleTheme} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center justify-between hover:bg-current hover:bg-opacity-5 transition-all flash-active">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                            <span className="font-bold text-xs">Color Scheme</span>
                        </div>
                        <span className="text-[10px] opacity-60 uppercase bg-current bg-opacity-10 px-2 py-0.5 rounded">{theme}</span>
                    </button>
                    
                    <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2">Data Management</div>
                    
                    <button onClick={handleExport} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all flash-active">
                        <div className={`p-1.5 rounded-full ${isTerminal ? 'bg-[#3fb950]/20 text-[#3fb950]' : 'bg-[#24292f] text-white'}`}>
                            <Download size={16}/>
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-xs">Export Backup</div>
                            <div className="text-[9px] opacity-60">Save .json file</div>
                        </div>
                    </button>
                    
                    <button onClick={() => fileInputRef.current.click()} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all flash-active">
                        <div className={`p-1.5 rounded-full ${isTerminal ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-200 text-gray-700'}`}>
                            <Upload size={16}/>
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-xs">Import Data</div>
                            <div className="text-[9px] opacity-60">Restore from .json</div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                    </button>
                </div>
            </div>
        </div>
      )}

      <EditorModal note={activeNote} isTerminal={isTerminal} onClose={() => setActiveNote(null)} onSave={saveEditorContent} />
    </div>
  );
}
