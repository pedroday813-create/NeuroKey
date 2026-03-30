@echo off
REM ===========================================
REM MindDriveAI - Iniciar Aplicacao Desktop
REM ===========================================
REM Este script inicia a aplicacao desktop do MindDriveAI.
REM Requer Python 3.11 ou superior instalado no sistema.
REM ===========================================

title MindDriveAI Desktop

echo.
echo ==========================================
echo         MindDriveAI Desktop
echo ==========================================
echo.

REM Verificar se Python esta instalado
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado no sistema.
    echo.
    echo Por favor, instale Python 3.11 ou superior:
    echo https://www.python.org/downloads/
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

REM Verificar versao do Python
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYVER=%%i
echo [INFO] Python encontrado: %PYVER%

REM Verificar se ambiente virtual existe
if not exist ".venv" (
    echo [INFO] Criando ambiente virtual...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao criar ambiente virtual.
        pause
        exit /b 1
    )
)

REM Ativar ambiente virtual
echo [INFO] Ativando ambiente virtual...
call .venv\Scripts\activate.bat

REM Verificar se dependencias estao instaladas
python -c "import minddriveai" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Instalando dependencias...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    pip install -e .
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

REM Carregar variaveis de ambiente se existir .env
if exist ".env" (
    echo [INFO] Carregando configuracoes de .env...
    for /f "tokens=*" %%a in ('type .env ^| findstr /v "^#" ^| findstr /v "^$"') do set %%a
)

echo [INFO] Iniciando MindDriveAI Desktop...
echo.
echo ==========================================
echo.

python -m minddriveai.main

echo.
echo [INFO] MindDriveAI encerrado.
pause
