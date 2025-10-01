@echo off
echo Gerando NEXTAUTH_SECRET para o Vercel...
echo.

REM Tenta usar OpenSSL se estiver disponível
where openssl >nul 2>&1
if %errorlevel% equ 0 (
    echo Usando OpenSSL para gerar secret seguro:
    openssl rand -base64 32
    echo.
) else (
    echo OpenSSL nao encontrado. Gerando secret alternativo...
    echo.
    echo SECRET GERADO:
    powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32, 8)"
    echo.
)

echo.
echo =====================================================
echo COPIE O SECRET ACIMA E USE NO VERCEL!
echo =====================================================
echo.
echo Passos para configurar no Vercel:
echo 1. Acesse: https://vercel.com
echo 2. Va em: Projeto ^> Settings ^> Environment Variables
echo 3. Adicione as variaveis:
echo.
echo    NEXTAUTH_SECRET=[cole-o-secret-acima]
echo    NEXTAUTH_URL=https://koxixo.vercel.app
echo    DATABASE_URL=file:./dev.db
echo.
echo 4. Clique em Redeploy
echo.
pause