import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FileText, ChevronDown, ChevronRight, Plus, 
  Settings, Moon, Sun, X, Save, MoreVertical, 
  ArrowRightLeft, Trash2, Terminal, Github, 
  CornerDownRight, Search, LayoutGrid, File, Edit3, Move, Eye, EyeOff, AlertTriangle,
  Download, Upload, Cpu, Activity, HardDrive, Clock, Zap, Layers, Monitor, GitBranch, Command
} from 'lucide-react';

// --- UTILS & DATA ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getFormattedTime = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

const initialFolders = [
  {
    id: 'folder-1',
    name: '~/skripsi/sejarah_lisan',
    isExpanded: false,
    notes: [
      { id: 'note-1', title: 'wawancara_pak_hartono.md', content: 'Narasumber utama untuk bab 3. Punya arsip foto 98. Beliau bilang kalau arsip itu harus dijaga baik-baik karena bukti sejarah yang otentik tidak bisa dipalsukan begitu saja.', isPeeked: false },
    ]
  },
  {
    id: 'folder-2',
    name: '~/kuliah/filsafat',
    isExpanded: true,
    notes: [
        { id: 'note-f1', title: 'stoikisme_intro.txt', content: 'Fokus pada apa yang bisa dikendalikan. Abaikan opini orang lain. Hidup itu bukan tentang apa yang terjadi padamu, tapi bagaimana kamu bereaksi terhadapnya.', isPeeked: false }
    ]
  }
];

const initialRootNotes = [
  { id: 'root-1', title: 'ide_lukisan.txt', content: 'Konsep: Cyberpunk Jakarta. Canvas 40x60. Acrylic. Warna dominan neon pink dan cyan, tapi ada sentuhan kearifan lokal seperti gerobak nasgor yang terbang.', isPeeked: false },
  { id: 'root-2', title: 'grocery_unj.list', content: '1. Rokok Ziga\n2. Kopi Hitam Kantin Blok M\n3. Kertas A3\n4. Cat Minyak\n5. Kuas nomor 12', isPeeked: false },
];

// --- SUB-COMPONENTS ---

