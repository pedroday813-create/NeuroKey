# MindDriveAI - Versao Portatil (USB)

Este documento explica como usar o MindDriveAI em um pendrive USB.

---

## Requisitos do Sistema

### Para usar o executavel (.exe):
- Windows 10 ou superior
- **Nenhum software adicional necessario!**
- Conexao com internet (para acessar APIs de IA)

### Para usar via codigo-fonte:
- Python 3.11 ou superior
- pip (gerenciador de pacotes)
- Conexao com internet

---

## Instrucoes de Uso

### Opcao 1: Executavel Standalone (Recomendado)

1. **Copie a pasta** `MindDriveAI_Portable` para seu pendrive
2. **Configure a API key:**
   - Renomeie `.env.example` para `.env`
   - Abra o arquivo `.env` em um editor de texto
   - Adicione sua API key:
     - Para Gemini: `GEMINI_API_KEY=sua_chave_aqui`
     - Para OpenAI: `OPENAI_API_KEY=sua_chave_aqui`
3. **Execute** `MindDriveAI.exe`
4. **Selecione o provider** na primeira execucao

### Opcao 2: Via Codigo-fonte

1. **Copie toda a pasta do projeto** para o pendrive
2. **No computador destino**, abra um terminal na pasta
3. **Execute:**
   ```batch
   # Windows
   run_desktop.bat
   
   # Linux/macOS
   ./run_desktop.sh
   ```

---

## Estrutura de Arquivos

```
MindDriveAI_Portable/
├── MindDriveAI.exe     # Executavel principal
├── .env                # Suas configuracoes (criar a partir do .example)
├── .env.example        # Modelo de configuracao
├── data/               # Dados locais (conversas, configuracoes)
│   ├── minddriveai.db  # Banco de dados SQLite
│   ├── secrets.enc     # API keys criptografadas (opcional)
│   └── exports/        # Conversas exportadas
└── LEIA-ME.md          # Este arquivo
```

---

## Obtendo API Keys

### Google Gemini (Recomendado - Gratuito)
1. Acesse: https://makersuite.google.com/app/apikey
2. Faca login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### OpenAI (ChatGPT - Pago)
1. Acesse: https://platform.openai.com/api-keys
2. Faca login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave gerada
5. **Nota:** Requer adicionar creditos na conta

---

## Resolucao de Problemas

### "API key invalida"
- Verifique se copiou a chave corretamente
- Verifique se a chave nao expirou
- Tente gerar uma nova chave

### "Erro de conexao"
- Verifique sua conexao com a internet
- Verifique se o firewall nao esta bloqueando
- Tente novamente em alguns minutos

### "O programa nao abre"
- Verifique se o Windows Defender nao bloqueou
- Tente executar como administrador
- Verifique se ha antivirus bloqueando

### "Erro de permissao ao salvar"
- Nao execute diretamente do pendrive (lento)
- Copie para uma pasta local temporaria primeiro
- Verifique permissoes de escrita na pasta

---

## Tamanho Recomendado do Pendrive

| Modo | Minimo | Recomendado | Ideal |
|------|--------|-------------|-------|
| Executavel apenas | 500 MB | 1 GB | 2 GB |
| Codigo-fonte + venv | 2 GB | 4 GB | 8 GB |
| Com logs e exports | 4 GB | 8 GB | 16 GB |

---

## Seguranca

- **Nunca compartilhe** seu arquivo `.env` com outras pessoas
- **Suas API keys** sao pessoais e podem gerar custos
- **Dados locais** sao armazenados sem criptografia por padrao
- Para maior seguranca, use a opcao de **salvar API key criptografada** no app

---

## Suporte

- GitHub: https://github.com/pedroday813-create/NeuroKey
- Issues: https://github.com/pedroday813-create/NeuroKey/issues

---

Desenvolvido por Pedro Rodrigues Cruz
Versao 1.0.0
