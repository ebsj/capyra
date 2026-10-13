# Security Baseline V2

## Escopo operacional

Os alvos locais sao API `5080`, web `3000`, site `3001` e MCP `5090`. DAST
remoto exige alvo explicitamente autorizado. Use somente contas e tokens
descartaveis.

```bash
npm run security:scope
npm run security:local
npm run security:images
npm run security:dast
```

O baseline local cobre Gitleaks, Trivy filesystem, Semgrep TypeScript/Python,
`npm audit --workspaces` e `pip-audit`. O scan de imagem cobre exclusivamente o
Container Python Cloudflare; Workers nao usam imagens Docker.

## Cenarios obrigatorios

- account scoping/BOLA em analyses, assets, feedback e artefatos;
- OAuth redirect/PKCE, refresh rotation, device flow e consumo unico;
- SSRF, redirects, DNS rebinding e metadata cloud no downloader;
- extensao, tamanho, metadata, `ffprobe`, path traversal e objeto R2 ausente;
- CORS, headers, verificacao Firebase e rate limiting sem bloquear clientes API;
- Queue duplicada, retry/DLQ, lease, timeout e crash apos escrita no R2;
- credenciais R2 somente no Worker que assina uploads de producao; o Container
  usa handler privado com metodos, tamanho e paths restritos e recebe apenas a
  chave OpenAI necessaria ao pipeline;
- logs sem bearer, prompt, transcricao, video ou URL assinada.

Aceite: nenhum secret real; nenhum high/critical sem excecao documentada;
nenhum acesso cross-account; nenhuma dependencia runtime de .NET, SQL Server,
Azurite ou Azure Monitor apos a paridade final.


## Superfície Social

Validar associação de Operador vigente, isolamento Conta/Marca, papéis, state de autorização e convite de uso único, assinatura HMAC do corpo bruto e deduplicação durável. Identidade não comprovada bloqueia publicação; handle não é identidade. R2 permanece privado e transferências são servidor a servidor. Não registrar tokens, URLs assinadas, corpos do fornecedor ou mídia. Mock exige configuração local explícita. A prova real de identidade/white label fica pendente do usuário e não é substituída por DAST local.
