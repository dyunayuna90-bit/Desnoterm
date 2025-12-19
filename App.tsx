import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FileText, ChevronDown, ChevronRight, Plus, 
  Settings, Moon, Sun, X, Save, Move, Trash2, Terminal, Github, 
  Search, LayoutGrid, AlertTriangle,
  Download, Upload, Cpu, GitBranch, Command, Clock, Disc, 
  CheckSquare, Square, Check, AlignLeft, Type, Hash, Maximize2
} from 'lucide-react';

// --- DATA INITIALIZATION ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getFormattedTime = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

const initialFolders = [
  {
    id: 'folder-1',
    name: '~/skripsi/sejarah_lisan_indonesia_final_draft_revisi_dosen_pembimbing',
    isExpanded: false,
    notes: [
      { id: 'note-1', title: 'wawancara_pak_hartono_mei_98_full_transcript.md', content: 'Narasumber utama untuk bab 3. Punya arsip foto 98. Beliau bilang kalau arsip itu harus dijaga baik-baik karena bukti sejarah yang otentik tidak bisa dipalsukan begitu saja.', isPeeked: false },
      { id: 'note-1b', title: 'catatan_lapangan_kramat_jati.txt', content: 'Observasi lapangan tanggal 12.', isPeeked: false },
      { id: 'note-1c', title: 'referensi_buku_sartono.bib', content: 'Kartodirdjo, Sartono. (1992).', isPeeked: false },
    ]
  },
  {
    id: 'folder-2',
    name: '~/kuliah/filsafat',
    isExpanded: true,
    notes: [
        { id: 'note-f1', title: 'stoikisme_intro_marcus_aurelius.txt', content: 'Fokus pada apa yang bisa dikendalikan. Abaikan opini orang lain. Hidup itu bukan tentang apa yang terjadi padamu, tapi bagaimana kamu bereaksi terhadapnya.', isPeeked: false }
    ]
  }
];

const initialRootNotes = [
  { id: 'root-1', title: 'ide_lukisan_cyberpunk_2077_jakarta_barat.txt', content: 'Konsep: Cyberpunk Jakarta. Canvas 40x60. Acrylic. Warna dominan neon pink dan cyan, tapi ada sentuhan kearifan lokal seperti gerobak nasgor yang terbang.', isPeeked: false },
  { id: 'root-2', title: 'grocery_list_unj_kantin_blok_m.list', content: '1. Rokok Ziga\n2. Kopi Hitam Kantin Blok M\n3. Kertas A3\n4. Cat Minyak\n5. Kuas nomor 12', isPeeked: false },
];

// --- SMART TYPEWRITER (CRASH PROOF) ---
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
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #58a6ff; }
    
    textarea, input { caret-color: #3fb950; caret-shape: block; }
    ::selection { background: rgba(63, 185, 80, 0.99); color: black; }

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
            ? <div className={`p-0.5 rounded ${isTerminal ? 'bg-[#3fb950] text-black' : 'bg-blue-600 text-white'}`}><Check size={14} strokeWidth={4} /></div>
            : <Square size={18} className={isTerminal ? 'text-[#8b949e]' : 'text-gray-400'} />
        }
    </div>
);

