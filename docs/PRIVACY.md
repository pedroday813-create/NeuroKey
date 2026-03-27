# PRIVACY.md

## O que o MindDriveAI salva localmente
- `./data/minddriveai.db`:
  - conversas, mensagens, resumos, configurações, métricas diárias agregadas.
- `./data/logs/app.log`:
  - metadados de execução e erros.
  - por padrão não salva conteúdo completo de mensagens.
  - nunca deve registrar API key.
- `./data/exports/*.txt` e `./data/exports/*.md`:
  - exportações feitas pelo usuário.
- `./data/secret.json` (somente se usuário optar):
  - API key criptografada (AES-GCM), metadados de KDF e hash da senha local.

## O que NÃO é salvo por padrão
- API key em texto puro.
- Senha local em texto puro.
- Chave de criptografia derivada.
- Telemetria remota.

## Telemetria
- `telemetry_opt_in` padrão OFF.
- Se ON: grava apenas métricas agregadas locais (tokens, tempo, erros), sem conteúdo e sem envio para internet.

## Transferência para terceiros
- O app não envia dados para serviços externos além da Gemini API para processar prompts/respostas.
