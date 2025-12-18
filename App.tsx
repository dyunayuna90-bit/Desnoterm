import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Terminal, Folder as FolderIcon, FileText, Trash2, 
  Search, X, Sun, Moon, Cpu, Wifi, Battery, Command, 
  CornerDownRight, Bold, Italic, List, ShieldCheck, Power, AlertTriangle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- TYPES ---
type ThemeMode = 'dark' | 'light';
interface Note { id: string; title: string; content: string; folderId: string | null; updatedAt: number; isDeleted?: boolean; }
interface Folder { id: string; name: string; isDeleted?: boolean; }

// --- THEME CONFIGURATION ---
const THEMES = {
    dark: { bg: 'bg-[#050505]', panel: 'bg-[#0a0a0a]', border: 'border-zinc-800', textMain: 'text-green-500', textDim: 'text-green-900', textMuted: 'text-zinc-500', hover: 'hover:border-green-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.1)]' },
    light: { bg: 'bg-[#f0f0f0]', panel: 'bg-[#ffffff]', border: 'border-zinc-400', textMain: 'text-zinc-900', textDim: 'text-zinc-300', textMuted: 'text-zinc-500', hover: 'hover:border-zinc-900', glow: 'shadow-sm' }
};

// --- HOOKS ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => { try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } catch { return initialValue; } });
  useEffect(() => { setTimeout(() => window.localStorage.setItem(key, JSON.stringify(value)), 500); }, [key, value]);
  return [value, setValue];
};