const NoteCard = ({ note, isTerminal, onOpen, onPeek, refreshKey, isSelectionMode, isSelected, onToggleSelect }) => {
  const cardClass = isTerminal 
    ? `bg-[#0d1117] border ${isSelected ? 'border-[#3fb950]' : 'border-[#30363d]'} hover:border-[#8b949e]` 
    : `bg-white border ${isSelected ? 'border-blue-500' : 'border-[#d0d7de]'} hover:border-blue-300 shadow-sm`;
  
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
        className={`relative flex flex-col ${cardClass} h-auto overflow-hidden group w-full rounded-sm transition-all duration-200 ${isSelected ? 'translate-x-1' : ''}`}
        onClick={handleCardClick}
    >
       <div className={`flex items-start p-3 border-b ${isTerminal ? 'bg-[#161b22] border-[#30363d]' : 'bg-gray-50 border-[#d0d7de]'} border-opacity-50 min-h-[60px] flash-active cursor-pointer`}>
          {isSelectionMode && <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} isTerminal={isTerminal} />}
          <div className="flex-1 overflow-hidden">
             <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className={isTerminal ? 'text-[#3fb950]' : 'text-blue-500'} />
                <span className={`font-bold text-[10px] font-mono uppercase tracking-wide opacity-50`}>DOC</span>
             </div>
             <span className={`font-bold text-xs font-mono leading-snug line-clamp-3 ${isTerminal ? 'text-[#e6edf3]' : 'text-gray-800'}`}>
                <Typewriter text={note.title} speed={10} triggerKey={refreshKey} />
             </span>
          </div>
       </div>

       {note.isPeeked && (
           <div className="p-3 cursor-pointer flex-1 hover:bg-current hover:bg-opacity-5 transition-colors flash-active" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              <div className={`text-[10px] leading-relaxed font-mono ${isTerminal ? 'text-[#8b949e]' : 'text-gray-600'}`}>
                  <div className={`pl-2 py-1 border-l-2 ${isTerminal ? 'border-[#3fb950] text-[#e6edf3]' : 'border-blue-500 text-gray-900'}`}>
                    <Typewriter text={getPeekContent(note.content)} speed={5} triggerKey={note.isPeeked} />
                  </div>
              </div>
           </div>
       )}

       {!isSelectionMode && (
           <button 
             onClick={(e) => { e.stopPropagation(); onPeek(); }}
             className={`w-full py-1.5 flex items-center justify-center border-t ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'} border-opacity-50 text-[9px] font-bold uppercase tracking-wider transition-colors opacity-50 hover:opacity-100 bg-transparent flash-active z-10`}
           >
              {note.isPeeked ? '[ CLOSE_STREAM ]' : '[ SCAN_DATA ]'}
           </button>
       )}
    </div>
  );
};

