import { create } from 'zustand';

// ── Local types ──────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

type ActiveView = 'chat' | 'gallery' | 'pinned' | 'settings';

interface UIState {
  isSidebarOpen: boolean;
  activeView: ActiveView;
  isCommandPaletteOpen: boolean;
  selectedMediaIds: Set<string>;
  isSelectMode: boolean;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  toggleMediaSelection: (id: string) => void;
  selectAllMedia: (ids: string[]) => void;
  clearMediaSelection: () => void;
  setSelectMode: (on: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let toastCounter = 0;

function generateToastId(): string {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeView: 'chat',
  isCommandPaletteOpen: false,
  selectedMediaIds: new Set<string>(),
  isSelectMode: false,
  toasts: [],

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  setActiveView: (view: ActiveView) => {
    set({ activeView: view });
  },

  openCommandPalette: () => {
    set({ isCommandPaletteOpen: true });
  },

  closeCommandPalette: () => {
    set({ isCommandPaletteOpen: false });
  },

  toggleCommandPalette: () => {
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen }));
  },

  toggleMediaSelection: (id: string) => {
    set((state) => {
      const next = new Set(state.selectedMediaIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedMediaIds: next };
    });
  },

  selectAllMedia: (ids: string[]) => {
    set({ selectedMediaIds: new Set(ids) });
  },

  clearMediaSelection: () => {
    set({ selectedMediaIds: new Set<string>() });
  },

  setSelectMode: (on: boolean) => {
    set({ isSelectMode: on });
    if (!on) {
      set({ selectedMediaIds: new Set<string>() });
    }
  },

  addToast: (toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = { ...toast, id: generateToastId() };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
