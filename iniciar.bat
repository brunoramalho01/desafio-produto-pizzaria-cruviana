@echo off
setlocal
title Script Pizzaria Cruviana - Iniciar
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e execute novamente.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo Instalando dependencias do front-end ^(somente na primeira vez^)...
  pushd frontend
  call npm install
  if errorlevel 1 (
    popd
    echo [ERRO] Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
  popd
)

echo Liberando as portas 4000 e 5173 caso haja uma execucao anterior...
powershell -NoProfile -Command "foreach($p in 4000,5173){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"

echo Iniciando o mock em http://localhost:4000 ...
start "Mock - Cruviana (porta 4000)" cmd /k "cd /d %~dp0 && node mock\server.js"

echo Iniciando o front-end em http://localhost:5173 ...
start "Front-end - Cruviana (porta 5173)" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5173 --strictPort"

echo Aguardando os servidores subirem...
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo Pronto! O navegador foi aberto em http://localhost:5173
echo Para encerrar, feche as duas janelas "Mock" e "Front-end".
timeout /t 5 >nul
endlocal
