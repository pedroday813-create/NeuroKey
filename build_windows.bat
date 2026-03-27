@echo off
setlocal

if not exist .venv (
  py -3.11 -m venv .venv
)

call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

pyinstaller --clean --noconfirm pyinstaller\MindDriveAI.spec
pyinstaller --clean --noconfirm --onefile --windowed --name MindDriveAI-OneFile --icon src\assets\icon.ico src\minddriveai\main.py

echo Build concluido em dist\
endlocal