const FolderCard = ({ folder, isTerminal, onToggle, onMoveNote, onDeleteNote, onOpenNote, onPeekNote, onAddNote, refreshKey, isSelectionMode, isSelected, onToggleSelect, selectedSubItems = new Set(), onToggleSubItem }) => {
  const cardClass = isTerminal 
    ? `bg-[#0d1117] border ${isSelected ? 'border-[#3fb950]' : 'border-[#30363d]'} hover:border-[#8b949e]` 
    : `bg-white border ${isSelected ? 'border-blue-500' : 'border-[#d0d7de]'} hover:border-blue-300 shadow-sm`;

  const handleHeaderClick = () => {
      if (isSelectionMode) onToggleSelect();
      else onToggle();
  };

  return (
    <div className={`relative flex flex-col w-full rounded-sm transition-all duration-200 ${cardClass}`}>
      <div 
        className={`p-3 flex items-start cursor-pointer flash-active ${folder.isExpanded ? (isTerminal ? 'border-b border-[#30363d]' : 'border-b border-[#d0d7de]') : ''}`}
        onClick={handleHeaderClick}
      >
        {isSelectionMode && <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} isTerminal={isTerminal} />}

        <div className="flex-1 flex items-start gap-2 overflow-hidden">
           <Folder size={16} className={`mt-0.5 ${isTerminal ? 'text-[#3fb950]' : 'text-yellow-500'}`} />
           <div className="flex flex-col gap-1 w-full">
             <span className={`font-bold text-xs font-mono leading-snug line-clamp-3 ${isTerminal ? 'text-[#e6edf3]' : 'text-gray-800'}`}>
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
        <div className="p-2 space-y-2 origin-top border-l-2 border-opacity-10 ml-2 my-2 border-current">
            {/* GRID LAYOUT FOR FOLDER CONTENTS - 2 COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {folder.notes.length === 0 ? <div className="text-center opacity-30 text-[10px] py-1 font-mono col-span-full">// Empty Folder</div> : 
                folder.notes.map(note => (
                <div key={note.id} className={`flex flex-col h-full ${isTerminal ? 'bg-[#161b22] border border-[#30363d]' : 'bg-gray-50 border border-gray-100'} rounded-sm overflow-hidden transition-transform active:scale-[0.99] ${isSelectionMode && selectedSubItems.has(note.id) ? (isTerminal ? 'border-[#3fb950]' : 'border-blue-500') : ''}`}>
                    
                    {/* SUB-ITEM HEADER */}
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
                                    ? <Check size={12} className={isTerminal ? 'text-[#3fb950]' : 'text-blue-600'} /> 
                                    : <Square size={12} className="opacity-30" />}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden flash-active">
                        <span className="text-[10px] font-bold truncate block hover:underline font-mono">
                            <Typewriter text={note.title} speed={10} delay={50} />
                        </span>
                        </div>
                    </div>

                    {/* SUB-ITEM PEEK */}
                    {!isSelectionMode && note.isPeeked && (
                    <div 
                        className={`mx-2 mb-2 mt-1 pl-2 py-1 border-l-2 text-[9px] font-mono whitespace-pre-wrap cursor-pointer flex-1 ${isTerminal ? 'border-[#3fb950] text-[#e6edf3]' : 'border-blue-500 text-gray-900'}`}
                        onClick={() => onOpenNote(note)}
                    >
                        <Typewriter text={note.content ? note.content.substring(0, 100) + "..." : "Empty..."} speed={5} triggerKey={note.isPeeked} />
                    </div>
                    )}
                    {!isSelectionMode && (
                        <button onClick={() => onPeekNote(note.id)} className="w-full py-0.5 bg-black/5 hover:bg-black/10 text-[8px] text-center opacity-40 uppercase tracking-widest hover:opacity-100 transition-opacity flash-active mt-auto">
                        {note.isPeeked ? '[ - ]' : '[ + ]'}
                        </button>
                    )}
                </div>
                ))}
            </div>
            
            {!isSelectionMode && (
                <button 
                    onClick={onAddNote}
                    className="w-full py-2 text-[10px] text-center opacity-40 hover:opacity-100 border border-dashed border-current rounded flex justify-center items-center gap-1 hover:bg-current hover:bg-opacity-5 transition-all font-mono flash-active mt-2"
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
  
  // Dynamic Line Numbers (Min 50)
  const lineCount = Math.max(stats.lines, 50);
  const linesArray = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isTerminal ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-white text-[#24292f]'} font-mono animate-in slide-in-from-bottom-5 fade-in duration-200`}>
      {/* EDITOR HEADER (STATS MOVED HERE) */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center p-2 px-4 border-b gap-2 ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
        <div className="flex flex-col w-full md:w-auto overflow-hidden">
            <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isTerminal ? 'bg-[#238636] text-white' : 'bg-blue-600 text-white'}`}>EDIT</span>
                <span className="font-bold text-xs truncate opacity-70">{note.title}</span>
            </div>
            {/* STATS IN HEADER */}
            <div className={`flex gap-3 mt-1 text-[9px] opacity-50 select-none`}>
                <span className="flex items-center gap-1"><AlignLeft size={8}/> {stats.lines}L</span>
                <span className="flex items-center gap-1"><Hash size={8}/> {stats.words}W</span>
                <span className="flex items-center gap-1"><Type size={8}/> {stats.chars}C</span>
            </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto justify-end">
            <button onClick={onClose} className={`px-3 py-1.5 text-xs font-bold border rounded flex items-center gap-2 ${isTerminal ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'} transition-colors flash-active`}>
                <Save size={12} /> SAVE
            </button>
        </div>
      </div>

      {/* EDITOR BODY WITH DYNAMIC LINE NUMBERS */}
      <div className="flex-1 flex overflow-hidden relative">
          {/* Gutter */}
          <div className={`w-10 flex flex-col items-end pt-4 pr-2 text-[10px] opacity-30 select-none border-r overflow-hidden ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
              {/* Render only visible range logic is complex in React without virtualization, 
                  but for < 5000 lines, mapping is okay. */}
              {linesArray.map((i) => (
                  <div key={i} className="leading-relaxed h-[20px]">{i}</div> 
                  // h-[20px] must match textarea line-height
              ))}
          </div>
          
          <textarea 
            value={note.content}
            onChange={(e) => onSave(e.target.value)}
            className={`flex-1 w-full p-4 bg-transparent outline-none resize-none text-xs font-mono custom-scrollbar leading-relaxed`}
            // leading-relaxed in Tailwind is usually 1.625, adjust manually if needed to match gutter
            style={{ lineHeight: '20px' }} 
            placeholder={isTerminal ? "// Start coding..." : "Start writing..."}
            spellCheck={false}
            autoFocus
          />
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
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 px-4 rounded-full shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 ${isTerminal ? 'bg-[#161b22] border border-[#30363d] text-white' : 'bg-white border border-gray-200 text-black'}`}>
        <div className="font-bold text-xs pr-2 border-r border-current border-opacity-20">{selectedCount} Selected</div>
        <button onClick={onDelete} className="p-2 hover:text-red-500 transition-colors flex flex-col items-center gap-0.5"><Trash2 size={16} /></button>
        {canMove && <button onClick={onMove} className="p-2 hover:text-yellow-500 transition-colors flex flex-col items-center gap-0.5"><Move size={16} /></button>}
        <button onClick={onCancel} className="p-2 opacity-50 hover:opacity-100 border-l border-current border-opacity-20 pl-3 ml-1"><X size={16} /></button>
    </div>
);

// --- MAIN APP COMPONENT ---

export default function DesnoteAppV7() {
  const [folders, setFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('desnote_folders_v7')) || initialFolders; } catch { return initialFolders; }
  });
  const [rootNotes, setRootNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('desnote_root_v7')) || initialRootNotes; } catch { return initialRootNotes; }
  });

  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null); 
  const [moveModal, setMoveModal] = useState({ isOpen: false, noteId: null, sourceId: null, isFromRoot: false, multiSelect: false }); 
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [createModal, setCreateModal] = useState({ isOpen: false, type: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, count: 0 }); 
  const [columnCount, setColumnCount] = useState(2);
  const [viewMode, setViewMode] = useState('ALL'); 
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set()); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('desnote_folders_v7', JSON.stringify(folders));
    localStorage.setItem('desnote_root_v7', JSON.stringify(rootNotes));
  }, [folders, rootNotes]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) setColumnCount(4);
      else if (window.innerWidth >= 800) setColumnCount(3);
      else setColumnCount(2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSelectionMode = () => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); };
  const toggleSelectItem = (id) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedIds(newSet);
  };
  const isOnlyNotesSelected = useMemo(() => {
      if (selectedIds.size === 0) return false;
      const hasFolder = Array.from(selectedIds).some(id => folders.find(f => f.id === id));
      return !hasFolder;
  }, [selectedIds, folders]);

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
    else if (createModal.type === 'NOTE') setRootNotes([...rootNotes, { id: generateId(), title: name, content: '', isPeeked: false }]);
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
      let notesToMove = [];
      notesToMove = [...notesToMove, ...rootNotes.filter(n => selectedIds.has(n.id))];
      folders.forEach(f => { notesToMove = [...notesToMove, ...f.notes.filter(n => selectedIds.has(n.id))]; });
      setRootNotes(prev => prev.filter(n => !selectedIds.has(n.id)));
      const cleanFolders = folders.map(f => ({ ...f, notes: f.notes.filter(n => !selectedIds.has(n.id)) }));
      notesToMove = notesToMove.map(n => ({...n, isPeeked: false}));
      if (targetFolderId === 'ROOT') { setRootNotes(prev => [...prev, ...notesToMove]); setFolders(cleanFolders); }
      else { setFolders(cleanFolders.map(f => f.id === targetFolderId ? { ...f, notes: [...f.notes, ...notesToMove] } : f)); }
      setMoveModal({ isOpen: false }); setIsSelectionMode(false); setSelectedIds(new Set()); setRefreshKey(prev => prev + 1);
  };

  const openEditor = (note, parentId = null) => setActiveNote({ ...note, parentId }); 
  const saveEditorContent = (content) => {
    if (!activeNote) return;
    if (activeNote.parentId === null) setRootNotes(rootNotes.map(n => n.id === activeNote.id ? { ...n, content } : n));
    else setFolders(folders.map(f => f.id !== activeNote.parentId ? f : { ...f, notes: f.notes.map(n => n.id === activeNote.id ? { ...n, content } : n) }));
    setActiveNote(prev => ({ ...prev, content }));
  };

  const executeMove = (targetId) => {
    const { sourceId, noteId, isFromRoot } = moveModal;
    let noteToMove = isFromRoot ? rootNotes.find(n => n.id === noteId) : folders.find(f => f.id === sourceId).notes.find(n => n.id === noteId);
    if (isFromRoot) setRootNotes(rootNotes.filter(n => n.id !== noteId));
    else setFolders(folders.map(f => f.id === sourceId ? { ...f, notes: f.notes.filter(n => n.id !== noteId) } : f));
    noteToMove = { ...noteToMove, isPeeked: false }; 
    if (targetId === 'ROOT') setRootNotes(prev => [...prev, noteToMove]);
    else setFolders(prev => prev.map(f => f.id === targetId ? { ...f, notes: [...f.notes, noteToMove] } : f));
    setMoveModal({ isOpen: false, noteId: null, sourceId: null, isFromRoot: false });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version: "v8", timestamp: new Date().toISOString(), folders, rootNotes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `desnote_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.folders || !data.rootNotes) { alert("Invalid Format"); return; }
        if (confirm("Restore data?")) { setFolders(data.folders); setRootNotes(data.rootNotes); setSettingsOpen(false); setRefreshKey(prev => prev + 1); }
      } catch (err) { alert("Failed to read file."); }
    };
    reader.readAsText(file); event.target.value = null; 
  };

  const combinedItems = useMemo(() => {
    let items = [];
    if (viewMode === 'ALL' || viewMode === 'FOLDER') items = [...items, ...folders.map(f => ({ type: 'FOLDER', data: f }))];
    if (viewMode === 'ALL' || viewMode === 'NOTE') items = [...items, ...rootNotes.map(n => ({ type: 'NOTE', data: n }))];
    return items;
  }, [folders, rootNotes, viewMode]);

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    let itemsToRender = combinedItems;
    if (searchQuery) itemsToRender = combinedItems.filter(item => item.type === 'FOLDER' ? item.data.name.toLowerCase().includes(searchQuery.toLowerCase()) : (item.data.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.data.content.toLowerCase().includes(searchQuery.toLowerCase())));
    itemsToRender.forEach((item, index) => cols[index % columnCount].push(item));
    return cols;
  }, [combinedItems, columnCount, searchQuery]);

  return (
    <div className={`min-h-screen w-full relative flex flex-col ${theme === 'dark' ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-[#f6f8fa] text-[#24292f]'} font-mono transition-colors duration-500 overflow-hidden`}>
      <GlobalStyles />
      {theme === 'dark' && <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>}
      <div className={`w-full flex items-center justify-between py-1 px-3 text-[9px] font-mono border-b select-none ${theme === 'dark' ? 'bg-[#0d1117] border-[#30363d] text-[#8b949e]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        <div className="flex gap-3"><span className="flex items-center gap-1 font-bold text-[#3fb950]"><Terminal size={10}/> <Typewriter text="root@desnote:~" speed={30} triggerKey={refreshKey} /></span><span className="flex items-center gap-1 opacity-50"><Cpu size={10}/> 12%</span></div>
        <div className="flex gap-3 items-center"><span className="uppercase tracking-widest opacity-50 flex gap-1">FILTER: <Typewriter text={viewMode} speed={50} triggerKey={refreshKey} /></span><span className="flex items-center gap-1 text-[#58a6ff]"><GitBranch size={10}/> main</span><span className="flex items-center gap-1"><Clock size={10}/> {getFormattedTime()}</span></div>
      </div>
      <header className={`px-4 py-3 flex flex-col gap-3 z-10 sticky top-0 ${theme === 'dark' ? 'bg-[#0d1117]/95 border-b border-[#30363d]' : 'bg-white/90 backdrop-blur shadow-sm'}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">{theme === 'dark' ? <Terminal className="text-[#e6edf3]" size={18} /> : <Github className="text-black" size={18} />}<h1 className="text-lg font-bold tracking-tight">DESNOTE <span className="text-[10px] font-normal opacity-50 ml-1 border px-1 rounded-sm">v8.2</span></h1></div>
            <div className="flex items-center gap-3"><button onClick={toggleSelectionMode} className={`px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all ${isSelectionMode ? (theme === 'dark' ? 'bg-[#238636] border-[#3fb950] text-white' : 'bg-blue-600 border-blue-600 text-white') : (theme === 'dark' ? 'border-[#30363d] hover:border-[#8b949e]' : 'border-gray-300 hover:border-gray-400')}`}>{isSelectionMode ? 'DONE' : '[ SELECT ]'}</button><button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded-md hover:bg-current hover:bg-opacity-10 transition-colors flash-active"><Settings size={16} /></button></div>
        </div>
        {!searchQuery && (
          <div className="flex gap-2 w-full overflow-x-auto pb-1 scrollbar-none items-center">
             <button onClick={() => toggleViewMode('FOLDER')} className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-[10px] font-mono transition-all select-none flash-active ${viewMode === 'FOLDER' ? (theme === 'dark' ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-blue-50 border-blue-400 text-blue-700') : (theme === 'dark' ? 'bg-transparent border-[#30363d] text-[#8b949e]' : 'bg-white border-gray-200 text-gray-500')}`}><Folder size={12}/> <span className="font-bold">FOLDERS</span> <span className="opacity-50">{folders.length}</span></button>
             <button onClick={() => toggleViewMode('NOTE')} className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-[10px] font-mono transition-all select-none flash-active ${viewMode === 'NOTE' ? (theme === 'dark' ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-blue-50 border-blue-400 text-blue-700') : (theme === 'dark' ? 'bg-transparent border-[#30363d] text-[#8b949e]' : 'bg-white border-gray-200 text-gray-500')}`}><FileText size={12}/> <span className="font-bold">NOTES</span> <span className="opacity-50">{rootNotes.length}</span></button>
             <button onClick={() => toggleViewMode('ALL')} className={`flex items-center justify-center gap-2 px-3 py-1 rounded border text-[10px] font-mono transition-all select-none flash-active ${viewMode === 'ALL' ? (theme === 'dark' ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-blue-50 border-blue-400 text-blue-700') : (theme === 'dark' ? 'bg-transparent border-[#30363d] text-[#8b949e]' : 'bg-white border-gray-200 text-gray-500')}`}><Disc size={12}/> <span className="font-bold">ALL</span></button>
          </div>
        )}
        <div className={`relative w-full group`}><div className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50 font-mono text-xs flex items-center gap-1`}><Command size={12}/> {">"}</div><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="grep..." className={`w-full py-2 pl-12 pr-4 text-xs bg-transparent border rounded-md outline-none transition-all font-mono ${theme === 'dark' ? 'border-[#30363d] focus:border-[#58a6ff] placeholder-[#8b949e] bg-[#010409]' : 'border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500'}`}/></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar z-0">
        <div className="flex gap-4 items-start w-full">
            {columns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-0">
                    {col.map((item) => (
                        item.type === 'FOLDER' 
                            ? <FolderCard key={item.data.id} folder={item.data} isTerminal={theme === 'dark'} onToggle={() => toggleFolder(item.data.id)} onOpenNote={(note) => openEditor(note, item.data.id)} onPeekNote={(noteId) => togglePeek(item.data.id, noteId)} onAddNote={() => { const title = prompt("New note name:"); if(title) setFolders(folders.map(f => f.id === item.data.id ? { ...f, notes: [...f.notes, { id: generateId(), title, content: '', isPeeked: false }] } : f)); }} refreshKey={refreshKey} isSelectionMode={isSelectionMode} isSelected={selectedIds.has(item.data.id)} onToggleSelect={() => toggleSelectItem(item.data.id)} selectedSubItems={selectedIds} onToggleSubItem={toggleSelectItem} />
                            : <NoteCard key={item.data.id} note={item.data} isTerminal={theme === 'dark'} onOpen={() => openEditor(item.data, null)} onPeek={() => togglePeek(null, item.data.id)} refreshKey={refreshKey} isSelectionMode={isSelectionMode} isSelected={selectedIds.has(item.data.id)} onToggleSelect={() => toggleSelectItem(item.data.id)} />
                    ))}
                </div>
            ))}
        </div>
        {combinedItems.length === 0 && <div className="flex flex-col items-center justify-center py-20 opacity-30 text-xs font-mono gap-4"><Terminal size={32} /><div>// EMPTY_VIEW: {viewMode}</div></div>}
      </main>
      {isSelectionMode && selectedIds.size > 0 && <SelectionBar isTerminal={theme === 'dark'} selectedCount={selectedIds.size} onCancel={toggleSelectionMode} onDelete={handleBulkDelete} onMove={handleBulkMove} canMove={isOnlyNotesSelected} />}
      {!isSelectionMode && <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">{addMenuOpen && <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-auto"><button onClick={() => setCreateModal({isOpen: true, type: 'NOTE'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 ${theme === 'dark' ? 'bg-[#238636] text-white' : 'bg-white text-gray-800'}`}><FileText size={16} /> Note</button><button onClick={() => setCreateModal({isOpen: true, type: 'FOLDER'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 ${theme === 'dark' ? 'bg-[#1f6feb] text-white' : 'bg-white text-gray-800'}`}><Folder size={16} /> Folder</button></div>}<button onClick={() => setAddMenuOpen(!addMenuOpen)} className={`pointer-events-auto h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${addMenuOpen ? 'rotate-45 bg-red-500' : ''} ${theme === 'dark' ? 'bg-[#3fb950] text-black hover:bg-[#2ea043]' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Plus size={24} strokeWidth={3} /></button></div>}
      {createModal.isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 shadow-2xl border-t-4 ${theme === 'dark' ? 'border-t-[#3fb950]' : 'border-t-blue-500'}`}><h3 className="font-bold text-lg uppercase tracking-widest font-mono">NEW_{createModal.type}</h3><input autoFocus placeholder="Enter name..." className="p-3 bg-transparent border rounded outline-none focus:ring-2 ring-opacity-50 ring-current transition-all font-mono" onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(e.target.value) }} onBlur={(e) => handleCreate(e.target.value)} /><button onClick={() => setCreateModal({isOpen: false, type: null})} className="text-xs opacity-50 hover:opacity-100 mt-2 font-mono">CANCEL (Tap outside)</button></div></div>}
      <DeleteConfirmModal isOpen={deleteModal.isOpen} count={deleteModal.count} onConfirm={confirmBulkDelete} onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })} isTerminal={theme === 'dark'} />
      {settingsOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-6 shadow-2xl font-mono`}><div className="flex justify-between items-center border-b border-current border-opacity-20 pb-2"><h3 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2"><Settings size={18}/> CONFIG</h3><button onClick={() => setSettingsOpen(false)}><X size={18}/></button></div><div className="flex flex-col gap-3"><div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Interface</div><button onClick={toggleTheme} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center justify-between hover:bg-current hover:bg-opacity-5 transition-all flash-active"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}<span className="font-bold text-xs">Color Scheme</span></div><span className="text-[10px] opacity-60 uppercase bg-current bg-opacity-10 px-2 py-0.5 rounded">{theme}</span></button><div className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2">I/O Operations</div><button onClick={handleExport} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all flash-active"><div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-[#3fb950]/20 text-[#3fb950]' : 'bg-blue-100 text-blue-600'}`}><Download size={16}/></div><div className="text-left flex-1"><div className="font-bold text-xs">Export Backup</div><div className="text-[9px] opacity-60">Save .json file</div></div></button><button onClick={() => fileInputRef.current.click()} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all flash-active"><div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-orange-100 text-orange-600'}`}><Upload size={16}/></div><div className="text-left flex-1"><div className="font-bold text-xs">Import Data</div><div className="text-[9px] opacity-60">Restore from .json</div></div><input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" /></button></div></div></div>}
      {moveModal.isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 max-h-[80vh] font-mono`}><h3 className="font-bold border-b border-opacity-20 border-current pb-2">mv SOURCE TARGET</h3><div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1"><button onClick={() => executeBulkMove('ROOT')} className="p-3 text-left border border-opacity-20 border-current rounded font-bold flex items-center gap-2 hover:bg-current hover:bg-opacity-10 text-xs flash-active"><LayoutGrid size={14}/> ./root</button>{folders.map(f => (<button key={f.id} onClick={() => executeBulkMove(f.id)} className="p-3 text-left border border-opacity-20 border-current rounded flex items-center gap-2 hover:bg-current hover:bg-opacity-10 text-xs flash-active"><Folder size={14}/> {f.name}</button>))}</div><button onClick={() => setMoveModal({...moveModal, isOpen: false})} className="py-2 opacity-50 hover:opacity-100 text-xs flash-active">ABORT_OPERATION</button></div></div>}
      <EditorModal note={activeNote} isTerminal={theme === 'dark'} onClose={() => setActiveNote(null)} onSave={saveEditorContent} />
    </div>
  );
}
