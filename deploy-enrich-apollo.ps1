# Script PowerShell para deploy da Edge Function enrich-apollo-decisores
# Uso: .\deploy-enrich-apollo.ps1

Write-Host "Iniciando deploy da Edge Function enrich-apollo-decisores..." -ForegroundColor Cyan

# Verificar se estamos no diretorio correto
if (-not (Test-Path "supabase\functions\enrich-apollo-decisores\index.ts")) {
    Write-Host "ERRO: Arquivo index.ts nao encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de executar este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Verificar se o Supabase CLI esta instalado
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Supabase CLI nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Supabase CLI: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar se esta logado no Supabase
Write-Host "Verificando autenticacao no Supabase..." -ForegroundColor Cyan
try {
    $authCheck = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "AVISO: Parece que voce nao esta logado no Supabase." -ForegroundColor Yellow
        Write-Host "   Execute: supabase login" -ForegroundColor Yellow
        $continue = Read-Host "   Deseja continuar mesmo assim? (s/N)"
        if ($continue -ne "s" -and $continue -ne "S") {
            exit 1
        }
    }
} catch {
    Write-Host "AVISO: Nao foi possivel verificar autenticacao. Continuando..." -ForegroundColor Yellow
}

# Fazer o deploy
Write-Host ""
Write-Host "Fazendo deploy da funcao..." -ForegroundColor Cyan
Write-Host "   Funcao: enrich-apollo-decisores" -ForegroundColor Gray
Write-Host "   Caminho: supabase/functions/enrich-apollo-decisores" -ForegroundColor Gray
Write-Host ""

try {
    # Navegar para o diretorio da funcao e fazer deploy
    Push-Location supabase\functions\enrich-apollo-decisores
    
    $deployOutput = supabase functions deploy enrich-apollo-decisores 2>&1
    $deploySuccess = $LASTEXITCODE -eq 0
    
    if ($deploySuccess) {
        Write-Host ""
        Write-Host "Deploy concluido com sucesso!" -ForegroundColor Green
        Write-Host $deployOutput -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "Erro durante o deploy:" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        
        # Verificar se e erro de autenticacao
        if ($deployOutput -match "not authenticated" -or $deployOutput -match "unauthorized") {
            Write-Host ""
            Write-Host "Solucao: Execute 'supabase login' primeiro" -ForegroundColor Yellow
        }
        
        # Verificar se e erro de projeto nao linkado
        if ($deployOutput -match "not linked" -or $deployOutput -match "project not found") {
            Write-Host ""
            Write-Host "Solucao: Execute 'supabase link' para vincular ao projeto" -ForegroundColor Yellow
        }
        
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
} catch {
    Write-Host ""
    Write-Host "Erro inesperado durante o deploy:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "Deploy finalizado! A funcao esta disponivel em producao." -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   - Teste a funcao atraves do frontend" -ForegroundColor Gray
Write-Host "   - Verifique os logs no Supabase Dashboard se necessario" -ForegroundColor Gray
Write-Host ""
