# 📋 PADRÃO COMUM - 9 ABAS DO RELATÓRIO TOTVS

**Data:** 04/11/2025  
**Objetivo:** Documentar padrão reutilizável para todas as 9 abas do relatório

---

## 🎯 ABAS DO RELATÓRIO TOTVS:

1. ✅ **Keywords & SEO** ← PILOTO (100% implementado)
2. 🔴 **TOTVS Detection**
3. 🔴 **Competitors**
4. 🔴 **Similar Companies**
5. 🔴 **Client Discovery**
6. 🔴 **Decisores & Contatos**
7. 🔴 **Analysis 360°**
8. 🔴 **Recommended Products**
9. 🔴 **Executive Summary**

---

## 🧩 COMPONENTES REUTILIZÁVEIS CRIADOS:

### 1. `FloatingNavigation.tsx` ✅

**Localização:** `src/components/common/FloatingNavigation.tsx`

**Funcionalidades:**
- ✅ Botão flutuante "Voltar ao Topo" (fixo, aparece após scroll 300px)
- ✅ Barra de navegação Voltar/Home/Salvar
- ✅ Badge "Alterações não salvas" (pulsante)
- ✅ Botão "Salvar Relatório" (verde pulsante)

**Props:**
```typescript
interface FloatingNavigationProps {
  onBack?: () => void;           // Callback para voltar
  onHome?: () => void;           // Callback para home
  onSave?: () => void;           // Callback para salvar
  showSaveButton?: boolean;      // Mostrar botão salvar
  saveDisabled?: boolean;        // Desabilitar salvar
  hasUnsavedChanges?: boolean;   // Mostrar badge de alterações
}
```

**Exemplo de uso:**
```tsx
import { FloatingNavigation } from '@/components/common/FloatingNavigation';

export function MinhaAba({ savedData, onDataChange }) {
  const [data, setData] = useState(savedData || null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleReset = () => {
    setData(null);
    setHasChanges(false);
  };
  
  const handleSave = () => {
    onDataChange?.(data);
    setHasChanges(false);
    toast({ title: '✅ Salvo!' });
  };
  
  return (
    <div>
      <FloatingNavigation
        onBack={handleReset}
        onHome={handleReset}
        onSave={handleSave}
        showSaveButton={true}
        saveDisabled={!data}
        hasUnsavedChanges={hasChanges}
      />
      
      {/* Conteúdo da aba */}
    </div>
  );
}
```

---

## 🔧 IMPLEMENTAÇÕES OBRIGATÓRIAS EM TODAS AS 9 ABAS:

### ✅ 1. IMPORTAR COMPONENTE

```tsx
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
```

### ✅ 2. GERENCIAR ESTADOS

```tsx
const [data, setData] = useState(savedData || null);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

### ✅ 3. CALLBACKS DE NAVEGAÇÃO

```tsx
const handleReset = () => {
  // Limpar dados e voltar ao estado inicial
  setData(null);
  setHasUnsavedChanges(false);
};

const handleSave = () => {
  // Salvar via callback parent (TOTVSCheckCard)
  onDataChange?.({
    // todos os estados da aba
    savedAt: new Date().toISOString(),
  });
  setHasUnsavedChanges(false);
  toast({ title: '✅ Relatório Salvo!' });
};
```

### ✅ 4. RENDERIZAR COMPONENTE

```tsx
return (
  <div>
    {data && (
      <FloatingNavigation
        onBack={handleReset}
        onHome={handleReset}
        onSave={handleSave}
        showSaveButton={true}
        saveDisabled={!data}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    )}
    
    {/* Conteúdo da aba */}
  </div>
);
```

### ✅ 5. NOTIFICAR PARENT (onDataChange)

**SEMPRE** que dados mudarem:
```tsx
useEffect(() => {
  if (data) {
    setHasUnsavedChanges(true);
  }
}, [data]);

// Ou no callback de sucesso da mutation:
onSuccess: (newData) => {
  setData(newData);
  setHasUnsavedChanges(true);
  onDataChange?.(newData); // Notifica parent
}
```

---

## 🧪 CHECKLIST DE VALIDAÇÃO (POR ABA):

### Antes de marcar aba como "100% pronta":

- [ ] Botão flutuante "Topo" aparece após scroll
- [ ] Botão "Topo" funciona (scroll suave)
- [ ] Botões "Voltar" e "Home" visíveis quando há dados
- [ ] Botão "Salvar" verde pulsante visível
- [ ] Badge "Alterações não salvas" aparece quando necessário
- [ ] Callback `onSave` chama `onDataChange` do parent
- [ ] Dados são carregados via `savedData` ao abrir aba
- [ ] Dados NÃO desaparecem ao trocar de aba
- [ ] Toast de confirmação ao salvar
- [ ] Nenhum erro no console

---

## 📁 ARQUIVOS A MODIFICAR (FASES):

### FASE 1: ABA KEYWORDS (ATUAL)
- [x] `src/components/common/FloatingNavigation.tsx` ← CRIADO
- [ ] `src/components/icp/tabs/KeywordsSEOTabEnhanced.tsx` ← FINALIZAR

### FASE 2: OUTRAS 8 ABAS
- [ ] `src/components/icp/tabs/ExecutiveSummaryTab.tsx`
- [ ] `src/components/intelligence/SimilarCompaniesTab.tsx`
- [ ] `src/components/icp/tabs/CompetitorsTab.tsx`
- [ ] `src/components/icp/tabs/ClientDiscoveryTab.tsx`
- [ ] `src/components/icp/tabs/DecisorsContactsTab.tsx`
- [ ] `src/components/intelligence/Analysis360Tab.tsx`
- [ ] `src/components/icp/tabs/RecommendedProductsTab.tsx`
- [ ] `src/components/totvs/TOTVSDetectionTab.tsx` (se existir)

### FASE 3: WRAPPER
- [ ] `src/components/totvs/TOTVSCheckCard.tsx` ← Validar salvamento

---

## 🔥 IMPLEMENTAÇÕES ESPECÍFICAS DA ABA KEYWORDS:

### ✅ JÁ IMPLEMENTADO:

1. ✅ Botão Topo flutuante (fixo, bounce)
2. ✅ Barra Voltar/Home/Salvar
3. ✅ Editar Website (com feedback)
4. ✅ Website em uso (card azul)
5. ✅ TOP 10 websites (dropdown)
6. ✅ 8 Ferramentas (discovery)
7. ✅ TOP 10 empresas similares (dropdown)
8. ✅ Keywords em 4 colunas (grid amarelo)
9. ✅ Google Compliance (dropdown colapsável)

### ❌ FALTA IMPLEMENTAR:

1. ❌ **IA analisa TOP 10 empresas escolhidas**
2. ❌ **IA analisa empresas encontradas nas 8 ferramentas**
3. ❌ **Captura completa de dados (nome, URL, snippet, métricas)**
4. ❌ **Salvamento persistente no banco (stc_verification_history)**

---

## 🎯 PRÓXIMOS PASSOS (ORDEM):

### AGORA (Fase 1):
1. ✅ Aplicar `FloatingNavigation` na aba Keywords (substituir código duplicado)
2. 🔧 Implementar IA para TOP 10 empresas
3. 🔧 Implementar IA para 8 ferramentas
4. 🔧 Validar salvamento no banco
5. ✅ Testar tudo

### DEPOIS (Fase 2):
1. Replicar nas outras 8 abas
2. Validar consistência
3. Testar navegação completa

---

**CRIADO EM:** 04/11/2025  
**STATUS:** FASE 1 EM ANDAMENTO  
**PRÓXIMO:** Aplicar FloatingNavigation na aba Keywords

