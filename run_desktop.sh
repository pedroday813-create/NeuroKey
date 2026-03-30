#!/bin/bash
# ===========================================
# MindDriveAI - Iniciar Aplicacao Desktop
# ===========================================
# Este script inicia a aplicacao desktop do MindDriveAI.
# Requer Python 3.11 ou superior instalado no sistema.
# ===========================================

set -e

echo ""
echo "=========================================="
echo "        MindDriveAI Desktop"
echo "=========================================="
echo ""

# Verificar se Python esta instalado
if ! command -v python3 &> /dev/null; then
    echo "[ERRO] Python3 nao encontrado no sistema."
    echo ""
    echo "Por favor, instale Python 3.11 ou superior:"
    echo "  Ubuntu/Debian: sudo apt install python3.11 python3.11-venv"
    echo "  macOS: brew install python@3.11"
    echo ""
    exit 1
fi

# Verificar versao do Python
PYVER=$(python3 --version 2>&1 | cut -d' ' -f2)
echo "[INFO] Python encontrado: $PYVER"

# Verificar se ambiente virtual existe
if [ ! -d ".venv" ]; then
    echo "[INFO] Criando ambiente virtual..."
    python3 -m venv .venv
fi

# Ativar ambiente virtual
echo "[INFO] Ativando ambiente virtual..."
source .venv/bin/activate

# Verificar se dependencias estao instaladas
if ! python -c "import minddriveai" 2>/dev/null; then
    echo "[INFO] Instalando dependencias..."
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    pip install -e .
fi

# Carregar variaveis de ambiente se existir .env
if [ -f ".env" ]; then
    echo "[INFO] Carregando configuracoes de .env..."
    export $(grep -v '^#' .env | xargs)
fi

echo "[INFO] Iniciando MindDriveAI Desktop..."
echo ""
echo "=========================================="
echo ""

python -m minddriveai.main

echo ""
echo "[INFO] MindDriveAI encerrado."
