# MindDriveAI

App desktop Python/Tkinter para Windows 10/11 com Gemini API (`google-genai`), persistência local em SQLite e modo portátil para pendrive. O app suporta streaming, histórico multi-turn, resumo automático, exportação, telemetria local opt-in e armazenamento opcional de API key criptografada.

## Status de pesquisa web oficial
- Gemini API quickstart/API keys/billing/rate limits/tokens/safety: não especificado.
- SDK `google-genai` reference: não especificado.
- PyInstaller docs: não especificado.
- SQLite about: não especificado.
- OWASP Password Storage/Secrets/Key Management: não especificado.
- Microsoft SmartScreen/AutoRun: não especificado.

## Requisitos
- Windows 10/11.
- Python 3.11+ para modo DEV.
- Internet ativa.
- Projeto Google com billing ativo.

## Variáveis de ambiente suportadas
- `MINDDRIVEAI_DATA_DIR` (opcional): muda diretório de dados.
- `GOOGLE_API_KEY` (opcional DEV).
- `GEMINI_API_KEY` (opcional DEV).
- `MINDDRIVEAI_DEV_MODE=1` (opcional): logs mais verbosos.

## Instalação (DEV)
```bat
py -3.11 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m minddriveai.main
```

## Build Windows (PyInstaller)
### `--onedir` (recomendado)
```bat
pyinstaller --clean --noconfirm pyinstaller\MindDriveAI.spec
```

### `--onefile`
```bat
pyinstaller --clean --noconfirm --onefile --windowed --name MindDriveAI-OneFile --icon assets\icon.ico src\minddriveai\main.py
```

### Comparativo PyInstaller
| Critério | `--onedir` | `--onefile` |
|---|---|---|
| Startup | Mais rápido | Mais lento (extração inicial) |
| Tamanho final | Pasta maior, arquivos separados | EXE único maior |
| AV/SmartScreen | Geralmente menos sensível | Pode gerar mais heurística |
| Portabilidade USB | Excelente (copiar pasta inteira) | Excelente (1 arquivo) |
| Debug | Melhor (inspeção fácil) | Mais difícil |

## Portabilidade em pendrive
1. Gere build `--onedir`.
2. Copie `dist\MindDriveAI\` para pendrive.
3. Execute `MindDriveAI.exe` manualmente na máquina destino.
4. O app criará `./data` ao lado do executável (ou em `MINDDRIVEAI_DATA_DIR`).

## Segurança da API key
- Padrão (Opção A): não salvar API key.
- Opção B: salvar criptografada em `./data/secret.json`.
  - Hash da senha local com Argon2id (fallback scrypt).
  - Derivação de chave via scrypt.
  - Criptografia AES-GCM com nonce aleatório.
- Aviso objetivo: chave criptografada no desktop ainda pode ser extraída por atacante com acesso local à máquina/pasta.

## Comparativo Argon2id vs scrypt
| Critério | Argon2id | scrypt |
|---|---|---|
| Segurança | Recomendação moderna para password hashing | Forte, mais antiga |
| Dependências | Requer `argon2-cffi` | Nativo em `hashlib` |
| Performance | Ajustável, robusta contra GPU | Ajustável, bom custo |
| Portabilidade | Boa, depende de wheel | Muito alta |
| Recomendação | Preferido para hash de senha | Fallback quando Argon2 indisponível |

## Funcionalidades implementadas
- Sidebar de conversas: criar, renomear, excluir.
- Chat com scroll e input multi-linha.
- Enter envia / Shift+Enter quebra linha.
- Streaming de resposta e indicador “Gerando...”.
- Cancelamento best-effort (“Parar geração”).
- SQLite com migração por `PRAGMA user_version`.
- Resumo automático quando excede janela de contexto.
- Tokens por mensagem e acumulado.
- Estimativa de custo por 1M tokens com retorno “não especificado” sem preço.
- Retry com backoff+jitter para 408/429.
- Tratamento de offline, auth inválida e bloqueio de safety.
- Export para `.txt` e `.md` em `./data/exports`.
- Telemetria local agregada (opt-in), sem envio externo.

## Troubleshooting
- Erro de ícone no build: substitua `assets/icon.ico` por ícone real.
- API key inválida: gere nova key e teste com variável de ambiente.
- Sem rede: o app mostrará erro de conectividade.
- 429: aguarde; o app faz retry limitado.
- SmartScreen: alerta por reputação do binário não assinado.

## SmartScreen e assinatura (sem bypass)
- SmartScreen pode alertar quando o executável é novo/sem reputação.
- Opções legítimas:
  1. Assinar binário com certificado de code signing OV/EV.
  2. Distribuir por canal confiável para construir reputação.
- Não desative SmartScreen e não use bypass.

## Plano de testes em máquinas diferentes
- Máquina A (DEV com Python): executar `python -m minddriveai.main`.
- Máquina B (limpa, sem Python): executar build `--onedir`.
- Máquina C (outra versão Windows): validar paths e inicialização.
- Pendrive com letra diferente: validar criação de `./data` no novo caminho.

### Checklist de validação
- [ ] Cria `./data` automaticamente.
- [ ] Cria/migra banco SQLite.
- [ ] Envia mensagem para Gemini.
- [ ] Streaming aparece progressivo.
- [ ] Salva e reabre conversa.
- [ ] Exporta `.txt` e `.md`.
- [ ] Modo “não salvar key”.
- [ ] Modo “salvar key criptografada”.
- [ ] Rate limit simulado (mock) tratado.
- [ ] Offline simulado retorna mensagem clara.

## Qualidade e CI/CD
```bat
pre-commit install
pre-commit run --all-files
ruff check .
mypy src
pytest -q
```

## Fora do código
1. Criar API key no AI Studio e associar a projeto correto.
2. Habilitar billing; validar tier/prepay/postpay/spend caps.
3. Configurar limites de uso e monitorar rate limits no console.
4. Não vazar key: não commitar, não imprimir em logs, não publicar screenshots.
5. USB AutoRun/AutoPlay não é requisito; execução manual do EXE é o fluxo suportado.
