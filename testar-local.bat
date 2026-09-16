@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SEMAE - Teste Local (porta 4000)

echo ============================================================
echo   SEMAE - Servidor de teste LOCAL e ISOLADO
echo   Banco em memoria, dados ficticios. Nao toca na producao.
echo   Porta: 4000  ^|  Login: admin  ^|  Senha: teste123
echo ============================================================
echo.
echo   Aguarde: construir schema, popular dados e iniciar o Next.
echo   O navegador abre sozinho quando estiver pronto.
echo   Para encerrar: feche esta janela ou pressione Ctrl+C.
echo.

npx tsx scripts/preview-local.ts

echo.
echo Servidor encerrado.
pause
