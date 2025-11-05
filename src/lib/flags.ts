// SPEC #SAFE-00 — Feature flags centralizadas
// Sistema de proteção contra custos e gravações acidentais

/**
 * Helper genérico para ler flags de ambiente
 */
export const flag = (name: string, def = '') =>
  String((import.meta as any)?.env?.[name] ?? def).trim().toLowerCase();

/**
 * Parser robusto de valores truthy
 * Aceita: 1, true, on, yes (case-insensitive)
 */
const truthy = (v: string) => ['1', 'true', 'on', 'yes'].includes(v);

// ========================================
// FLAGS DE PROTEÇÃO (SAFE MODE)
// ========================================

/**
 * SAFE_MODE: Modo de segurança geral
 * Ativa todos os bloqueios de proteção
 */
export const SAFE_MODE = truthy(flag('VITE_SAFE_MODE'));

/**
 * DISABLE_AUTOSAVE: Desabilita salvamento automático
 * Evita consumo de créditos por autosave não intencional
 */
export const DISABLE_AUTOSAVE = truthy(flag('VITE_DISABLE_AUTOSAVE'));

/**
 * DISABLE_AUTO_DISCOVERY: Desabilita discovery automático
 * Economiza créditos de APIs (Serper, Hunter, etc.)
 */
export const DISABLE_AUTO_DISCOVERY = truthy(flag('VITE_DISABLE_AUTO_DISCOVERY'));

/**
 * BLOCK_WRITES: Bloqueia todas as escritas no Supabase
 * Modo dry-run total - nenhuma operação de escrita é executada
 */
export const BLOCK_WRITES = truthy(flag('VITE_BLOCK_WRITES'));

/**
 * DEBUG_SAVEBAR: Ativa telemetria de diagnóstico
 * Logs detalhados para debug da SaveBar e Autosave
 */
export const DEBUG_SAVEBAR = truthy(flag('VITE_DEBUG_SAVEBAR'));

// ========================================
// HELPERS DE VALIDAÇÃO
// ========================================

/**
 * Verifica se qualquer proteção está ativa
 */
export const isProtectionActive = () => 
  SAFE_MODE || DISABLE_AUTOSAVE || DISABLE_AUTO_DISCOVERY || BLOCK_WRITES;

/**
 * Retorna um resumo das flags ativas
 */
export const getActiveFlagsReport = () => ({
  safeMode: SAFE_MODE,
  disableAutosave: DISABLE_AUTOSAVE,
  disableAutoDiscovery: DISABLE_AUTO_DISCOVERY,
  blockWrites: BLOCK_WRITES,
  debugSaveBar: DEBUG_SAVEBAR,
});

/**
 * Log de boot das flags (usar no main.tsx)
 */
export const logFlagsOnBoot = () => {
  if (isProtectionActive() || DEBUG_SAVEBAR) {
    console.group('🛡️ [SAFE MODE] Feature Flags');
    console.table(getActiveFlagsReport());
    console.groupEnd();
  }
};

