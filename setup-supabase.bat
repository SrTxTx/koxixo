@echo off
echo 🚀 Configurando banco de dados Supabase para producao...

REM Configurar variáveis de ambiente temporariamente
set DATABASE_URL=postgresql://postgres.blrjmakfmaznsfoanaoh:Marlisson_27@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
set DIRECT_URL=postgresql://postgres.blrjmakfmaznsfoanaoh:Marlisson_27@aws-1-sa-east-1.pooler.supabase.com:5432/postgres

echo 📝 Gerando cliente Prisma...
call npx prisma generate

echo 🔄 Aplicando migracoes ao banco Supabase...
call npx prisma migrate deploy

echo 🌱 Populando banco com dados iniciais...
call npx prisma db seed

echo ✅ Banco Supabase configurado com sucesso!
echo 🌐 Agora você pode fazer redeploy no Vercel

pause