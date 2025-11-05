// SPEC #005.D.1 — Helpers centralizados de diagnóstico
// Garantem parse robusto da flag VITE_DEBUG_SAVEBAR

/**
 * Verifica se diagnóstico está habilitado
 * Aceita: 1, true, on, yes (case-insensitive)
 */
export function isDiagEnabled(): boolean {
  try {
    const raw = String((import.meta as any)?.env?.VITE_DEBUG_SAVEBAR ?? '').trim().toLowerCase();
    if (!raw) return false;
    return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
  } catch {
    return false;
  }
}

/**
 * Log de diagnóstico (console.log)
 */
export function dlog(scope: string, ...args: any[]) {
  if (isDiagEnabled()) {
    console.log(`[DIAG][${scope}]`, ...args);
  }
}

/**
 * Warning de diagnóstico (console.warn)
 */
export function dwarn(scope: string, ...args: any[]) {
  if (isDiagEnabled()) {
    console.warn(`[DIAG][${scope}]`, ...args);
  }
}

/**
 * Group de diagnóstico (console.group)
 */
export function dgroup(scope: string, label?: string) {
  if (isDiagEnabled()) {
    console.group(`[DIAG][${scope}]${label ? ` ${label}` : ''}`);
  }
}

/**
 * Group end de diagnóstico (console.groupEnd)
 */
export function dgroupEnd() {
  if (isDiagEnabled()) {
    console.groupEnd();
  }
}

/**
 * Table de diagnóstico (console.table)
 */
export function dtable(data: any) {
  if (isDiagEnabled()) {
    console.table(data);
  }
}