// --- COMPONENTS ---
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);
    const bootText = ["INITIALIZING DESNOTE KERNEL v3.0...", "CHECKING MEMORY... 1024MB OK", "LOADING MODULES... [FS, CRYPTO, UI]", "MOUNTING LOCAL_STORAGE...", "ESTABLISHING SECURE LINK...", "SYSTEM READY."];
    useEffect(() => {
        let delay = 0;
        bootText.forEach((line, index) => { delay += Math.random() * 300 + 100; setTimeout(() => { setLines(prev => [...prev, line]); if (index === bootText.length - 1) setTimeout(onComplete, 800); }, delay); });
    }, []);
    return ( <div className="fixed inset-0 bg-black text-green-500 font-mono p-10 z-[9999] flex flex-col justify-end pb-20"> {lines.map((l, i) => <div key={i} className="mb-1"> &gt; {l}</div>)} <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-3 h-5 bg-green-500 inline-block mt-2"/> </div> )
}

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [mode, setMode] = useLocalStorage<ThemeMode>('term_mode', 'dark');
  const [notes, setNotes] = useLocalStorage<Note[]>('term_notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('term_folders', [{ id: 'root', name: 'MAIN_DRIVE' }, { id: 'work', name: 'CLASSIFIED' }]);
  const [activeTab, setActiveTab] = useState<'all' | 'trash'>('all');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => { document.body.className = mode; const crt = document.getElementById('crt-overlay'); if(crt) crt.style.display = mode === 'dark' ? 'block' : 'none'; }, [mode]);
  useEffect(() => { const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000); return () => clearInterval(t); }, []);

  const t = THEMES[mode];
  const createNote = () => { const newNote: Note = { id: uuidv4(), title: '', content: '', folderId: currentFolder, updatedAt: Date.now() }; setNotes([newNote, ...notes]); setActiveNoteId(newNote.id); };
  const createFolder = () => { const name = prompt(" mkdir: directory name?"); if (name) setFolders([...folders, { id: uuidv4(), name }]); };

  const filtered = notes.filter(n => { if (activeTab === 'trash') return n.isDeleted; if (n.isDeleted) return false; if (currentFolder) return n.folderId === currentFolder; if (!currentFolder && activeTab === 'all') return !n.folderId; return true; }).filter(n => search ? (n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())) : true);

  if (!isBooted) return <BootSequence onComplete={() => setIsBooted(true)} />;

  return (
    <div className={`min-h-screen ${t.bg} ${t.textMain} font-mono flex flex-col transition-colors duration-300 selection:bg-current selection:text-white`}>
      <header className={`p-4 border-b ${t.border} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 ${t.bg} backdrop-blur-sm`}>
          <div className="flex items-center gap-4">
              <div className={`p-2 border ${t.border} ${t.panel}`}><Terminal size={24} /></div>
              <div><h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">DESNOTE_TERM <span className={`text-[10px] px-1 border ${t.border}`}>v3.0</span></h1><p className={`text-xs ${t.textMuted} uppercase tracking-widest`}>{mode === 'dark' ? 'SECURE_CONNECTION // ENCRYPTED' : 'LOCAL_PRINT_SPOOLER // READY'}</p></div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="hidden md:flex gap-4 text-[10px] uppercase tracking-widest text-zinc-500"><span className="flex items-center gap-1"><Cpu size={12}/> MEM_OK</span><span className="flex items-center gap-1"><Wifi size={12}/> LINK_ACTIVE</span><span className="flex items-center gap-1"><Battery size={12}/> 98%</span></div>
              <div className="relative flex-1 md:w-48"><span className="absolute left-3 top-2.5 opacity-50">&gt;</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="grep..." className={`w-full ${t.panel} border ${t.border} py-2 pl-6 pr-2 text-sm outline-none focus:border-current transition-all`} /></div>
              <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} className={`p-2 border ${t.border} hover:bg-zinc-500/10 active:scale-95 transition-transform`}>{mode === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
          </div>
      </header>
      <div className={`px-4 py-2 border-b ${t.border} flex items-center gap-2 text-sm overflow-x-auto no-scrollbar`}>
          <button onClick={() => { setCurrentFolder(null); setActiveTab('all'); }} className={`hover:underline font-bold ${activeTab === 'all' && !currentFolder ? 'underline' : ''}`}>~/HOME</button>
          {currentFolder && <><span className="opacity-50">/</span><span className="font-bold">{folders.find(f => f.id === currentFolder)?.name}</span></>}
          <div className="flex-1"/>
          {activeTab !== 'trash' && <><button onClick={createFolder} className={`px-3 py-1 text-xs border ${t.border} hover:bg-zinc-500/10 uppercase`}>+ MKDIR</button><button onClick={createNote} className={`px-3 py-1 text-xs border ${t.border} hover:bg-zinc-500/10 uppercase`}>+ TOUCH</button></>}
          <button onClick={() => setActiveTab(activeTab === 'all' ? 'trash' : 'all')} className={`ml-2 p-1 hover:text-red-500 ${activeTab === 'trash' ? 'text-red-500 font-bold' : ''}`}><Trash2 size={16}/></button>
      </div>
      <main className="flex-1 p-4 overflow-y-auto">
          {currentFolder && <button onClick={() => setCurrentFolder(null)} className={`mb-4 flex items-center gap-2 text-sm ${t.textMuted} hover:text-current`}><CornerDownRight className="rotate-180" size={14}/> cd ..</button>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {!currentFolder && activeTab === 'all' && folders.filter(f => !f.isDeleted).map(folder => (
                  <div key={folder.id} onClick={() => setCurrentFolder(folder.id)} className={`group relative p-4 border ${t.border} ${t.panel} cursor-pointer transition-all active:scale-[0.98] ${t.hover}`}>
                      <div className="flex justify-between items-start mb-6"><FolderIcon size={24} className="opacity-80 group-hover:opacity-100"/><span className="text-[10px] border border-current px-1 opacity-50">DIR</span></div>
                      <h3 className="text-lg font-bold truncate">{folder.name}/</h3><div className={`absolute bottom-0 left-0 h-1 bg-current transition-all duration-300 w-0 group-hover:w-full opacity-50`}/>
                  </div>
              ))}
              {filtered.map(note => (
                  <div key={note.id} onClick={() => setActiveNoteId(note.id)} className={`group relative p-4 border ${t.border} ${t.panel} cursor-pointer flex flex-col h-48 transition-all hover:-translate-y-1 ${t.hover} ${t.glow}`}>
                      <div className="flex justify-between items-start mb-2"><FileText size={20} className="opacity-80"/><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); setNotes(prev => prev.map(n => n.id === note.id ? {...n, isDeleted: !n.isDeleted} : n)); }} className="hover:text-red-500">{activeTab === 'trash' ? 'RESTORE' : '[DEL]'}</button></div></div>
                      <h3 className="font-bold text-lg mb-2 truncate uppercase">{note.title || 'UNTITLED'}</h3><p className={`text-xs ${t.textMuted} font-mono line-clamp-4 break-all leading-relaxed`}>{note.content?.replace(/<[^>]+>/g, '') || '// NO_DATA'}</p>
                      <div className={`mt-auto pt-2 border-t ${t.border} flex justify-between text-[10px] ${t.textMuted} uppercase`}><span>{new Date(note.updatedAt).toLocaleDateString()}</span><span>{Math.ceil((note.content?.length || 0) / 1024)}KB</span></div>
                  </div>
              ))}
          </div>
          {filtered.length === 0 && folders.length === 0 && !currentFolder && <div className="h-64 flex flex-col items-center justify-center opacity-30"><div className="text-4xl font-bold animate-pulse mb-2">&gt;_</div><p>DIRECTORY EMPTY</p></div>}
      </main>
      <footer className={`p-2 border-t ${t.border} text-[10px] flex justify-between ${t.textMuted} uppercase`}><span>USR: ILHAM_DANIAL</span><span>TIME: {time}</span><span>BUILD: STABLE</span></footer>
      <AnimatePresence>
        {activeNoteId && (<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`fixed inset-0 z-50 flex flex-col ${t.bg} ${t.textMain}`}><Editor note={notes.find(n => n.id === activeNoteId)!} onUpdate={(id: string, u: any) => setNotes(prev => prev.map(n => n.id === id ? {...n, ...u, updatedAt: Date.now()} : n))} onClose={() => setActiveNoteId(null)} theme={t}/></motion.div>)}
      </AnimatePresence>
    </div>
  );
}

