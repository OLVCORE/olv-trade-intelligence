/**
 * USE UNSAVED CHANGES HOOK
 * 
 * Protege contra perda de dados não salvos
 * Bloqueia navegação (sidebar, tabs, browser) se houver alterações
 * 
 * CRÍTICO para evitar perda de créditos Apollo/Hunter/Lusha!
 */

import { useEffect } from 'react';

/**
 * Hook para proteger dados não salvos
 * 
 * @param hasUnsavedChanges - True se há dados não salvos
 * @param customMessage - Mensagem customizada (opcional)
 * 
 * @example
 * ```tsx
 * const [dealers, setDealers] = useState([]);
 * const [isSaved, setIsSaved] = useState(true);
 * 
 * useUnsavedChanges(!isSaved, 'Você tem dealers não salvos');
 * 
 * const handleSearch = () => {
 *   setDealers(results);
 *   setIsSaved(false); // Marca como não salvo
 * };
 * 
 * const handleSave = () => {
 *   saveToDatabase(dealers);
 *   setIsSaved(true); // Marca como salvo
 * };
 * ```
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  customMessage?: string
) {
  // Block browser navigation (refresh, close tab, back/forward)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  // Visual indicator in console (for debugging)
  useEffect(() => {
    if (hasUnsavedChanges) {
      console.warn('⚠️ [UNSAVED CHANGES] Page has unsaved data');
    }
  }, [hasUnsavedChanges]);
}

/**
 * Hook variant with auto-save capability
 * 
 * @example
 * ```tsx
 * useUnsavedChangesWithAutoSave(
 *   !isSaved,
 *   handleAutoSave,
 *   10000 // Auto-save a cada 10 segundos
 * );
 * ```
 */
export function useUnsavedChangesWithAutoSave(
  hasUnsavedChanges: boolean,
  onAutoSave: () => Promise<void>,
  intervalMs: number = 30000 // Default: 30 segundos
) {
  // Apply base protection
  useUnsavedChanges(hasUnsavedChanges);
  
  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setInterval(async () => {
      console.log('💾 Auto-save triggered');
      try {
        await onAutoSave();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [hasUnsavedChanges, onAutoSave, intervalMs]);
}
