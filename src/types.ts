import React from 'react';

export interface Board {
  id: string;
  name: string;
  columns: string[];
  color?: string;
}

export enum TaskPriority {
  Low = 'Низкий',
  Medium = 'Средний',
  High = 'Высокий',
}

export const priorityStyles: Record<TaskPriority, { border: string; text: string; bg: string }> = {
  [TaskPriority.Low]: { border: 'border-brand-blue/50', text: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  [TaskPriority.Medium]: { border: 'border-brand-green/50', text: 'text-brand-green', bg: 'bg-brand-green/10' },
  [TaskPriority.High]: { border: 'border-brand-pink/50', text: 'text-brand-pink', bg: 'bg-brand-pink/10' },
};

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type AttachmentType = 'link' | 'image' | 'file';

export interface Attachment {
  id:string;
  name: string;
  type: AttachmentType;
  url: string; // URL for links, base64 for images, filename for files
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string | null;
  boardId: string;
  title: string;
  description:string;
  status: string;
  pomodorosCompleted: number;
  pomodorosEstimated: number;
  emoji?: string;
  dueDate?: string;
  priority?: TaskPriority;
  subtasks?: Subtask[];
  attachmentIds?: string[];
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  boardId: string;
  color?: string;
  emoji?: string;
  tags?: string[];
  attachmentIds?: string[];
  archived?: boolean;
}

export type CharacterType = 'spark' | 'cat' | 'dog' | 'labubu' | 'dragon' | 'unicorn' | 'phoenix' | 'cthulhu';

export interface PetStats {
  hunger: number; // 0-100
  happiness: number; // 0-100
  cleanliness: number; // 0-100
  energy: number; // 0-100
  isSleeping: boolean;
}

export interface Rank {
    name: string;
    icon: string;
    minLevel: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  focusCrystals: number;
  rank: Rank;
  characterType: CharacterType;
  characterName: string;
  petStats: PetStats;
  petCustomization: {
    color: string; // e.g., 'spark_default', 'cat_calico'
  };
  unlockedPetColors: string[];
  unlockedCharacterTypes: CharacterType[];
  habitsStats?: {
    totalCheckIns: number;
    longestStreak: number;
  }
}

export interface Quest {
  id: string;
  description: string;
  progress: number;
  target: number;
  xp: number;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  folderId?: string | null;
  linkedProjectIds?: string[];
  linkedTaskIds?: string[];
  tags?: string[];
  color?: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  emoji: string;
}

export type SortOption = 'default' | 'priority' | 'dueDate';

export interface StoreItem {
    id: string;
    name: string;
    type: 'pet_skin' | 'pet_type';
    cost: number;
    characterType: CharacterType;
    colorId?: string; // For skins
    visuals: {
        primaryColor?: string;
        secondaryColor?: string;
        icon?: React.FC<any>; // For pets
    };
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  type: 'positive' | 'negative';
  frequency: 'daily' | { type: 'weekly', days: number[] } | { type: 'times_per_week', count: number };
  createdAt: string;
  archived: boolean;
  streak: {
    current: number;
    longest: number;
    lastCheckIn: string | null;
  };
  completions: Record<string, boolean>; // YYYY-MM-DD: true
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  parentId?: string | null;
  linkedTaskId?: string;
  linkedProjectId?: string;
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
}

// FIX: Changed Hotkeys to be an interface with specific keys rather than a generic index signature to improve type safety.
export interface Hotkeys {
    viewDashboard: string;
    viewKanban: string;
    viewStats: string;
    viewAchievements: string;
    viewLibrary: string;
    viewNotes: string;
    viewQuests: string;
    viewHabits: string;
    viewPara: string;
    viewMindMap: string;
    viewKnowledge: string;
    viewGraph: string;
    quickAddTask: string;
    quickAddNote: string;
    quickAddProject: string;
    quickAddBoard: string;
    toggleAI: string;
    toggleSettings: string;
    toggleQuickAdd: string;
    formatToMarkdown: string;
    toggleSearch: string;
}

export interface Settings {
    hotkeys: Hotkeys;
    enableTts: boolean;
    selectedVoiceURI: string | null;
    showHotkeyTooltips: boolean;
}