const SystemStatus = ({ isTerminal, viewMode }) => (
  <div className={`w-full flex items-center justify-between py-1 px-3 text-[9px] font-mono border-b ${isTerminal ? 'bg-[#0d1117] border-[#30363d] text-[#8b949e]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
    <div className="flex gap-3">
      <span className="flex items-center gap-1"><Terminal size={10}/> bash --login</span>
      <span className="flex items-center gap-1 opacity-50"><Cpu size={10}/> 12%</span>
    </div>
    <div className="flex gap-3 items-center">
       <span className="uppercase tracking-widest opacity-50">VIEW: {viewMode}</span>
       <span className="flex items-center gap-1 text-[#3fb950]"><GitBranch size={10}/> main</span>
       <span className="flex items-center gap-1"><Clock size={10}/> {getFormattedTime()}</span>
    </div>
  </div>
);

// REFACTORED: Compact Stats Button (GitHub Style)
const StatsButton = ({ icon: Icon, label, value, isTerminal, colorClass, onClick, isActive }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-md border text-[11px] font-mono transition-all select-none
      ${isActive 
        ? (isTerminal ? 'bg-[#1f242e] border-[#3fb950] text-[#e6edf3]' : 'bg-blue-50 border-blue-400 text-blue-700') 
        : (isTerminal ? 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-[#c9d1d9]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700')
      }
    `}
  >
     <div className={`flex items-center gap-1.5 ${isActive ? colorClass : ''}`}>
        <Icon size={14} />
        <span className="font-bold tracking-tight">{label}</span>
     </div>
     {value !== undefined && (
       <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isTerminal ? 'bg-[#30363d] text-[#c9d1d9]' : 'bg-gray-100 text-gray-600'}`}>
          {value}
       </span>
     )}
  </button>
);

const ActionButtons = ({ onMove, onDelete, colorClass }) => (
  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
    <button onClick={onMove} className={`p-1 rounded hover:bg-current hover:bg-opacity-10 ${colorClass} opacity-60 hover:opacity-100 transition-opacity`}>
      <Move size={12} />
    </button>
    <button onClick={onDelete} className={`p-1 rounded hover:bg-red-500/10 text-red-500 opacity-60 hover:opacity-100 transition-opacity`}>
      <Trash2 size={12} />
    </button>
  </div>
);

const NoteCard = ({ note, folderId, isTerminal, onMove, onDelete, onOpen, onPeek }) => {
  const cardClass = isTerminal 
    ? 'bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e]' 
    : 'bg-white border border-[#d0d7de] hover:border-blue-300 shadow-sm';
  
  const getPeekContent = (text) => {
    if (!text) return "Empty...";
    if (text.length <= 150) return text;
    return text.substring(0, 150) + "...";
  };

  return (
    <div className={`relative flex flex-col ${cardClass} h-auto overflow-hidden group w-full rounded-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}>
       <div className={`flex justify-between items-center p-2 px-3 ${isTerminal ? 'bg-[#161b22]' : 'bg-gray-50'} border-b ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'} border-opacity-50`}>
          <div className="flex items-center gap-2 overflow-hidden">
             <FileText size={14} className={isTerminal ? 'text-[#3fb950]' : 'text-blue-500'} />
             <span className="font-bold text-xs truncate font-mono">{note.title}</span>
          </div>
          <ActionButtons 
            onMove={(e) => { e.stopPropagation(); onMove(); }}
            onDelete={(e) => { e.stopPropagation(); onDelete(); }}
            colorClass={isTerminal ? 'text-yellow-500' : 'text-gray-600'}
          />
       </div>
       <div 
         className="p-3 cursor-pointer min-h-[50px] flex-1 hover:bg-current hover:bg-opacity-5 transition-colors"
         onClick={onOpen}
       >
          <div className={`text-[11px] leading-relaxed font-mono ${isTerminal ? 'text-[#8b949e]' : 'text-gray-600'}`}>
            {note.isPeeked 
              ? (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                    {getPeekContent(note.content)}
                  </div>
                )
              : (
                  <div className="line-clamp-3 opacity-70">
                     {note.content || <span className="italic opacity-50">// No content...</span>}
                  </div>
                )
            }
          </div>
       </div>
       <button 
         onClick={(e) => { e.stopPropagation(); onPeek(); }}
         className={`w-full py-1.5 flex items-center justify-center border-t ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'} border-opacity-50 text-[9px] font-bold uppercase tracking-wider hover:bg-current hover:bg-opacity-10 transition-colors opacity-60 hover:opacity-100`}
       >
          {note.isPeeked ? 'CLOSE_PEEK' : 'PEEK_CONTENT'}
       </button>
    </div>
  );
};

