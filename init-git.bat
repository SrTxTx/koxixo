@echo off
echo Iniciando repositório Git para o projeto Koxixo...

REM Verifica se Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git não está instalado!
    echo Baixe e instale o Git em: https://git-scm.com/download/windows
    pause
    exit /b 1
)

REM Inicializa o repositório
git init

REM Adiciona todos os arquivos
git add .

REM Primeiro commit
git commit -m "feat: Sistema completo de gestão de pedidos

- Sistema de autenticação com 4 perfis (Admin, Vendedor, Orçamento, Produção)
- CRUD completo de pedidos com fluxo de aprovação
- Gerenciamento de usuários (apenas para admins)
- Dashboard com estatísticas em tempo real
- Interface responsiva com Tailwind CSS
- API RESTful com Next.js
- Banco de dados SQLite com Prisma ORM
- Sistema de reenvio de pedidos rejeitados"

echo.
echo ✅ Repositório Git inicializado com sucesso!
echo.
echo Para enviar para o GitHub:
echo 1. Crie um repositório no GitHub
echo 2. Execute: git remote add origin [URL_DO_SEU_REPOSITORIO]
echo 3. Execute: git branch -M main
echo 4. Execute: git push -u origin main
echo.
pause