# 🔍 COMO VER OS LOGS DO EDGE FUNCTION

## ACESSO DIRETO:

1. Vá para: **https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions**
2. Clique em **`bulk-upload-companies`**
3. Clique na aba **"Logs"**
4. Filtre por **"Last 1 hour"**

## O QUE PROCURAR:

### ✅ SE ESTIVER FUNCIONANDO:
```
✅ Successfully saved company: [nome] ([id])
📊 Upload complete: 133 success, 0 errors
```

### ❌ SE ESTIVER FALHANDO:
```
❌ Error saving company at row X: [mensagem de erro]
```

## ERROS COMUNS:

### 1. RLS BLOQUEANDO (MESMO COM SERVICE_ROLE)
```
Error: new row violates row-level security policy
```

### 2. COLUNA OBRIGATÓRIA FALTANDO
```
Error: null value in column "X" violates not-null constraint
```

### 3. TIPO DE DADO ERRADO
```
Error: invalid input syntax for type [tipo]
```

### 4. FK (FOREIGN KEY) INVÁLIDA
```
Error: insert or update on table "companies" violates foreign key constraint
```

## ME ENVIE:

📸 **Screenshot completo dos logs!**

