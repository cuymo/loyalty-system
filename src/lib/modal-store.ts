/**
ID: lib_013
Estado centralizado para la gestión de modales y drawers mediante Zustand, garantizando una IU reactiva.
*/

import { create } from "zustand";

interface ModalData {
    [key: string]: unknown;
}

interface ModalState {
    /** Currently active modal key, or null if none */
    activeModal: string | null;
    /** Optional payload data for the active modal */
    data: ModalData;
    /** Open a modal by key, with optional data */
    openModal: (key: string, data?: ModalData) => void;
    /** Close the currently active modal */
    closeModal: () => void;
    /** Check if a specific modal is open */
    isOpen: (key: string) => boolean;
}

export const useModalStore = create<ModalState>((set, get) => ({
    activeModal: null,
    data: {},
    openModal: (key, data = {}) => set({ activeModal: key, data }),
    closeModal: () => set({ activeModal: null, data: {} }),
    isOpen: (key) => get().activeModal === key,
}));
