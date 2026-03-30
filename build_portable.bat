@echo off
REM ===========================================
REM MindDriveAI - Build Executavel Portatil
REM ===========================================
REM Este script cria um executavel standalone usando PyInstaller.
REM O executavel gerado pode ser copiado para um pendrive.
REM ===========================================

title MindDriveAI - Build Portatil

echo.
echo ==========================================
echo   MindDriveAI - Build Executavel Portatil
echo ==========================================
echo.

REM Verificar se Python esta instalado
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado.
    pause
    exit /b 1
)

REM Verificar se ambiente virtual existe
if not exist ".venv" (
    echo [INFO] Criando ambiente virtual...
    python -m venv .venv
)

REM Ativar ambiente virtual
call .venv\Scripts\activate.bat

REM Instalar dependencias
echo [INFO] Instalando dependencias...
pip install -r requirements.txt
pip install -e .
pip install pyinstaller

REM Criar diretorio de build
if not exist "dist" mkdir dist
if not exist "build" mkdir build

REM Executar PyInstaller
echo [INFO] Gerando executavel...
pyinstaller ^
    --name=MindDriveAI ^
    --onefile ^
    --windowed ^
    --icon=src/assets/icon.ico ^
    --add-data="src/minddriveai;minddriveai" ^
    --hidden-import=minddriveai ^
    --hidden-import=minddriveai.ui ^
    --hidden-import=minddriveai.core ^
    --hidden-import=minddriveai.storage ^
    --hidden-import=minddriveai.config ^
    --hidden-import=minddriveai.security ^
    --hidden-import=minddriveai.ops ^
    --hidden-import=minddriveai.ai ^
    --hidden-import=google.genai ^
    --hidden-import=httpx ^
    --hidden-import=cryptography ^
    --clean ^
    src/minddriveai/main.py

if %errorlevel% neq 0 (
    echo [ERRO] Falha ao gerar executavel.
    pause
    exit /b 1
)

REM Criar pasta portatil
echo [INFO] Criando pacote portatil...
set PORTABLE_DIR=dist\MindDriveAI_Portable
if exist "%PORTABLE_DIR%" rmdir /s /q "%PORTABLE_DIR%"
mkdir "%PORTABLE_DIR%"
mkdir "%PORTABLE_DIR%\data"

REM Copiar arquivos
copy dist\MindDriveAI.exe "%PORTABLE_DIR%\"
copy .env.example "%PORTABLE_DIR%\.env.example"
copy docs\PORTABLE_README.md "%PORTABLE_DIR%\LEIA-ME.md" 2>nul || echo. > "%PORTABLE_DIR%\LEIA-ME.md"

echo.
echo ==========================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ==========================================
echo.
echo Pasta portatil criada em: %PORTABLE_DIR%
echo.
echo Conteudo:
echo   - MindDriveAI.exe (executavel)
echo   - .env.example (modelo de configuracao)
echo   - data/ (pasta para dados locais)
echo.
echo Para usar em pendrive:
echo   1. Copie a pasta MindDriveAI_Portable para o pendrive
echo   2. Renomeie .env.example para .env
echo   3. Adicione sua API key no arquivo .env
echo   4. Execute MindDriveAI.exe
echo.
pause
