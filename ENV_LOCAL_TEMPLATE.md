# Template para .env.local

Copie o conteúdo abaixo para criar seu `.env.local`:

```bash
# =============================================================================
# OLV Intelligence Prospect v2 — Diagnostic & Safe Mode Flags
# =============================================================================

# ORDEM OPERACIONAL #SAFE-00 — Modo Seguro (sem custos)
VITE_SAFE_MODE=1
VITE_DISABLE_AUTOSAVE=1
VITE_DISABLE_AUTO_DISCOVERY=1
VITE_BLOCK_WRITES=1

# SPEC #005.D — Diagnóstico SaveBar & Autosave
VITE_DEBUG_SAVEBAR=1

# =============================================================================
# HF-STACK-2.3 — OpenAI API Key (obrigatória para IA funcionar)
# =============================================================================
# IMPORTANTE: Substitua pela sua chave real do OpenAI
# Obtenha em: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# =============================================================================
# Instruções:
# 1. Crie o arquivo .env.local na raiz do projeto
# 2. Cole as flags acima
# 3. Substitua VITE_OPENAI_API_KEY pela sua chave real
# 4. Reinicie o servidor: pnpm dev
# 5. Verifique no console: [DIAG][BOOT] deve mostrar os valores
# =============================================================================
```

## Como usar

1. Crie o arquivo `.env.local` na raiz do projeto
2. Cole o conteúdo acima
3. Ajuste as flags conforme necessário
4. Reinicie o servidor (`pnpm dev`)

## Validação

Ao iniciar o app, você deve ver no console:

```
[DIAG][BOOT] VITE_DEBUG_SAVEBAR = 1
[DIAG][BOOT] VITE_DISABLE_AUTO_DISCOVERY = 1
[FLAGS] 🚩 Feature Flags Carregadas
  SAFE_MODE: true
  DISABLE_AUTOSAVE: true
  DISABLE_AUTO_DISCOVERY: true
  BLOCK_WRITES: true
  DEBUG_SAVEBAR: true
```

## Desativar modo seguro

Para voltar ao comportamento normal:
1. Remova ou comente as flags no `.env.local`
2. Ou delete o arquivo `.env.local`
3. Reinicie o servidor

