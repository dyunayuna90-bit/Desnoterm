export type TerminalColor = 'green' | 'amber' | 'cyan' | 'red' | 'white';

export interface Note {
  id: string; 
  title: string; 
  content: string; 
  folderId: string | null; 
  color: TerminalColor; 
  updatedAt: number;
  isPinned?: boolean; 
  isDeleted?: boolean;
}

export interface Folder {
  id: string; 
  name: string; 
  isPinned?: boolean; 
  isDeleted?: boolean;
}
