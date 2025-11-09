# 🔍 VERIFICAR LOGS DO UPLOAD

## PASSO 1: ACESSAR LOGS DO SUPABASE

1. Vá para: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
2. Clique em `bulk-upload-companies`
3. Vá na aba **"Logs"**
4. Filtre por **últimos 1 hora**

## O QUE PROCURAR:

### ✅ SE FUNCIONOU:
```
✅ Successfully saved company: [nome] ([id])
📊 Upload complete: 133 success, 0 errors
```

### ❌ SE FALHOU:
```
❌ Error saving company at row X: [erro]
ERROR: [mensagem de erro]
```

## POSSÍVEIS ERROS:

### 1. RLS BLOQUEANDO O EDGE FUNCTION
```
Error: new row violates row-level security policy
```
**SOLUÇÃO:** Desabilitar RLS ou criar política para service_role

### 2. COLUNA OBRIGATÓRIA FALTANDO
```
Error: null value in column "X" violates not-null constraint
```
**SOLUÇÃO:** Verificar schema da tabela

### 3. TIPO DE DADO INCOMPATÍVEL
```
Error: invalid input syntax for type [tipo]
```
**SOLUÇÃO:** Ajustar mapeamento de campos

### 4. CONSTRAINT VIOLADA
```
Error: duplicate key value violates unique constraint
```
**SOLUÇÃO:** Verificar se CNPJ já existe

## ME ENVIE:

1. ✅ Screenshot dos logs do Edge Function
2. ✅ Copie e cole qualquer erro que aparecer
3. ✅ Total de success/errors que aparece no final

