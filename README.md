# MindDriveAI (NeuroKey)

Assistente de IA pessoal com suporte a **Google Gemini** e **OpenAI (ChatGPT)**.

Disponivel em duas versoes:
- **App Desktop** (Python/Tkinter) - Para uso local, portatil em pendrive
- **App Web** (Next.js) - Para uso no navegador

---

## Funcionalidades

- Suporte a multiplos provedores de IA (Gemini e OpenAI)
- Streaming de respostas em tempo real
- Historico de conversas persistente
- Exportacao de conversas (TXT/Markdown)
- Armazenamento seguro de API keys (criptografado)
- Interface moderna e intuitiva
- Modo portatil para pendrive USB

---

## Requisitos

### App Desktop
- Windows 10/11, macOS ou Linux
- Python 3.11 ou superior
- Conexao com internet

### App Web
- Node.js 18+ ou pnpm
- Navegador moderno

---

## Inicio Rapido

### App Desktop (Recomendado para uso local)

**Windows:**
```batch
run_desktop.bat
```

**Linux/macOS:**
```bash
chmod +x run_desktop.sh
./run_desktop.sh
```

**Ou manualmente:**
```bash
# Criar ambiente virtual
python -m venv .venv

# Ativar (Windows)
.venv\Scripts\activate

# Ativar (Linux/macOS)
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
pip install -e .

# Executar
python -m minddriveai.main
```

### App Web

```bash
# Instalar dependencias
pnpm install

# Executar em desenvolvimento
pnpm dev

# Acessar em http://localhost:3000
```

---

## Configuracao de API Keys

### Opcao 1: Via Interface (Recomendado)
1. Inicie o app
2. Na primeira execucao, selecione o provider (Gemini ou OpenAI)
3. Insira sua API key
4. Opcionalmente, salve a key criptografada localmente

### Opcao 2: Via Variaveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Para Google Gemini
GEMINI_API_KEY=sua_chave_aqui

# Para OpenAI
OPENAI_API_KEY=sua_chave_aqui
```

### Onde obter API Keys

| Provider | URL | Observacoes |
|----------|-----|-------------|
| Google Gemini | https://makersuite.google.com/app/apikey | Nivel gratuito generoso |
| OpenAI | https://platform.openai.com/api-keys | Requer creditos pagos |

---

## Estrutura do Projeto

```
minddriveai/
├── src/
│   ├── app/                    # App Web (Next.js)
│   │   ├── api/chat/          # API route para chat
│   │   ├── page.tsx           # Pagina principal
│   │   └── layout.tsx         # Layout
│   │
│   ├── minddriveai/           # App Desktop (Python)
│   │   ├── ai/                # Providers de IA
│   │   │   ├── base_provider.py
│   │   │   ├── gemini_provider.py
│   │   │   └── openai_provider.py
│   │   ├── ui/                # Interface Tkinter
│   │   ├── core/              # Logica principal
│   │   ├── storage/           # Persistencia SQLite
│   │   └── config/            # Configuracoes
│   │
│   └── components/            # Componentes React (web)
│
├── run_desktop.bat            # Iniciar desktop (Windows)
├── run_desktop.sh             # Iniciar desktop (Linux/macOS)
├── build_portable.bat         # Gerar executavel portatil
├── requirements.txt           # Dependencias Python
└── package.json               # Dependencias Node.js
```

---

## Portabilidade USB

### Gerar Executavel Portatil (Windows)

```batch
build_portable.bat
```

Isso cria uma pasta `dist/MindDriveAI_Portable/` que pode ser copiada para um pendrive.

### Tamanho Recomendado do Pendrive

| Modo | Minimo | Recomendado |
|------|--------|-------------|
| Executavel | 500 MB | 2 GB |
| Codigo-fonte | 2 GB | 8 GB |

### Usar em Outro Computador

**Se tiver o executavel (.exe):**
1. Copie a pasta `MindDriveAI_Portable` para o pendrive
2. Configure `.env` com sua API key
3. Execute `MindDriveAI.exe`
4. Nao precisa de Python instalado!

**Se tiver o codigo-fonte:**
1. Copie todo o projeto para o pendrive
2. O computador destino precisa ter Python 3.11+
3. Execute `run_desktop.bat` ou `run_desktop.sh`

---

## Providers Suportados

### Google Gemini
- Modelos: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, etc.
- Nivel gratuito generoso
- Recomendado para iniciantes

### OpenAI (ChatGPT)
- Modelos: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- Requer creditos pagos
- Mais opcoes de modelos

---

## Resolucao de Problemas

### "API key invalida"
- Verifique se copiou a chave corretamente
- Gere uma nova chave no site do provider
- Verifique se a chave tem permissoes corretas

### "Erro 429 - Rate Limit"
- Aguarde alguns minutos
- Verifique sua cota no site do provider
- Considere upgrade do plano

### "Erro de conexao"
- Verifique sua internet
- Verifique se firewall nao esta bloqueando
- Tente usar VPN se estiver em rede restrita

### "O app nao abre"
- Verifique se Python 3.11+ esta instalado
- Execute manualmente para ver erros
- Verifique antivirus/SmartScreen

---

## Desenvolvimento

### Executar Testes
```bash
pytest -q
```

### Verificar Codigo
```bash
ruff check .
mypy src
```

### Pre-commit Hooks
```bash
pre-commit install
pre-commit run --all-files
```

---

## Seguranca

- API keys sao armazenadas criptografadas localmente (AES-GCM)
- Senhas sao hasheadas com Argon2id
- Nunca commite o arquivo `.env`
- Nao compartilhe suas API keys

---

## Licenca

MIT License - Veja [LICENSE](LICENSE)

---

## Autor

Pedro Rodrigues Cruz

---

## Links Uteis

- [Google AI Studio](https://makersuite.google.com/)
- [OpenAI Platform](https://platform.openai.com/)
- [Documentacao Gemini](https://ai.google.dev/docs)
- [Documentacao OpenAI](https://platform.openai.com/docs)
