# Script PowerShell genérico para deploy de Edge Functions do Supabase
# Uso: .\deploy-edge-function.ps1 -FunctionName "nome-da-funcao"
# Exemplo: .\deploy-edge-function.ps1 -FunctionName "enrich-apollo-decisores"

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName
)

Write-Host "🚀 Iniciando deploy da Edge Function: $FunctionName" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
$functionPath = "supabase\functions\$FunctionName\index.ts"
if (-not (Test-Path $functionPath)) {
    Write-Host "❌ Erro: Arquivo não encontrado em: $functionPath" -ForegroundColor Red
    Write-Host "   Certifique-se de executar este script na raiz do projeto." -ForegroundColor Yellow
    Write-Host "   E que a função '$FunctionName' existe em supabase/functions/" -ForegroundColor Yellow
    exit 1
}

# Verificar se o Supabase CLI está instalado
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Supabase CLI: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Fazer o deploy
Write-Host "`n📦 Fazendo deploy da função..." -ForegroundColor Cyan
Write-Host "   Função: $FunctionName" -ForegroundColor Gray
Write-Host "   Caminho: supabase/functions/$FunctionName" -ForegroundColor Gray
Write-Host ""

try {
    # Navegar para o diretório da função e fazer deploy
    Push-Location "supabase\functions\$FunctionName"
    
    $deployOutput = supabase functions deploy $FunctionName 2>&1
    $deploySuccess = $LASTEXITCODE -eq 0
    
    if ($deploySuccess) {
        Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
        Write-Host $deployOutput -ForegroundColor Gray
    } else {
        Write-Host "`n❌ Erro durante o deploy:" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        
        # Verificar erros comuns
        if ($deployOutput -match "not authenticated" -or $deployOutput -match "unauthorized") {
            Write-Host "`n💡 Solução: Execute 'supabase login' primeiro" -ForegroundColor Yellow
        }
        
        if ($deployOutput -match "not linked" -or $deployOutput -match "project not found") {
            Write-Host "`n💡 Solução: Execute 'supabase link' para vincular ao projeto" -ForegroundColor Yellow
        }
        
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
} catch {
    Write-Host "`n❌ Erro inesperado durante o deploy:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "`n🎉 Deploy finalizado! A função está disponível em produção." -ForegroundColor Green
Write-Host ""
