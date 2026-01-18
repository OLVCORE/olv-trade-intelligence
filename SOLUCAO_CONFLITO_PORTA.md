# 🔧 SOLUÇÃO: Conflito de Porta entre Projetos

## ⚠️ PROBLEMA IDENTIFICADO

**Situação:**
- **stratevo-intelligence-prospect** está rodando na porta **5173** (fixo)
- **olv-trade-intelligence** também estava configurado para porta **5173** (padrão)
- Quando você tenta abrir `olv-trade-intelligence`, ele abre o projeto errado (`stratevo-intelligence-prospect`)

## ✅ SOLUÇÃO APLICADA

**Mudança realizada:**
- **olv-trade-intelligence** agora usa a porta **5174** (alterado em `vite.config.ts`)

## 📊 CONFIGURAÇÃO ATUAL

### Projeto: `stratevo-intelligence-prospect`
- **Porta:** `5173` (fixo)
- **URL:** `http://localhost:5173`
- **Arquivo:** `C:\Projects\stratevo-intelligence-prospect\vite.config.ts`

### Projeto: `olv-trade-intelligence` ✅ CORRIGIDO
- **Porta:** `5174` (novo padrão)
- **URL:** `http://localhost:5174`
- **Arquivo:** `C:\Projects\olv-trade-intelligence\vite.config.ts`

## 🚀 COMO USAR

### Para rodar o projeto `olv-trade-intelligence`:

```bash
cd C:\Projects\olv-trade-intelligence
npm run dev
```

**Acesse:** `http://localhost:5174`

### Para rodar o projeto `stratevo-intelligence-prospect`:

```bash
cd C:\Projects\stratevo-intelligence-prospect
npm run dev
```

**Acesse:** `http://localhost:5173`

## 🔄 CONFIGURAÇÃO VIA VARIÁVEL DE AMBIENTE

Se quiser usar uma porta diferente, crie um arquivo `.env.local`:

```bash
# .env.local
VITE_DEV_PORT=5175
```

## ✅ VERIFICAÇÃO

Para verificar qual projeto está rodando em qual porta:

```bash
# Windows PowerShell
netstat -ano | findstr :5173
netstat -ano | findstr :5174
```

Ou use o Task Manager para ver processos na porta.

## 📝 NOTAS

- ✅ Ambos os projetos podem rodar simultaneamente agora
- ✅ Sem conflito de porta
- ✅ Cada projeto tem sua própria URL

---

**Status:** ✅ **CONFLITO RESOLVIDO**



