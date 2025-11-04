# 📋 FASE 2: ENRIQUECIMENTO PÁGINA PRINCIPAL EMPRESA

**Status:** ⏳ AGUARDANDO CONCLUSÃO DA FASE 1  
**Prioridade:** ALTA (assim que Relatório TOTVS estiver validado)  

---

## 🎯 **OBJETIVO:**

Preencher ~80% dos campos vazios (N/A) na página principal da empresa com dados REAIS.

---

## 📊 **CAMPOS A PREENCHER:**

### **🔴 PRIORIDADE CRÍTICA:**

#### **1. 📦 NCM (Códigos de Importação/Exportação):**
```
FONTE: BrasilAPI NCM
ARQUIVO: src/services/brasilApiComplete.ts
COMPONENTE: CompanyDetailPage.tsx

IMPLEMENTAÇÃO:
1. Buscar NCMs por CNAE (se disponível)
2. Buscar NCMs por palavras-chave do setor
3. Permitir cadastro manual
4. Cross-reference com CNAE
5. Indicar se importa/exporta

EXEMPLO:
CNAE: 46.49-4-99 (Comércio atacadista)
→ NCM sugeridos:
  - 6403.99.00 (Calçados de couro)
  - 6217.10.00 (Acessórios vestuário)
  - 4911.10.10 (Material publicitário)

BENEFÍCIO:
✅ Identifica produtos REAIS
✅ Detecta import/export
✅ Recomenda TOTVS Comércio Exterior
✅ Revenue: +R$ 200K-400K ARR
```

#### **2. 🗺️ Mapa de Localização:**
```
FONTE: Mapbox + BrasilAPI CEP V2
COMPONENTE: LocationMap.tsx (já existe!)

IMPLEMENTAÇÃO:
1. Buscar CEP via BrasilAPI
2. Obter lat/lng precisos
3. Renderizar mapa Mapbox
4. Adicionar pin no endereço
5. Mostrar endereço formatado

EXEMPLO:
CEP: 01.311-927
→ BrasilAPI CEP V2
→ Lat: -23.5617, Lng: -46.6560
→ Endereço: Av. Paulista, 1471, Bela Vista, SP
→ Mapa: Pin preciso na Av. Paulista

BENEFÍCIO:
✅ Visualização clara da localização
✅ Contexto geográfico
✅ Planejamento de rotas
```

#### **3. 🏭 CNAE Principal + Secundárias:**
```
FONTE: Receita Federal (BrasilAPI CNPJ)
JÁ EXISTE: receitaFederal.ts

IMPLEMENTAÇÃO:
1. Buscar dados da Receita
2. Extrair CNAE principal
3. Extrair CNAEs secundários (lista completa)
4. Formatar descrições

EXEMPLO:
CNAE Principal: 46.49-4-99
Descrição: "Comércio atacadista de outros equipamentos..."

CNAEs Secundários (63):
- 13.40-5-99: Acabamento têxtil
- 14.13-4-01: Confecção roupas
- 18.13-0-01: Impressão publicitária
... (60 mais)

BENEFÍCIO:
✅ Entender TODAS as atividades da empresa
✅ Identificar diversificação
✅ Recomendar produtos TOTVS específicos
```

---

### **🟡 PRIORIDADE ALTA:**

#### **4. 👔 Decisores & Colaboradores:**
```
FONTE: PhantomBuster + Hunter.io
JÁ IMPLEMENTADO: phantomBusterEnhanced.ts + hunterEnhanced.ts

IMPLEMENTAÇÃO:
1. Executar análise LinkedIn (PhantomBuster)
2. Verificar emails (Hunter.io)
3. Exibir lista de decisores
4. Mostrar badge "Email verificado ✅"

RESULTADO:
👔 DECISORES IDENTIFICADOS (5):
#1 João Silva (CEO) - joao@empresa.com.br ✅
#2 Maria Santos (CFO) - maria@empresa.com.br ✅
...

BENEFÍCIO:
✅ Contato direto com decisores
✅ Emails 95%+ verificados
✅ Approach cirúrgico
```

