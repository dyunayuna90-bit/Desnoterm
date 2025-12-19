import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FileText, ChevronDown, ChevronRight, Plus, 
  Settings, Moon, Sun, X, Save, MoreVertical, 
  ArrowRightLeft, Trash2, Terminal, Github, 
  CornerDownRight, Search, LayoutGrid, File, Edit3, Move, Eye, EyeOff, AlertTriangle,
  Download, Upload, CheckCircle
} from 'lucide-react';

// --- DATA INITIALIZATION ---
const generateId = () => Math.random().toString(36).substr(2, 9);

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
  const [settingsOpen, setSettingsOpen] = useState(false); // NEW: Settings Modal State
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, targetId: null, sourceId: null, isRoot: false });
  const [columnCount, setColumnCount] = useState(2);
  const fileInputRef = useRef(null); // NEW: Ref for file upload

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('desnote_folders_v7', JSON.stringify(folders));
    localStorage.setItem('desnote_root_v7', JSON.stringify(rootNotes));
  }, [folders, rootNotes]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setColumnCount(4);
      else if (window.innerWidth >= 768) setColumnCount(3);
      else setColumnCount(2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HELPER FUNCTION ---
  const getPeekContent = (text) => {
    if (!text) return "Empty...";
    if (text.length <= 150) return text;
    return text.substring(0, 150) + "...";
  };

  // --- BACKUP & RESTORE LOGIC (NEW) ---
  const handleExport = () => {
    const data = {
      version: "v7",
      timestamp: new Date().toISOString(),
      folders,
      rootNotes
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
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Basic validation
        if (!data.folders || !Array.isArray(data.folders) || !data.rootNotes || !Array.isArray(data.rootNotes)) {
          alert("Format file JSON tidak valid atau rusak!");
          return;
        }

        if (confirm(`Restore data dari tanggal ${data.timestamp || 'unknown'}? Data saat ini akan ditimpa.`)) {
          setFolders(data.folders);
          setRootNotes(data.rootNotes);
          setSettingsOpen(false);
          alert("Data berhasil direstore!");
        }
      } catch (err) {
        alert("Gagal membaca file JSON. Pastikan file benar.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset value biar bisa upload file yang sama kalau perlu
    event.target.value = null; 
  };

  // --- ACTIONS ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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

  // --- MASONRY LOGIC ---
  const combinedItems = useMemo(() => {
    const folderItems = folders.map(f => ({ type: 'FOLDER', data: f }));
    const noteItems = rootNotes.map(n => ({ type: 'NOTE', data: n }));
    return [...folderItems, ...noteItems];
  }, [folders, rootNotes]);

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
  const textClass = isTerminal ? 'text-[#3fb950]' : 'text-[#24292f]';
  const fontClass = isTerminal ? 'font-mono' : 'font-sans';
  const borderClass = isTerminal ? 'border-[#30363d]' : 'border-[#d0d7de]';
  const cardClass = isTerminal 
    ? 'bg-[#0d1117] border border-[#30363d] shadow-[0_4px_0_rgba(48,54,61,0.5)] active:translate-y-[2px] active:shadow-none transition-all' 
    : 'bg-white border border-[#d0d7de] shadow-sm rounded-lg hover:shadow-md transition-all';
  const modalBg = isTerminal ? 'bg-[#161b22] border border-[#30363d] text-[#e6edf3]' : 'bg-white border border-[#d0d7de] text-[#24292f] shadow-xl rounded-lg';

  // --- COMPONENTS ---
  const ActionButtons = ({ onMove, onDelete, colorClass }) => (
    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
      <button onClick={onMove} className={`p-1.5 rounded hover:bg-current hover:bg-opacity-10 ${colorClass} opacity-60 hover:opacity-100 transition-opacity`}>
        <Move size={14} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`p-1.5 rounded hover:bg-red-500/10 text-red-500 opacity-60 hover:opacity-100 transition-opacity`}>
        <Trash2 size={14} />
      </button>
    </div>
  );

  const NoteCard = ({ note, folderId }) => (
    <div className={`relative flex flex-col ${cardClass} h-auto overflow-hidden group w-full`}>
       <div className={`flex justify-between items-start p-3 ${isTerminal ? 'bg-[#161b22]/50' : 'bg-gray-50/80'} border-b ${borderClass} border-opacity-50`}>
          <div className="flex items-center gap-2 overflow-hidden">
             <FileText size={16} className={isTerminal ? 'text-[#3fb950]' : 'text-blue-500'} />
             <span className="font-bold text-sm truncate">{note.title}</span>
          </div>
          <ActionButtons 
            onMove={(e) => { e.stopPropagation(); openMoveModal(folderId || 'ROOT', note.id, !folderId); }}
            onDelete={() => initDeleteNote(folderId || 'ROOT', note.id, !folderId)}
            colorClass={isTerminal ? 'text-yellow-500' : 'text-gray-600'}
          />
       </div>
       <div 
         className="p-3 cursor-pointer min-h-[50px] flex-1 hover:bg-current hover:bg-opacity-5 transition-colors"
         onClick={() => openEditor(note, folderId)}
       >
          <div className={`text-xs leading-relaxed ${isTerminal ? 'text-[#8b949e]' : 'text-gray-600'}`}>
            {note.isPeeked 
              ? getPeekContent(note.content)
              : (
                  <div className="line-clamp-3 opacity-70">
                     {note.content || <span className="italic">No content (Edit)</span>}
                  </div>
                )
            }
          </div>
       </div>
       <button 
         onClick={(e) => { e.stopPropagation(); togglePeek(folderId, note.id); }}
         className={`w-full py-1.5 flex items-center justify-center border-t ${borderClass} border-opacity-50 text-[10px] font-bold uppercase tracking-wider hover:bg-current hover:bg-opacity-10 transition-colors opacity-70 hover:opacity-100`}
       >
          {note.isPeeked ? <EyeOff size={14} className="mr-1"/> : <Eye size={14} className="mr-1"/>}
          {note.isPeeked ? 'CLOSE PEEK' : 'PEEK'}
       </button>
    </div>
  );

  const FolderCard = ({ folder }) => (
    <div className={`relative flex flex-col ${cardClass} w-full`}>
      <div 
        className={`p-3 flex items-center justify-between cursor-pointer ${folder.isExpanded ? 'border-b '+borderClass : ''}`}
        onClick={() => toggleFolder(folder.id)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
           <Folder size={18} className={isTerminal ? 'text-[#3fb950]' : 'text-yellow-500'} />
           <div className="flex flex-col overflow-hidden">
             <span className="font-bold text-sm truncate">{folder.name}</span>
             {!folder.isExpanded && <span className="text-[10px] opacity-50">{folder.notes.length} files</span>}
           </div>
        </div>
        <div className="flex items-center">
            {folder.isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            <button onClick={(e) => {e.stopPropagation(); initDeleteFolder(folder.id)}} className="ml-2 p-1 hover:text-red-500 opacity-30 hover:opacity-100">
                <Trash2 size={12}/>
            </button>
        </div>
      </div>

      {folder.isExpanded && (
        <div className="p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {folder.notes.length === 0 ? <div className="text-center opacity-30 text-[10px] py-2">Empty Folder</div> : 
            folder.notes.map(note => (
               <div key={note.id} className={`flex flex-col ${isTerminal ? 'bg-[#161b22] border border-[#30363d]' : 'bg-gray-50 border border-gray-100'} rounded overflow-hidden`}>
                 <div className="flex items-center justify-between p-2 pl-3 border-b border-transparent hover:border-current hover:border-opacity-10">
                    <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => openEditor(note, folder.id)}>
                       <span className="text-xs font-bold truncate block hover:underline">{note.title}</span>
                    </div>
                    <div className="flex gap-2 pl-2">
                      <button onClick={() => openMoveModal(folder.id, note.id, false)} className="hover:text-yellow-500 opacity-60 hover:opacity-100"><Move size={12}/></button>
                      <button onClick={() => initDeleteNote(folder.id, note.id, false)} className="hover:text-red-500 opacity-60 hover:opacity-100"><Trash2 size={12}/></button>
                    </div>
                 </div>
                 {note.isPeeked && (
                   <div className="p-2 bg-black/5 cursor-text text-[10px] opacity-70 whitespace-pre-wrap font-mono">
                     {getPeekContent(note.content)}
                   </div>
                 )}
                 <button onClick={() => togglePeek(folder.id, note.id)} className="w-full py-1 bg-black/5 hover:bg-black/10 text-[9px] text-center opacity-50 uppercase tracking-widest">
                   {note.isPeeked ? 'Close' : 'Preview'}
                 </button>
               </div>
            ))}
            <button 
                onClick={() => {
                   const title = prompt("New note in folder:");
                   if(title) {
                       setFolders(folders.map(f => 
                           f.id === folder.id ? { ...f, notes: [...f.notes, { id: generateId(), title, content: '', isPeeked: false }] } : f
                       ));
                   }
                }}
                className="w-full py-2 text-[10px] text-center opacity-50 hover:opacity-100 border border-dashed border-current rounded flex justify-center items-center gap-1"
            >
                <Plus size={10}/> Add File
            </button>
        </div>
      )}
    </div>
  );

  const Editor = () => {
    if (!activeNote) return null;
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col ${isTerminal ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-white text-[#24292f]'} ${fontClass} animate-in slide-in-from-bottom-10 fade-in duration-200`}>
        <div className={`flex justify-between items-center p-4 border-b ${borderClass}`}>
          <div className="flex items-center gap-3 overflow-hidden">
             <FileText size={20} className={isTerminal ? 'text-[#3fb950]' : 'text-blue-600'} /> 
             <span className="font-bold text-lg truncate">{activeNote.title}</span>
          </div>
          <button onClick={() => setActiveNote(null)} className={`px-4 py-2 text-sm font-bold border rounded flex items-center gap-2 ${isTerminal ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'}`}>
             <Save size={16} /> DONE
          </button>
        </div>
        <textarea 
          value={activeNote.content}
          onChange={(e) => saveEditorContent(e.target.value)}
          className={`flex-1 w-full p-6 bg-transparent outline-none resize-none leading-relaxed text-base custom-scrollbar`}
          placeholder={isTerminal ? "// Start typing..." : "Start writing..."}
          spellCheck={false}
        />
      </div>
    );
  }

  const CreateModal = () => {
    if (!createModal.isOpen) return null;
    const [name, setName] = useState('');
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4`}>
           <h3 className="font-bold text-lg uppercase tracking-widest">NEW {createModal.type}</h3>
           <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name/Title..." className="p-3 bg-transparent border rounded outline-none" onKeyDown={(e) => e.key === 'Enter' && handleCreate(name)}/>
           <div className="flex gap-2">
             <button onClick={() => handleCreate(name)} className={`flex-1 py-3 text-xs font-bold rounded uppercase tracking-wider ${isTerminal ? 'bg-[#238636] text-white' : 'bg-blue-600 text-white'}`}>CREATE</button>
             <button onClick={() => setCreateModal({isOpen: false, type: null})} className="flex-1 py-3 text-xs font-bold opacity-60 hover:opacity-100 border border-current rounded uppercase">CANCEL</button>
           </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = () => {
    if (!deleteModal.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
         <div className={`w-full max-w-sm p-6 ${modalBg} border-red-500/50 flex flex-col gap-4 text-center items-center`}>
            <AlertTriangle className="text-red-500" size={48} />
            <h3 className="font-bold text-xl text-red-500">DELETE {deleteModal.type}?</h3>
            <p className="opacity-70 text-sm">Are you sure you want to delete this {deleteModal.type.toLowerCase()}? This action cannot be undone.</p>
            <div className="flex gap-2 w-full mt-2">
               <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded uppercase tracking-wider transition-colors">
                 YES, DELETE
               </button>
               <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-3 border border-current opacity-60 hover:opacity-100 font-bold rounded uppercase tracking-wider">
                 CANCEL
               </button>
            </div>
         </div>
      </div>
    )
  };

  // NEW: Settings/Backup Modal
  const SettingsModal = () => {
    if (!settingsOpen) return null;
    return (
       <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-6`}>
             <div className="flex justify-between items-center border-b border-current border-opacity-20 pb-2">
                <h3 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2">
                   <Settings size={18}/> SYSTEM
                </h3>
                <button onClick={() => setSettingsOpen(false)}><X size={18}/></button>
             </div>
             
             <div className="flex flex-col gap-3">
                <div className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1">Data Management</div>
                
                <button 
                  onClick={handleExport}
                  className={`w-full py-4 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all`}
                >
                   <div className={`p-2 rounded-full ${isTerminal ? 'bg-[#3fb950]/20 text-[#3fb950]' : 'bg-blue-100 text-blue-600'}`}>
                      <Download size={20}/>
                   </div>
                   <div className="text-left flex-1">
                      <div className="font-bold text-sm">Backup Data (JSON)</div>
                      <div className="text-[10px] opacity-60">Save all folders & notes to file</div>
                   </div>
                </button>

                <button 
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full py-4 px-4 rounded border border-current border-opacity-20 flex items-center gap-4 hover:bg-current hover:bg-opacity-5 transition-all`}
                >
                   <div className={`p-2 rounded-full ${isTerminal ? 'bg-yellow-500/20 text-yellow-500' : 'bg-orange-100 text-orange-600'}`}>
                      <Upload size={20}/>
                   </div>
                   <div className="text-left flex-1">
                      <div className="font-bold text-sm">Restore Data</div>
                      <div className="text-[10px] opacity-60">Import JSON backup file</div>
                   </div>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleImport} 
                     accept=".json" 
                     className="hidden" 
                   />
                </button>
             </div>

             <div className="text-center text-[10px] opacity-30 font-mono pt-4 border-t border-current border-opacity-10">
                DESNOTE_V7 // SYSTEM_READY
             </div>
          </div>
       </div>
    );
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen w-full relative flex flex-col ${bgClass} ${textClass} ${fontClass} transition-colors duration-500 overflow-hidden`}>
      <header className={`px-5 py-4 flex flex-col gap-4 z-10 sticky top-0 ${isTerminal ? 'bg-[#0d1117]/95 border-b border-[#30363d]' : 'bg-white/90 backdrop-blur shadow-sm'}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                {isTerminal ? <Terminal className="text-[#3fb950]" size={20} /> : <Github className="text-black" size={20} />}
                <h1 className="text-xl font-bold tracking-tight">DESNOTE_V7</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-current hover:bg-opacity-10 transition-colors">
                  <Settings size={18} />
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-current hover:bg-opacity-10 transition-colors">
                  {isTerminal ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
        </div>
        <div className={`relative w-full group`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50`} size={16} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isTerminal ? "search..." : "Find notes..."} className={`w-full py-2.5 pl-10 pr-4 text-sm bg-transparent border rounded-md outline-none transition-all ${isTerminal ? 'border-[#30363d] focus:border-[#3fb950] placeholder-[#8b949e]' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400'}`}/>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-28 custom-scrollbar">
        <div className="flex gap-4 items-start w-full">
            {columns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-0">
                    {col.map((item) => (
                        item.type === 'FOLDER' 
                            ? <FolderCard key={item.data.id} folder={item.data} />
                            : <NoteCard key={item.data.id} note={item.data} folderId={null} />
                    ))}
                </div>
            ))}
        </div>
        {combinedItems.length === 0 && (
           <div className="text-center py-20 opacity-30 text-sm font-mono">[EMPTY SYSTEM]</div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {addMenuOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
             <button onClick={() => setCreateModal({isOpen: true, type: 'NOTE'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase ${isTerminal ? 'bg-[#238636] text-white' : 'bg-white text-gray-800'}`}>
               <FileText size={16} /> Note
             </button>
             <button onClick={() => setCreateModal({isOpen: true, type: 'FOLDER'})} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-bold tracking-wider uppercase ${isTerminal ? 'bg-[#1f6feb] text-white' : 'bg-white text-gray-800'}`}>
               <Folder size={16} /> Folder
             </button>
          </div>
        )}
        <button onClick={() => setAddMenuOpen(!addMenuOpen)} className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-90 ${addMenuOpen ? 'rotate-45' : ''} ${isTerminal ? 'bg-[#3fb950] text-black hover:bg-[#2ea043]' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      <CreateModal />
      <DeleteConfirmModal />
      <SettingsModal />
      
      {moveModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 ${modalBg} flex flex-col gap-4 max-h-[80vh]`}>
            <h3 className="font-bold border-b border-opacity-20 border-current pb-2">MOVE TO:</h3>
            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
               {!moveModal.isFromRoot && (
                  <button onClick={() => executeMove('ROOT')} className="p-3 text-left border border-opacity-20 border-current rounded font-bold flex items-center gap-2 hover:bg-current hover:bg-opacity-10"><LayoutGrid size={16}/> DASHBOARD</button>
               )}
               {folders.filter(f => f.id !== moveModal.sourceId).map(f => (
                  <button key={f.id} onClick={() => executeMove(f.id)} className="p-3 text-left border border-opacity-20 border-current rounded flex items-center gap-2 hover:bg-current hover:bg-opacity-10"><Folder size={16}/> {f.name}</button>
               ))}
            </div>
            <button onClick={() => setMoveModal({...moveModal, isOpen: false})} className="py-2 opacity-50 hover:opacity-100">CANCEL</button>
          </div>
        </div>
      )}

      <Editor />
    </div>
  );
}
