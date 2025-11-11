# 🎯 COMO ATUALIZAR COM PREÇOS E MEDIDAS REAIS

## ⚠️ IMPORTANTE: DADOS ATUAIS SÃO ESTIMADOS!

Os dados que importei são **ESTIMATIVAS DE MERCADO**, não os preços reais da MetaLife:

### ❌ DADOS ESTIMADOS (INVENTADOS):
- **Preços USD/BRL:** Baseados em média de mercado internacional
- **Pesos:** Estimativas típicas de equipamentos Pilates
- **Dimensões:** Medidas aproximadas de equipamentos similares

### ✅ DADOS REAIS (DO SITE):
- **Nomes dos produtos:** MetaLife reais
- **Linhas:** Infinity, W23, Advanced (reais)
- **Fotos:** URLs reais do site metalifepilates.com.br
- **HS Code:** 9506.91.00 (correto para equipamentos de ginástica)

---

## 📋 OPÇÃO 1: ATUALIZAR DIRETO NA PLATAFORMA (MAIS FÁCIL)

### No Catálogo de Produtos:

1. **Clique no ícone de edição** (✏️) em cada produto
2. **Atualize os campos:**
   - **Preço USD:** Preço real em dólares
   - **Preço BRL:** Preço real em reais
   - **Peso (kg):** Peso real do equipamento
   - **Dimensões (cm):** Formato: `240x60x35` (comprimento x largura x altura)
   - **Volume (m³):** Calcular: (comp × larg × alt) ÷ 1.000.000
3. **Salvar**

**Exemplo de cálculo de volume:**
```
Reformer: 240cm × 60cm × 35cm = 504.000 cm³
504.000 ÷ 1.000.000 = 0.504 m³
```

---

## 📋 OPÇÃO 2: ATUALIZAR VIA CSV E RE-IMPORTAR

### Passos:

1. **Deletar os produtos atuais** (usar seleção em massa)
2. **Buscar os preços reais:**
   - Site da MetaLife: https://metalifepilates.com.br/
   - Tabelas de preço internas
   - Catálogos comerciais
3. **Editar o arquivo CSV:**
   - Abrir `METALIFE_PRECOS_REAIS_TEMPLATE.csv`
   - Substituir todos os `TROCAR_PRECO_USD` pelos preços reais
   - Substituir `TROCAR_PRECO_BRL` pelos preços em reais
   - Substituir `TROCAR_PESO` pelos pesos reais
   - Substituir `TROCAR_DIMENSOESxxx` pelas dimensões reais (formato: 240x60x35)
   - Substituir `TROCAR_VOLUME` pelo volume calculado
4. **Re-importar o CSV atualizado**

---

## 📋 OPÇÃO 3: MANTER COMO ESTÁ E AJUSTAR DEPOIS

Se você NÃO TIVER os preços reais agora:

### ✅ VANTAGENS DE MANTER OS DADOS ESTIMADOS:
1. **Você já tem um catálogo funcional** para apresentar
2. **Pode testar todas as funcionalidades** (propostas, cálculos, etc.)
3. **Pode ajustar depois** quando tiver os dados reais
4. **Melhor ter dados aproximados do que catálogo vazio**

### ⚠️ CUIDADO:
- **NÃO use para propostas comerciais REAIS** até atualizar
- Deixe uma nota: "Preços sujeitos a confirmação"

---

## 🎯 ONDE BUSCAR OS DADOS REAIS DA METALIFE?

### 1️⃣ **Site Oficial:**
https://metalifepilates.com.br/

**Procure por:**
- Páginas de produto (pode ter preços)
- Fichas técnicas (tem dimensões e pesos)
- Catálogos PDF

### 2️⃣ **Contato Direto:**
- Falar com setor comercial da MetaLife
- Solicitar tabela de preços atualizada
- Pedir fichas técnicas dos equipamentos

### 3️⃣ **Documentos Internos:**
- Notas fiscais de compras anteriores
- Catálogos físicos da MetaLife
- E-mails com cotações

---

## 📊 TABELA DE REFERÊNCIA: O QUE MUDAR

| Campo | Valor Atual (ESTIMADO) | Como Obter REAL |
|-------|------------------------|-----------------|
| **price_usd** | 3500, 4200, 5200 | Tabela de preços MetaLife |
| **price_brl** | 19250, 23100, 28600 | Conversão ou tabela BR |
| **weight_kg** | 85, 90, 120 | Ficha técnica do produto |
| **dimensions_cm** | 240x60x35 | Manual do equipamento |
| **volume_m3** | 0.504 | Calcular: (L×W×H)÷1.000.000 |
| **moq** | 1 | Política comercial (min order) |

---

## 💡 DICA: COMEÇAR COM 1-2 PRODUTOS REAIS

Em vez de atualizar todos de uma vez:

1. **Escolha 1-2 produtos principais** (ex: Reformer Infinity)
2. **Busque os dados reais** só desses
3. **Atualize na plataforma**
4. **Teste gerando uma proposta comercial** com esses produtos
5. **Se funcionar bem, atualize os demais**

---

## 🚀 MINHA RECOMENDAÇÃO:

### Para AGORA:
1. **Mantenha os dados atuais** para testar o sistema
2. **Marque os produtos** como "Preços estimados" (na descrição)
3. **Teste todas as funcionalidades** (propostas, cálculos de frete, etc.)

### Para DEPOIS (nos próximos dias):
1. **Busque os dados reais** da MetaLife
2. **Atualize produto por produto** via edição direta
3. **Ou delete tudo e re-importe** um CSV corrigido

---

## ❓ PRECISA DOS DADOS REAIS AGORA?

Se você **PRECISA** dos dados reais URGENTE:

1. **Me passe os preços reais** (se tiver)
2. **Ou me dê acesso** a um catálogo/tabela de preços
3. **Eu atualizo o CSV** com os dados corretos
4. **Você re-importa** em 2 minutos

**Exemplo do que preciso:**
```
Reformer Infinity: R$ 22.500 (USD 4.100)
Peso: 92 kg
Dimensões: 245cm × 65cm × 38cm
```

---

## 📞 RESUMO:

✅ **Sistema funcionando:** Upload CSV OK  
⚠️ **Dados estimados:** Preços e medidas são aproximados  
💡 **3 opções:** Editar na plataforma, re-importar CSV, ou manter assim por enquanto  
🎯 **Recomendação:** Use para testar, atualize depois com dados reais  

**ME AVISE:** Você tem os preços reais agora ou quer manter assim por enquanto?

