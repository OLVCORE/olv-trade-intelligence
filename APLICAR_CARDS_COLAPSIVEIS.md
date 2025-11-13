# 📦 APLICAR CARDS COLAPSÁVEIS NA COMPANYDETAILPAGE

## ✅ COMPONENTE CRIADO: `CollapsibleCard.tsx`

### **Como usar:**

**ANTES (Card normal):**
```tsx
<Card className="glass-card">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-2 text-base">
      <Shield className="h-4 w-4 text-primary" />
      Identificação Cadastral
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Conteúdo aqui */}
  </CardContent>
</Card>
```

**DEPOIS (Card colapsável):**
```tsx
<CollapsibleCard 
  title="Identificação Cadastral" 
  icon={Shield}
  defaultExpanded={false}
>
  {/* Conteúdo aqui */}
</CollapsibleCard>
```

---

## 📋 CARDS PARA CONVERTER:

### **1. Identificação Cadastral** (Shield)
### **2. Localização Completa** (MapPin)
### **3. Informações de Contato** (Phone)
### **4. Atividade Econômica** (Briefcase)
### **5. Capital Social e Porte** (DollarSign)
### **6. Sócios e QSA** (Users)
### **7. Decisores Apollo** (Target)
### **8. Digital Intelligence** (Globe)
### **9. TOTVS Report** (FileText)

---

## 🎯 EXEMPLO COMPLETO:

**Arquivo:** `src/pages/CompanyDetailPage.tsx`

**Adicionar import:**
```tsx
import { CollapsibleCard } from '@/components/companies/CollapsibleCard';
```

**Substituir card normal por card colapsável:**

```tsx
{/* ❌ ANTES */}
<Card className="glass-card">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-2 text-base">
      <Shield className="h-4 w-4 text-primary" />
      Identificação Cadastral
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Campos... */}
    </div>
  </CardContent>
</Card>

{/* ✅ DEPOIS */}
<CollapsibleCard 
  title="Identificação Cadastral" 
  icon={Shield}
  defaultExpanded={true}  {/* Primeiro card aberto por padrão */}
>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {/* Campos... */}
  </div>
</CollapsibleCard>
```

---

## 🎨 CONFIGURAÇÃO RECOMENDADA:

**Cards que devem iniciar ABERTOS:**
- ✅ **Identificação Cadastral** (`defaultExpanded={true}`)
- ✅ **Localização Completa** (`defaultExpanded={true}`)
- ✅ **Decisores Apollo** (`defaultExpanded={true}`)

**Cards que devem iniciar FECHADOS:**
- ❌ **Informações de Contato** (`defaultExpanded={false}`)
- ❌ **Atividade Econômica** (`defaultExpanded={false}`)
- ❌ **Capital Social** (`defaultExpanded={false}`)
- ❌ **Sócios e QSA** (`defaultExpanded={false}`)
- ❌ **Digital Intelligence** (`defaultExpanded={false}`)
- ❌ **TOTVS Report** (`defaultExpanded={false}`)

---

## 🚀 BENEFÍCIOS:

1. ✅ **Página mais limpa** - Apenas o essencial visível
2. ✅ **Navegação rápida** - Abra apenas o que precisa
3. ✅ **UX melhorada** - Menos scroll, mais foco
4. ✅ **World-class** - Padrão de dashboards profissionais
5. ✅ **Responsivo** - Funciona em mobile

---

## 📊 ANTES vs DEPOIS:

**ANTES:**
```
┌─────────────────────────────────┐
│ 📋 Identificação Cadastral      │
│   [todos os campos visíveis]    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📍 Localização Completa         │
│   [todos os campos visíveis]    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📞 Informações de Contato       │
│   [todos os campos visíveis]    │
└─────────────────────────────────┘
... (muito scroll) ...
```

**DEPOIS:**
```
┌─────────────────────────────────┐
│ 📋 Identificação Cadastral    ▼ │ ← ABERTO
│   [campos visíveis]             │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📍 Localização Completa       ▼ │ ← ABERTO
│   [campos visíveis]             │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📞 Informações de Contato     ► │ ← FECHADO (clique para abrir)
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 💼 Atividade Econômica        ► │ ← FECHADO
└─────────────────────────────────┘
... (menos scroll, mais organizado) ...
```

---

## 🎯 PRÓXIMO PASSO:

Quer que eu aplique isso automaticamente em **todos os cards** da CompanyDetailPage?

Ou prefere fazer manualmente para controlar quais cards colapsar?