const FolderCard = ({ folder, isTerminal, onToggle, onDelete, onMoveNote, onDeleteNote, onOpenNote, onPeekNote, onAddNote }) => {
  const cardClass = isTerminal 
    ? 'bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e]' 
    : 'bg-white border border-[#d0d7de] hover:border-blue-300 shadow-sm';

  const getPeekContent = (text) => {
    if (!text) return "Empty...";
    if (text.length <= 100) return text;
    return text.substring(0, 100) + "...";
  };

  return (
    <div className={`relative flex flex-col ${cardClass} w-full rounded-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}>
      <div 
        className={`p-2 px-3 flex items-center justify-between cursor-pointer ${folder.isExpanded ? (isTerminal ? 'border-b border-[#30363d]' : 'border-b border-[#d0d7de]') : ''}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 overflow-hidden">
           <Folder size={16} className={isTerminal ? 'text-[#3fb950]' : 'text-yellow-500'} />
           <div className="flex items-center gap-2 overflow-hidden">
             <span className="font-bold text-xs truncate font-mono">{folder.name}</span>
             {!folder.isExpanded && <span className="text-[9px] opacity-50 font-mono px-1.5 py-0.5 rounded bg-current bg-opacity-10">{folder.notes.length}</span>}
           </div>
        </div>
        <div className="flex items-center">
            {folder.isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            <button onClick={(e) => {e.stopPropagation(); onDelete();}} className="ml-2 p-1 hover:text-red-500 opacity-30 hover:opacity-100 transition-opacity">
                <Trash2 size={12}/>
            </button>
        </div>
      </div>

      {folder.isExpanded && (
        <div className="p-2 space-y-2 animate-in slide-in-from-top-4 fade-in duration-300 ease-out origin-top">
            {folder.notes.length === 0 ? <div className="text-center opacity-30 text-[10px] py-1 font-mono">// Empty Folder</div> : 
            folder.notes.map(note => (
               <div key={note.id} className={`flex flex-col ${isTerminal ? 'bg-[#161b22] border border-[#30363d]' : 'bg-gray-50 border border-gray-100'} rounded-sm overflow-hidden transition-transform active:scale-[0.99]`}>
                 <div className="flex items-center justify-between p-1.5 pl-3 border-b border-transparent hover:border-current hover:border-opacity-10">
                    <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => onOpenNote(note)}>
                       <span className="text-[11px] font-bold truncate block hover:underline font-mono">{note.title}</span>
                    </div>
                    <div className="flex gap-1 pl-2">
                      <button onClick={() => onMoveNote(note.id)} className="hover:text-yellow-500 opacity-60 hover:opacity-100 p-1"><Move size={10}/></button>
                      <button onClick={() => onDeleteNote(note.id)} className="hover:text-red-500 opacity-60 hover:opacity-100 p-1"><Trash2 size={10}/></button>
                    </div>
                 </div>
                 {note.isPeeked && (
                   <div className="p-2 bg-black/5 cursor-text text-[10px] opacity-70 whitespace-pre-wrap font-mono animate-in slide-in-from-top-2 fade-in duration-200">
                     {getPeekContent(note.content)}
                   </div>
                 )}
                 <button onClick={() => onPeekNote(note.id)} className="w-full py-0.5 bg-black/5 hover:bg-black/10 text-[8px] text-center opacity-40 uppercase tracking-widest hover:opacity-100 transition-opacity">
                   {note.isPeeked ? 'Collapse' : 'Preview'}
                 </button>
               </div>
            ))}
            <button 
                onClick={onAddNote}
                className="w-full py-1.5 text-[10px] text-center opacity-50 hover:opacity-100 border border-dashed border-current rounded flex justify-center items-center gap-1 hover:bg-current hover:bg-opacity-5 transition-all font-mono"
            >
                <Plus size={10}/> Add_File
            </button>
        </div>
      )}
    </div>
  );
};

const EditorModal = ({ note, isTerminal, onClose, onSave }) => {
  if (!note) return null;
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isTerminal ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-white text-[#24292f]'} font-mono animate-in slide-in-from-bottom-10 fade-in duration-300`}>
      <div className={`flex justify-between items-center p-3 px-4 border-b ${isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
            <FileText size={18} className={isTerminal ? 'text-[#3fb950]' : 'text-blue-600'} /> 
            <span className="font-bold text-sm truncate">{note.title}</span>
        </div>
        <button onClick={onClose} className={`px-3 py-1.5 text-xs font-bold border rounded flex items-center gap-2 ${isTerminal ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'} transition-colors`}>
            <Save size={14} /> SAVE & CLOSE
        </button>
      </div>
      <textarea 
        value={note.content}
        onChange={(e) => onSave(e.target.value)}
        className={`flex-1 w-full p-4 md:p-8 bg-transparent outline-none resize-none leading-relaxed text-sm custom-scrollbar`}
        placeholder={isTerminal ? "// Start typing your content here..." : "Start writing..."}
        spellCheck={false}
      />
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, type, onConfirm, onCancel, isTerminal }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className={`w-full max-w-sm p-6 ${isTerminal ? 'bg-[#161b22] border border-[#30363d] text-[#e6edf3]' : 'bg-white border border-gray-200 text-gray-800'} rounded-lg flex flex-col gap-4 text-center items-center shadow-2xl scale-100 font-mono`}>
          <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-2">
             <AlertTriangle size={32} />
          </div>
          <h3 className="font-bold text-xl">CONFIRM DELETION</h3>
          <p className="opacity-70 text-xs">Target: {type}. This action is irreversible.</p>
          <div className="flex gap-2 w-full mt-4">
              <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-lg">
                DELETE PERMANENTLY
              </button>
              <button onClick={onCancel} className="flex-1 py-2 border border-current opacity-60 hover:opacity-100 text-xs font-bold rounded uppercase tracking-wider transition-opacity">
                CANCEL
              </button>
          </div>
        </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function DesnoteAppV7() {
  // --- STATE ---
  const [folders, setFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('desnote_folders_v7')) || initialFolders; } catch { return initialFolders; }
  });
  
  const [rootNotes, setRootNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('desnote_root_v7')) || initialRootNotes; } catch { return initialRootNotes; }
  });

  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null); 
  const [moveModal, setMoveModal] = useState({ isOpen: false, noteId: null, sourceId: null, isFromRoot: false }); 
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [createModal, setCreateModal] = useState({ isOpen: false, type: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, targetId: null, sourceId: null, isRoot: false });
  const [columnCount, setColumnCount] = useState(2);
  const [viewMode, setViewMode] = useState('ALL'); 

  const fileInputRef = useRef(null);

  // --- EFFECTS ---
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

  // --- ACTIONS ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const toggleViewMode = (mode) => {
    if (viewMode === mode) setViewMode('ALL');
    else setViewMode(mode);
  };

  const toggleFolder = (folderId) => {
    setFolders(folders.map(f => 
      f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f
    ));
  };

  const togglePeek = (folderId, noteId) => {
    if (!folderId) {
       setRootNotes(rootNotes.map(n => n.id === noteId ? { ...n, isPeeked: !n.isPeeked } : n));
    } else {
       setFolders(folders.map(f => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          notes: f.notes.map(n => n.id === noteId ? { ...n, isPeeked: !n.isPeeked } : n)
        };
      }));
    }
  };

  const handleCreate = (name) => {
    if (!name.trim()) return;
    if (createModal.type === 'FOLDER') {
      setFolders([...folders, { id: generateId(), name: name, isExpanded: true, notes: [] }]);
    } else if (createModal.type === 'NOTE') {
      setRootNotes([...rootNotes, { id: generateId(), title: name, content: '', isPeeked: false }]);
    }
    setCreateModal({ isOpen: false, type: null });
    setAddMenuOpen(false);
  };

  const initDeleteNote = (sourceId, noteId, isRoot) => {
    setDeleteModal({ isOpen: true, type: 'NOTE', targetId: noteId, sourceId, isRoot });
  };

  const initDeleteFolder = (folderId) => {
    setDeleteModal({ isOpen: true, type: 'FOLDER', targetId: folderId });
  };

  const confirmDelete = () => {
    const { type, targetId, sourceId, isRoot } = deleteModal;
    if (type === 'NOTE') {
        if (isRoot) {
            setRootNotes(rootNotes.filter(n => n.id !== targetId));
        } else {
            setFolders(folders.map(f => f.id === sourceId ? { ...f, notes: f.notes.filter(n => n.id !== targetId) } : f));
        }
    } else if (type === 'FOLDER') {
        setFolders(folders.filter(f => f.id !== targetId));
    }
    setDeleteModal({ isOpen: false, type: null, targetId: null, sourceId: null, isRoot: false });
  };

  const openEditor = (note, parentId = null) => {
    setActiveNote({ ...note, parentId }); 
  };

  const saveEditorContent = (content) => {
    if (!activeNote) return;
    if (activeNote.parentId === null) {
       setRootNotes(rootNotes.map(n => n.id === activeNote.id ? { ...n, content } : n));
    } else {
       setFolders(folders.map(f => {
         if (f.id !== activeNote.parentId) return f;
         return { ...f, notes: f.notes.map(n => n.id === activeNote.id ? { ...n, content } : n) };
       }));
    }
    setActiveNote(prev => ({ ...prev, content }));
  };

  // --- MOVE LOGIC ---
  const openMoveModal = (sourceId, noteId, isFromRoot) => {
    setMoveModal({ isOpen: true, noteId, sourceId, isFromRoot });
  };

  const executeMove = (targetId) => {
    const { sourceId, noteId, isFromRoot } = moveModal;
    let noteToMove = null;

    if (isFromRoot) {
      noteToMove = rootNotes.find(n => n.id === noteId);
      setRootNotes(rootNotes.filter(n => n.id !== noteId));
    } else {
      const sourceFolder = folders.find(f => f.id === sourceId);
      noteToMove = sourceFolder.notes.find(n => n.id === noteId);
      setFolders(folders.map(f => f.id === sourceId ? { ...f, notes: f.notes.filter(n => n.id !== noteId) } : f));
    }
    noteToMove = { ...noteToMove, isPeeked: false }; 
    if (targetId === 'ROOT') {
      setRootNotes(prev => [...prev, noteToMove]);
    } else {
      setFolders(prev => prev.map(f => f.id === targetId ? { ...f, notes: [...f.notes, noteToMove] } : f));
    }
    setMoveModal({ isOpen: false, noteId: null, sourceId: null, isFromRoot: false });
  };

  // --- IMPORT/EXPORT ---
  const handleExport = () => {
    const data = { version: "v7", timestamp: new Date().toISOString(), folders, rootNotes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desnote_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.folders || !data.rootNotes) { alert("Invalid Format"); return; }
        if (confirm("Restore data? Current data will be replaced.")) {
          setFolders(data.folders);
          setRootNotes(data.rootNotes);
          setSettingsOpen(false);
        }
      } catch (err) { alert("Failed to read file."); }
    };
    reader.readAsText(file);
    event.target.value = null; 
  };

  // --- MASONRY LOGIC (WITH FILTER) ---
  const combinedItems = useMemo(() => {
    let folderItems = [];
    let noteItems = [];
    if (viewMode === 'ALL' || viewMode === 'FOLDER') {
      folderItems = folders.map(f => ({ type: 'FOLDER', data: f }));
    }
    if (viewMode === 'ALL' || viewMode === 'NOTE') {
      noteItems = rootNotes.map(n => ({ type: 'NOTE', data: n }));
    }
    return [...folderItems, ...noteItems];
  }, [folders, rootNotes, viewMode]);

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    let itemsToRender = combinedItems;
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        itemsToRender = combinedItems.filter(item => {
            if (item.type === 'FOLDER') return item.data.name.toLowerCase().includes(q);
            return item.data.title.toLowerCase().includes(q) || item.data.content.toLowerCase().includes(q);
        });
    }
    itemsToRender.forEach((item, index) => {
      cols[index % columnCount].push(item);
    });
    return cols;
  }, [combinedItems, columnCount, searchQuery]);

  // --- STYLING CONSTANTS ---
  const isTerminal = theme === 'dark';
  const bgClass = isTerminal ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]';
  const textClass = isTerminal ? 'text-[#e6edf3]' : 'text-[#24292f]';
  const fontClass = 'font-mono'; // Forced Mono for GitHub/Linux feel
  const modalBg = isTerminal ? 'bg-[#161b22] border border-[#30363d] text-[#e6edf3]' : 'bg-white border border-[#d0d7de] text-[#24292f] shadow-xl rounded-lg';

  // --- RENDER ---
  return (
    <div className={`min-h-screen w-full relative flex flex-col ${bgClass} ${textClass} ${fontClass} transition-colors duration-500 overflow-hidden`}>
      
      {/* BACKGROUND GRID */}
      {isTerminal && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" 
             style={{ backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
      )}

      {/* TOP SYSTEM STATUS */}
      <SystemStatus isTerminal={isTerminal} viewMode={viewMode} />

      {/* HEADER AREA */}
      <header className={`px-4 py-3 flex flex-col gap-3 z-10 sticky top-0 ${isTerminal ? 'bg-[#0d1117]/95 border-b border-[#30363d]' : 'bg-white/90 backdrop-blur shadow-sm'}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                {isTerminal ? <Terminal className="text-[#e6edf3]" size={18} /> : <Github className="text-black" size={18} />}
                <h1 className="text-lg font-bold tracking-tight">DESNOTE <span className="text-[10px] font-normal opacity-50 ml-1 border px-1 rounded-sm">v7.2</span></h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded-md hover:bg-current hover:bg-opacity-10 transition-colors">
                  <Settings size={16} />
              </button>
            </div>
        </div>

        {/* SLIM STATS & FILTER BAR */}
        {!searchQuery && (
          <div className="flex gap-2 w-full overflow-x-auto pb-1 scrollbar-none items-center">
            <StatsButton 
              icon={Folder} 
              label="FOLDERS" 
              value={folders.length} 
              isTerminal={isTerminal} 
              colorClass="text-blue-500" 
              onClick={() => toggleViewMode('FOLDER')}
              isActive={viewMode === 'FOLDER'}
            />
            <StatsButton 
              icon={FileText} 
              label="NOTES" 
              value={rootNotes.length} 
              isTerminal={isTerminal} 
              colorClass="text-green-500" 
              onClick={() => toggleViewMode('NOTE')}
              isActive={viewMode === 'NOTE'}
            />
             <StatsButton 
              icon={Layers} 
              label="ALL DATA" 
              isTerminal={isTerminal} 
              colorClass="text-yellow-500" 
              onClick={() => toggleViewMode('ALL')}
              isActive={viewMode === 'ALL'}
            />
          </div>
        )}

        <div className={`relative w-full group`}>
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50 font-mono text-xs flex items-center gap-1`}>
                <Command size={12}/> {">"}
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="filter_content..." className={`w-full py-2 pl-12 pr-4 text-xs bg-transparent border rounded-md outline-none transition-all font-mono ${isTerminal ? 'border-[#30363d] focus:border-[#58a6ff] placeholder-[#8b949e] bg-[#010409]' : 'border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500'}`}/>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar z-0">
        <div className="flex gap-4 items-start w-full">
            {columns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-0">
                    {col.map((item) => (
                        item.type === 'FOLDER' 
                            ? <FolderCard 
                                key={item.data.id} 
                                folder={item.data} 
                                isTerminal={isTerminal}
                                onToggle={() => toggleFolder(item.data.id)}
                                onDelete={() => initDeleteFolder(item.data.id)}
                                onMoveNote={(noteId) => openMoveModal(item.data.id, noteId, false)}
                                onDeleteNote={(noteId) => initDeleteNote(item.data.id, noteId, false)}
                                onOpenNote={(note) => openEditor(note, item.data.id)}
                                onPeekNote={(noteId) => togglePeek(item.data.id, noteId)}
                                onAddNote={() => {
                                    const title = prompt("New note name:");
                                    if(title) setFolders(folders.map(f => f.id === item.data.id ? { ...f, notes: [...f.notes, { id: generateId(), title, content: '', isPeeked: false }] } : f));
                                }}
                              />
                            : <NoteCard 
                                key={item.data.id} 
                                note={item.data} 
                                folderId={null} 
                                isTerminal={isTerminal}
                                onMove={() => openMoveModal('ROOT', item.data.id, true)}
                                onDelete={() => initDeleteNote('ROOT', item.data.id, true)}
                                onOpen={() => openEditor(item.data, null)}
                                onPeek={() => togglePeek(null, item.data.id)}
                              />
                    ))}
                </div>
            ))}
        </div>
        {combinedItems.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 opacity-30 text-xs font-mono gap-4">
              <Layers size={32} />
              <div>// EMPTY_VIEW: {viewMode}</div>
           </div>
        )}
      </main>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {addMenuOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-auto">
             <button onClick={() => setCreateModal({isOpen: true, type: 'NOTE'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 ${isTerminal ? 'bg-[#238636] text-white' : 'bg-white text-gray-800'}`}>
               <FileText size={16} /> Note
             </button>
             <button onClick={() => setCreateModal({isOpen: true, type: 'FOLDER'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 ${isTerminal ? 'bg-[#1f6feb] text-white' : 'bg-white text-gray-800'}`}>
               <Folder size={16} /> Folder
             </button>
          </div>
        )}
        <button onClick={() => setAddMenuOpen(!addMenuOpen)} className={`pointer-events-auto h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${addMenuOpen ? 'rotate-45 bg-red-500' : ''} ${isTerminal ? 'bg-[#3fb950] text-black hover:bg-[#2ea043]' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* MODALS */}
      {createModal.isOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 shadow-2xl border-t-4 ${isTerminal ? 'border-t-[#3fb950]' : 'border-t-blue-500'}`}>
             <h3 className="font-bold text-lg uppercase tracking-widest font-mono">NEW_{createModal.type}</h3>
             <input autoFocus placeholder="Enter name..." className="p-3 bg-transparent border rounded outline-none focus:ring-2 ring-opacity-50 ring-current transition-all font-mono" onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(e.target.value) }} onBlur={(e) => handleCreate(e.target.value)} />
             <button onClick={() => setCreateModal({isOpen: false, type: null})} className="text-xs opacity-50 hover:opacity-100 mt-2 font-mono">CANCEL (Tap outside)</button>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen} 
        type={deleteModal.type} 
        onConfirm={confirmDelete} 
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
        isTerminal={isTerminal}
      />

      {/* SETTINGS MODAL */}
      {settingsOpen && (
       <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-6 shadow-2xl font-mono`}>
             <div className="flex justify-between items-center border-b border-current border-opacity-20 pb-2">
                <h3 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2">
                   <Settings size={18}/> CONFIG
                </h3>
                <button onClick={() => setSettingsOpen(false)}><X size={18}/></button>
             </div>
             
             <div className="flex flex-col gap-3">
                <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Interface</div>
                <button onClick={toggleTheme} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center justify-between hover:bg-current hover:bg-opacity-5 transition-all">
                    <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        <span className="font-bold text-xs">Color Scheme</span>
                    </div>
                    <span className="text-[10px] opacity-60 uppercase bg-current bg-opacity-10 px-2 py-0.5 rounded">{theme}</span>
                </button>

                <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2">I/O Operations</div>
                <button onClick={handleExport} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all">
                   <div className={`p-1.5 rounded-full ${isTerminal ? 'bg-[#3fb950]/20 text-[#3fb950]' : 'bg-blue-100 text-blue-600'}`}><Download size={16}/></div>
                   <div className="text-left flex-1"><div className="font-bold text-xs">Export Backup</div><div className="text-[9px] opacity-60">Save .json file</div></div>
                </button>
                <button onClick={() => fileInputRef.current.click()} className="w-full py-3 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all">
                   <div className={`p-1.5 rounded-full ${isTerminal ? 'bg-yellow-500/20 text-yellow-500' : 'bg-orange-100 text-orange-600'}`}><Upload size={16}/></div>
                   <div className="text-left flex-1"><div className="font-bold text-xs">Import Data</div><div className="text-[9px] opacity-60">Restore from .json</div></div>
                   <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </button>
             </div>
          </div>
       </div>
      )}
      
      {moveModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 max-h-[80vh] font-mono`}>
            <h3 className="font-bold border-b border-opacity-20 border-current pb-2">mv SOURCE TARGET</h3>
            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
               {!moveModal.isFromRoot && (
                  <button onClick={() => executeMove('ROOT')} className="p-3 text-left border border-opacity-20 border-current rounded font-bold flex items-center gap-2 hover:bg-current hover:bg-opacity-10 text-xs"><LayoutGrid size={14}/> ./root</button>
               )}
               {folders.filter(f => f.id !== moveModal.sourceId).map(f => (
                  <button key={f.id} onClick={() => executeMove(f.id)} className="p-3 text-left border border-opacity-20 border-current rounded flex items-center gap-2 hover:bg-current hover:bg-opacity-10 text-xs"><Folder size={14}/> {f.name}</button>
               ))}
            </div>
            <button onClick={() => setMoveModal({...moveModal, isOpen: false})} className="py-2 opacity-50 hover:opacity-100 text-xs">ABORT_OPERATION</button>
          </div>
        </div>
      )}

      <EditorModal 
        note={activeNote} 
        isTerminal={isTerminal} 
        onClose={() => setActiveNote(null)} 
        onSave={saveEditorContent} 
      />
    </div>
  );
}
