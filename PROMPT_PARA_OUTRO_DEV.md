# 🎯 IMPLEMENTAR CARD EXPANSÍVEL NO PROSPECT-V2

---

## 📋 TAREFA

Implementar o **sistema de cards expansíveis** (idêntico ao Trade Intelligence) no projeto **Prospect-V2**.

---

## 📦 ARQUIVOS RECEBIDOS

Você receberá **5 arquivos de documentação**:

```
📘 README_CARD_EXPANSIVEL.md          → COMECE AQUI (5 min)
📕 REPLICAR_CARD_EXPANSIVEL_COMPLETO.md → Código completo (1-2h)
💡 EXEMPLOS_PRATICOS_CARD_EXPANSIVEL.md → Features avançadas
⚡ CHEATSHEET_CARD_EXPANSIVEL.md       → Referência rápida
📚 INDICE_DOCUMENTACAO_CARD_EXPANSIVEL.md → Navegação
```

---

## 🚀 PASSO A PASSO (30 MINUTOS - 2 HORAS)

### **1. LER PRIMEIRO (5 minutos)**

```
Abrir: README_CARD_EXPANSIVEL.md
Ler: Seção "Visão Geral" + "Start Rápido"
```

**Você vai entender:**
- O que é o card expansível
- Stack necessário (React, TypeScript, Supabase, shadcn/ui)
- Tempo de implementação

---

### **2. SEGUIR IMPLEMENTAÇÃO (1-2 horas)**

```
Abrir: REPLICAR_CARD_EXPANSIVEL_COMPLETO.md
Ir para: Seção 7 "Implementação Passo a Passo"
```

**8 PASSOS COMPLETOS:**

1. ✅ SQL (adicionar `raw_data` ao banco)
2. ✅ TypeScript Types (atualizar interfaces)
3. ✅ Hook `useCompanies` (React Query)
4. ✅ Componente da página
5. ✅ Card expansível (código completo)
6. ✅ Testar expansão
7. ✅ (Opcional) Edge Function Apollo
8. ✅ Build + Deploy

**CADA PASSO TEM:**
- ✅ Código completo (copy-paste)
- ✅ Explicação do que faz
- ✅ Onde colocar no projeto

---

### **3. TROUBLESHOOTING (se der erro)**

```
Abrir: CHEATSHEET_CARD_EXPANSIVEL.md
Ir para: Seção 4 "Troubleshooting Rápido"
```

**Cobre 5 problemas mais comuns:**
- Empresas não aparecem
- Card não expande
- raw_data vazio
- CORS Error
- Build falha

---

## 🎯 RESULTADO ESPERADO

Após implementação, você terá:

```
┌─────────────────────────────────────────────────┐
│ [▶] Empresa X | USA | 85 | ...                 │ ← Clique na seta
└─────────────────────────────────────────────────┘

                    ⬇️ EXPANDE

┌─────────────────────────────────────────────────┐
│ [▼] Empresa X | USA | 85 | ...                 │
├─────────────────────────────────────────────────┤
│ ┌────────────────┬────────────────┐            │
│ │ Informações    │ Fit Score      │            │
│ │ Localização    │ Links          │            │
│ │ Descrição      │ Decisores      │            │
│ └────────────────┴────────────────┘            │
└─────────────────────────────────────────────────┘
```

---

## ⏱️ TEMPO ESTIMADO

| Nível | Tempo | O que fazer |
|-------|-------|-------------|
| **Iniciante** | 2-3 horas | Ler tudo + implementar básico |
| **Intermediário** | 1-2 horas | Ler seção 7 + implementar |
| **Avançado** | 30 min - 1h | Copy-paste + adaptar |

---

## 📞 SUPORTE

### Se Travar:

1. **Verificar:** `CHEATSHEET_CARD_EXPANSIVEL.md` (Seção 4)
2. **Consultar:** `REPLICAR_COMPLETO.md` (Seção 8 - Troubleshooting)
3. **Perguntar:** Me avisar o erro exato

### Informações Úteis:

- ✅ Stack: React 18+ | TypeScript 5+ | Supabase | shadcn/ui
- ✅ Funciona com Next.js? **Sim**
- ✅ Precisa Apollo? **Não** (opcional)
- ✅ Mobile-friendly? **Sim**

---

## ✅ CHECKLIST DE ENTREGA

Antes de me avisar que finalizou, verificar:

```
[ ] SQL executado no Supabase (raw_data adicionado)
[ ] Hook useCompanies criado
[ ] Componente da página criado
[ ] Card expande/colapsa ao clicar na seta
[ ] Card mostra 2 colunas com informações
[ ] Campo "Decisores" aparece (mesmo vazio)
[ ] npm run build → SEM ERROS
[ ] Testado em mobile
```

---

## 🎯 EM RESUMO

1. **LER:** `README_CARD_EXPANSIVEL.md` (5 min)
2. **SEGUIR:** `REPLICAR_COMPLETO.md` → Seção 7 (1-2h)
3. **TESTAR:** Expansão funcionando
4. **ME AVISAR:** Quando terminar ou travar

---

## 💡 DICAS

- ✅ **Não pule o SQL** (Passo 1) - é essencial
- ✅ **Copy-paste o código** - está completo e testado
- ✅ **Use CHEATSHEET** - tem componentes prontos
- ✅ **Teste aos poucos** - não implemente tudo de uma vez

---

**Qualquer dúvida, me chama! 🚀**

**Documentação completa, testada e funcionando!**

