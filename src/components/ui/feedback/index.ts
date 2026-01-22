/**
 * Catégorie UI: feedback
 *
 * Ré-export des composants de feedback (état, alertes, notifications, chargement).
 */

export * from "./alert";
export * from "./progress";
export * from "./skeleton";
export * from "./toast"; // primitives (Toast, ToastProvider, etc.)
export * from "./use-toast";

// Toasters (nommage explicite pour éviter les collisions)
export { AppToaster } from "./toaster";
export { Toaster as SonnerToaster, toast as sonnerToast } from "./sonner";


