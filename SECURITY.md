# SECURITY.md

## Política de reporte de vulnerabilidade
Reporte vulnerabilidades de forma privada para o mantenedor do projeto com:
- descrição objetiva do risco,
- passos de reprodução,
- impacto esperado,
- sugestão de correção (opcional).

## Boas práticas adotadas
- API key não salva em plaintext.
- Criptografia AES-GCM para segredo local (opcional).
- Hash de senha local com Argon2id (fallback scrypt).
- Logs sem vazamento de segredo.
- Retry controlado para 408/429.

## Rotação de chave
- Gere nova API key quando houver suspeita de vazamento.
- Revogue chave antiga no console do provedor.
- Atualize a chave no app e, se necessário, regenere `secret.json`.

## Risco residual
Mesmo com chave criptografada localmente, atacante com acesso à máquina/pasta pode tentar extração. Trate senha local como desbloqueio local, não autenticação online.
