# 🔍 ANÁLISE PANJIVA - FUNCIONALIDADES A REPLICAR

**Plataforma:** Panjiva.com (Trade data intelligence)  
**Owner:** S&P Global Market Intelligence

---

## 📊 FUNCIONALIDADES PRINCIPAIS DO PANJIVA

### **1. HS CODE LOOKUP** ⭐ PRIORIDADE MÁXIMA
```
Como funciona:
- Autocomplete dinâmico (digita "95" → mostra todos 95xx)
- Scrollbar no dropdown (5.000+ códigos)
- Busca por código OU descrição
- Mostra hierarquia (Capítulo → Subcapítulo → Item)

Status na nossa plataforma:
✅ IMPLEMENTADO - HSCodeAutocomplete.tsx + get-hs-codes Edge Function
✅ Fonte: UN Comtrade API (5.000+ códigos oficiais)
```

### **2. SHIPMENT DATA (Bill of Lading)**
```
O que mostra:
- Quem importou o quê (empresa + produto)
- Quando (data do shipment)
- Quanto (volume, peso, valor)
- De onde para onde (origem → destino)
- Frequência (importa todo mês? trimestre?)

Exemplo:
"ABC Fitness imported 500 units of Pilates Reformers (HS 9506.91)
from MetaLife (Brazil) to USA on Jan 2025 - $250,000"

Status na nossa plataforma:
❌ NÃO IMPLEMENTADO
🔧 Próxima fase: Integrar ImportGenius API ou Volza
💰 Custo: $500-2000/mês
```

### **3. SUPPLIER DISCOVERY**
```
O que faz:
- Busca fornecedores por HS Code
- Mostra quem exporta o produto
- Rating de fornecedor (volume, frequência, qualidade)

Status:
✅ IMPLEMENTADO PARCIAL
- Temos: Apollo + Serper (30 portais)
- Falta: Rating baseado em shipment history
```

### **4. BUYER DISCOVERY** ⭐ CRÍTICO PARA NÓS
```
O que faz:
- Busca quem IMPORTA determinado HS Code
- Filtra por país, volume, frequência
- Identifica grandes importadores

Exemplo:
"Show me all companies that imported HS 9506.91 to USA in last 12 months"
→ Retorna: 200 importadores reais

Status:
🔧 EM IMPLEMENTAÇÃO
- Temos: Apollo + Serper buscam "importers"
- Falta: Dados REAIS de shipment (Bill of Lading)
```

### **5. COMPETITOR TRACKING**
```
O que faz:
- Rastreia shipments dos concorrentes
- Ver: Quem são os clientes deles
- Ver: Volume de vendas, países de destino

Exemplo:
"Track Balanced Body shipments"
→ Vê quem compra deles (= prospects para MetaLife!)

Status:
❌ NÃO IMPLEMENTADO
🔧 Próxima fase
```

### **6. DECISION MAKER CONTACT INFO**
```
O que mostra:
- Nome, cargo, email, telefone
- LinkedIn profile
- Responsável por procurement

Status:
✅ IMPLEMENTADO PARCIAL
- Apollo preview mostra decisores
- Falta: Revelar contatos (custa $1/contato)
```

### **7. COMPANY PROFILES**
```
O que mostra:
- Histórico de importação (últimos 5 anos)
- Principais fornecedores
- Produtos importados
- Volume financeiro
- Crescimento

Status:
🔧 EM DESENVOLVIMENTO
- Temos: Tab "Internacional" no CompanyDetailPage
- Falta: Dados históricos de shipment
```

### **8. ALERTS & MONITORING**
```
O que faz:
- Alertas quando empresa importa novo produto
- Notifica quando concorrente perde cliente
- Monitora novos importadores entrando no mercado

Status:
❌ NÃO IMPLEMENTADO
🔧 Fase futura
```

---

## 🎯 ROADMAP DE IMPLEMENTAÇÃO

### **✅ FASE 1: CONCLUÍDA (HOJE)**
- [x] HS Code Autocomplete (UN Comtrade)
- [x] Multi-source search (Apollo + Serper 30 portais)
- [x] Fit Score automático
- [x] Custom keywords (dialetos)
- [x] Tabela expandível
- [x] SaveBar protection

### **🔧 FASE 2: PRÓXIMA SEMANA**
- [ ] ImportGenius integration (Bill of Lading USA)
- [ ] Volza integration (Import data global)
- [ ] Buyer discovery (quem importa HS Code)
- [ ] Competitor tracking básico

### **📋 FASE 3: PRÓXIMO MÊS**
- [ ] Company historical data
- [ ] Shipment timeline
- [ ] Alerts & monitoring
- [ ] Phantom Buster (LinkedIn automation)

---

## 💰 CUSTOS PARA REPLICAR 100% PANJIVA

| Feature | Solução | Custo Mensal |
|---------|---------|--------------|
| HS Code Lookup | ✅ UN Comtrade | $0 |
| Supplier Search | ✅ Apollo + Serper | $150 |
| Bill of Lading USA | ImportGenius | $500 |
| Bill of Lading Global | Volza | $1,200 |
| Decision Makers | Apollo + Hunter.io | $200 |
| LinkedIn Automation | Phantom Buster | $99 |
| **TOTAL** | **Panjiva-like** | **$2,149/mês** |

**Panjiva real:** $3,500-10,000/mês (enterprise)  
**Nossa solução:** $2,149/mês = **38% mais barato!**

---

## 📊 COMPARAÇÃO: NOSSA PLATAFORMA vs PANJIVA

| Funcionalidade | Panjiva | Nossa Plataforma |
|----------------|---------|------------------|
| HS Code Autocomplete | ✅ | ✅ **IMPLEMENTADO** |
| Multi-source Search | ❌ (só shipment data) | ✅ **Apollo+Serper (30)** |
| Custom Keywords | ❌ | ✅ **Com dialetos** |
| Fit Score Auto | ❌ | ✅ **Web scraping** |
| Decision Makers | ✅ $1/contact | ✅ **Apollo preview** |
| Bill of Lading | ✅ USA only | ⏳ **Próxima fase** |
| Competitor Track | ✅ | ⏳ **Próxima fase** |
| Alerts | ✅ | ⏳ **Fase 3** |

**Nossa vantagem:**
- ✅ Multi-source (Panjiva só usa shipment data)
- ✅ Custom keywords (Panjiva não tem)
- ✅ Fit Score automático (Panjiva não tem)
- ✅ Multi-tenant (Panjiva não é)

**Falta implementar:**
- ❌ Bill of Lading (shipment history)
- ❌ Competitor tracking automático