const Editor = ({ note, onUpdate, onClose, theme }: any) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({ chars: 0, words: 0 });
    useEffect(() => { if(editorRef.current && note.content) { editorRef.current.innerHTML = note.content; updateStats(); } }, []);
    const updateStats = () => { if(!editorRef.current) return; const txt = editorRef.current.innerText || ""; setStats({ chars: txt.length, words: txt.trim().split(/\s+/).filter(w=>w).length }); };
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => { onUpdate(note.id, { content: e.currentTarget.innerHTML }); updateStats(); };
    const fmt = (cmd: string) => { document.execCommand(cmd, false); editorRef.current?.focus(); };
    return (
        <div className="flex flex-col h-full font-mono">
            <div className={`p-3 border-b ${theme.border} flex justify-between items-center bg-black/5`}><div className="flex items-center gap-3"><button onClick={onClose} className="hover:bg-zinc-500/20 p-1"><ArrowLeft size={18}/></button><span className="text-sm font-bold uppercase tracking-widest">NANO_EDITOR :: {note.id.slice(0,8)}.TXT</span></div><div className="flex gap-2"><button onClick={() => fmt('bold')} className={`p-1 hover:bg-zinc-500/20`}><Bold size={16}/></button><button onClick={() => fmt('italic')} className={`p-1 hover:bg-zinc-500/20`}><Italic size={16}/></button><button onClick={() => fmt('insertUnorderedList')} className={`p-1 hover:bg-zinc-500/20`}><List size={16}/></button></div></div>
            <div className={`flex border-b ${theme.border}`}><div className={`px-4 py-3 ${theme.panel} border-r ${theme.border} select-none flex items-center text-xs font-bold`}>TITLE &gt;</div><input value={note.title} onChange={e => onUpdate(note.id, {title: e.target.value})} placeholder="UNTITLED" className={`flex-1 bg-transparent px-4 py-3 outline-none font-bold uppercase tracking-wider ${theme.textMain} placeholder-opacity-30 placeholder-current`}/></div>
            <div className="flex-1 flex overflow-hidden relative"><div className={`hidden md:block w-12 border-r ${theme.border} text-right pr-3 pt-6 text-xs opacity-30 select-none leading-relaxed`}>{Array.from({length:30}).map((_,i) => <div key={i}>{i+1}</div>)}</div><div ref={editorRef} contentEditable onInput={handleInput} className="flex-1 p-6 outline-none leading-relaxed overflow-y-auto whitespace-pre-wrap custom-scrollbar"/></div>
            <div className={`p-2 border-t ${theme.border} ${theme.panel} flex justify-between text-xs font-bold uppercase tracking-wider`}><div className="flex gap-4"><span>STATUS: -- INSERT --</span><span>ENCODING: UTF-8</span></div><div className="flex gap-4 opacity-70"><span>L:{stats.chars}</span><span>W:{stats.words}</span></div></div>
        </div>
    )
}