#### **5. 💰 Dados Financeiros:**
```
FONTE: Receita Federal + Estimativas
ARQUIVO: receitaFederal.ts

IMPLEMENTAÇÃO:
1. Capital Social (Receita Federal)
2. Porte (Receita Federal)
3. Faturamento (estimativa por porte)
4. Dívidas (se disponível)

EXEMPLO:
Capital Social: R$ 230.000,00
Porte: MICRO EMPRESA
Faturamento estimado: R$ 500K-2M/ano

BENEFÍCIO:
✅ Contexto financeiro
✅ Sizing de proposta
✅ Qualificação de lead
```

#### **6. 👥 Sócios e Administradores:**
```
FONTE: Receita Federal (QSA)
ARQUIVO: receitaFederal.ts

IMPLEMENTAÇÃO:
1. Extrair QSA da Receita
2. Listar sócios e administradores
3. Mostrar qualificação (Sócio, Administrador, etc.)

EXEMPLO:
SÓCIOS E ADMINISTRADORES (3):
#1 João Silva
   Qualificação: Sócio Administrador

#2 Maria Santos
   Qualificação: Sócio

#3 Pedro Costa
   Qualificação: Diretor

BENEFÍCIO:
✅ Estrutura de poder mapeada
✅ Identificar quem decide
✅ Abordagem estratégica
```

---

### **🟢 PRIORIDADE MÉDIA:**

#### **7. 📞 Validação de Telefones:**
```
FONTE: BrasilAPI DDD
ARQUIVO: brasilApiComplete.ts

IMPLEMENTAÇÃO:
1. Extrair DDD dos telefones
2. Validar com BrasilAPI
3. Marcar válidos/inválidos
4. Badge verde/vermelho

BENEFÍCIO:
✅ Telefones validados
✅ Evitar ligações para números errados
```

#### **8. 📦 Descrição de Produtos:**
```
FONTE: NCM + OpenAI
ARQUIVOS: brasilApiComplete.ts + OpenAI

IMPLEMENTAÇÃO:
1. Buscar descrição NCM (BrasilAPI)
2. Enriquecer com IA (GPT-4o-mini)
3. Listar produtos comercializados

EXEMPLO:
PRODUTOS (baseado em NCM):
1. Calçados de couro importados
   NCM: 6403.99.00
   Origem: China, Vietnã
   
2. Acessórios de vestuário
   NCM: 6217.10.00
   Origem: Bangladesh

BENEFÍCIO:
✅ Catálogo de produtos
✅ Entender mercado da empresa
✅ Recomendar TOTVS específico
```

---

## 🎯 **ARQUIVOS A MODIFICAR (FASE 2):**

### **Principais:**
1. `src/pages/CompanyDetailPage.tsx` (página principal)
2. `src/hooks/useCompanyEnrichment.ts` (novo - enriquecimento)
3. `src/components/company/NCMSection.tsx` (novo)
4. `src/components/company/LocationMapSection.tsx` (novo)
5. `src/components/company/DecisorsSection.tsx` (novo)

### **Serviços a usar:**
1. ✅ `src/services/brasilApiComplete.ts` (NCM, CNAE, CEP, DDD)
2. ✅ `src/services/receitaFederal.ts` (CNPJ completo)
3. ✅ `src/services/phantomBusterEnhanced.ts` (Decisores)
4. ✅ `src/services/hunterEnhanced.ts` (Emails)
5. ✅ `src/components/map/LocationMap.tsx` (Mapa)

---

## ✅ **CONCLUSÃO:**

### **QUANDO QUISER FAZER FASE 2, DIGA:**

> "Vamos fortalecer a região da empresa"

**OU:**

> "Implementar NCM + CNAE + Mapa na página principal"

**OU:**

> "Enriquecer CompanyDetailPage"

---

**Eu vou lembrar de tudo e implementar sequencialmente!** ✅

**Documentação salva em:**
- `FASE_2_ENRIQUECIMENTO_EMPRESA.md`
- `PROMPT_PARA_FASE_2_ENRIQUECIMENTO.md`
- `MAPA_COMPLETO_APIS_FEATURES.md`

**Git:** Commit 820bbed ✅

---

**AGORA vamos FOCAR NA FASE 1: Finalizar e validar o Relatório TOTVS!** 🎯

