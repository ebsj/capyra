# Capyra Social: desenvolvimento local e teste posterior

Esta entrega usa Wrangler local para Workers, D1, R2 e Queues, com Docker para o Python. Os dados podem ser descartáveis. O simulador não comprova a integração Zernio nem o gate white label. Veja [evidências](validation.md) e [especificação](spec.md).

## Preparar e iniciar

Na raiz da worktree:

```bash
npm ci
uv sync --frozen --group dev --project apps/ai
```

Crie `apps/api/.dev.vars` a partir de `.dev.vars.example`, se ainda não existir, preservando qualquer configuração local própria. Para esta validação, mantenha `OPENAI_API_KEY` e `ZERNIO_API_KEY` vazios e configure:

```dotenv
CAPYRA_ENVIRONMENT=local
CAPYRA_AUTH_ISSUER=http://localhost:5080
CAPYRA_WEB_BASE_URL=http://localhost:3000
CAPYRA_AUTH_SIGNING_KEY=capyra-local-only-signing-key-32-chars
CAPYRA_SOCIAL_PROVIDER=mock
ZERNIO_API_BASE_URL=https://zernio.com/api/v1
ZERNIO_WEBHOOK_SECRET=local-only-webhook-secret
```

Com Docker iniciado, execute `npm run dev:cloudflare`. O script aplica **somente migrations locais** e inicia API `http://localhost:5080`, web `http://localhost:3000`, MCP `http://localhost:5090` e site `http://localhost:3001`. A saúde do container fica em `http://localhost:5080/__dev/container-health`, exclusivamente em ambiente local. Interrompa com Ctrl+C. Nenhum comando deste roteiro faz deploy.

Em macOS com limite baixo de arquivos, use `ulimit -n 8192` antes de iniciar. Em filesystem com polling necessário, use `CHOKIDAR_USEPOLLING=true CHOKIDAR_INTERVAL=1000 npm run dev:cloudflare`. `NODE_OPTIONS=--dns-result-order=ipv4first` mantém o bind local por IPv4; para DAST via Docker, inicie também com `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=host.docker.internal` para permitir somente esse hostname adicional no servidor de desenvolvimento. Se o cache padrão estiver sem permissão, `npm ci --cache /tmp/capyra-npm-cache` e `BUILDX_CONFIG=/tmp/capyra-buildx` evitam alterá-lo.

## Percurso local

1. Crie uma Conta descartável e confirme o nome/fuso da Marca inicial em **Marcas**. Contas legadas recebem Marca inicial; análises anteriores continuam sem Marca até atribuição manual.
2. Em **Equipe**, crie convite para um e-mail definido e copie o link. O aceite real usa login Firebase com e-mail verificado correspondente. A concorrência, expiração e revogação são verificadas nos testes locais com Firebase simulado.
3. Carregue vídeo/imagem na **Biblioteca**, escolhendo a Marca. Aguarde a inspeção do container. Ela não chama OpenAI. Análises aceitam somente vídeos até 180 segundos; a ausência de chave OpenAI resulta em falha explícita e liberação da reserva, nunca relatório fictício.
4. Em **Conexões**, conecte Instagram, TikTok, YouTube e LinkedIn. No modo mock a autorização retorna ao callback local, com identidades sintéticas verificadas. Escolha uma mídia e crie Publicação com Destinos independentes. Confirme privacidade, prévia e consentimentos TikTok.
5. Publique no simulador ou agende. O detalhe mostra versão, tentativas e estado de cada Destino. Um horário distante permanece no Capyra até T−6 dias. Cancele um agendamento e aguarde confirmação antes de editar.
6. Consulte Posts externos/Métricas, Uso, Notificações e Auditoria. Teste uma Conta distinta para confirmar isolamento. Arquive uma Marca após os cancelamentos/desconexões; o histórico fica somente leitura. A restauração exige conectar novamente.

Headers `Idempotency-Key` são obrigatórios em submit/cancel/retry e atravessam o proxy web. Repita a mesma chave somente para a mesma operação. `Retry-After` também atravessa o proxy. Novas análises e uploads sem `brandId` são incompatíveis por decisão explícita; CLI exige `--brand-id`, MCP exige `brandId`, e `whoami`/`auth_status` listam Marcas.

## Verificações reproduzíveis

```bash
npm run contracts:generate
npm run typecheck
npm test
npm -w @capyra/web run lint
uv run --project apps/ai pytest apps/ai/tests
npm run security:local -- --continue-on-error
npm run security:images -- --image ai
npm run check:cloudflare
```

`check:cloudflare` verifica bindings e empacota em dry-run; **não publica**. Pare o servidor web antes desse comando e reinicie para o smoke: o build pode substituir os mesmos artefatos usados pelo vinext dev. Os testes Worker usam D1/R2/Queues locais; os testes sociais interceptam o transporte real ou selecionam o simulador explicitamente. Há casos de DST, T−6 dias, leases/DLQ, 207, 429, timeout após escrita, webhooks duplicados/atrasados, saldo concorrente, ciclo mensal, convites e retenção.

Cron local pode ser acionado explicitamente: pare o stack e inicie a API com `npm -w @capyra/api run dev -- --test-scheduled`; use `curl "http://localhost:5080/__scheduled?cron=*/5%20*%20*%20*%20*"` para reconciliação e `curl "http://localhost:5080/__scheduled?cron=17%203%20*%20*%20*"` para o processamento diário. Esses gatilhos são do emulador; os testes Worker usam relógio controlado e não aguardam dias reais.

DAST é restrito aos quatro serviços locais. No Docker Desktop use `host.docker.internal` como host dos alvos; o hostname localhost dentro do container aponta para ele próprio. A evidência final registra os alvos alcançados e limitações do spider. Esses scans não substituem os testes autenticados de papéis/isolamento.

## Provisionamento operacional

Oferta registrada: R$ 999/mês, cinco Marcas, quinze identidades por ciclo, cinco Operadores e cinquenta análises. Marca adicional: R$ 199/mês e mais três identidades; pacote: R$ 149 por cinquenta análises. Não há cobrança automática nem endpoint para o cliente conceder saldo.

```bash
node tools/provision-social.mjs --account-id UUID_DA_CONTA --idempotency-key UUID_DA_OPERACAO --analysis-packs 1 --reason 'Pacote autorizado pelo operador'
```

O comando apresenta SQL para revisão. `--apply` executa exclusivamente em D1 **local**. `--add-brands N` e `--subscription active|inactive` também são suportados. Reutilize a chave numa repetição da mesma operação; mudar o conteúdo com a mesma chave é recusado. A concessão fica registrada na auditoria. Créditos incluídos expiram no aniversário mensal UTC; pacotes são consumidos depois e exigem assinatura ativa.

## Configurar o teste real após a entrega

Somente quando decidir executar a prova, altere o arquivo local não versionado:

```dotenv
CAPYRA_SOCIAL_PROVIDER=zernio
ZERNIO_API_BASE_URL=https://zernio.com/api/v1
ZERNIO_API_KEY=TOKEN_FORNECIDO_PELO_USUARIO
ZERNIO_WEBHOOK_SECRET=SEGREDO_COMPARTILHADO_DO_WEBHOOK
```

Não há fallback para mock se faltar token. O adaptador aceita apenas o host oficial configurado. O callback é **GET/POST `/api/v1/social-connections/callback`**, derivado de `CAPYRA_AUTH_ISSUER`, com sessão aleatória de quinze minutos/uso único. O retorno à aplicação usa `CAPYRA_WEB_BASE_URL`. O endpoint de webhook é **POST `/api/v1/social-webhooks/zernio`**; verifica `X-Zernio-Signature` como HMAC-SHA256 hexadecimal do corpo bruto com o segredo compartilhado. Configure o mesmo segredo no Zernio.

O fornecedor pode exigir uma URL HTTPS alcançável para callback/webhook. Criar túnel ou tornar a API acessível externamente não foi realizado. Para esse teste posterior, o issuer usado pelo Worker e pelos consumidores precisa coincidir com a origem escolhida; o script local padrão fixa localhost e deve ser ajustado conscientemente para esse contexto. R2 deve continuar privado: o Worker transfere a mídia por streaming.

Use uma Marca/contas de teste para executar a [matriz de prova white label](../../docs/plans/capyra-social.md): autorização das quatro redes, identidade nativa servidor a servidor, seleção protegida Instagram e LinkedIn, reconexão, formatos/permissões, publicação, cancelamento, importação e atualização de métricas. Registre campos observados, resposta/horário e resultado por rede sem guardar tokens. Handle e ID do fornecedor nunca substituem identidade nativa comprovada. Uma conexão sem essa evidência fica pendente; reconexão insegura é bloqueada antes do OAuth.

**Pendente do usuário:** prova real Zernio, branding OAuth/white label, publicações reais, métricas reais e resultados comerciais do piloto. Nenhum desses gates foi aprovado pelos testes locais.


## LinkedIn

Em **Marcas → Conexões**, escolha **LinkedIn → Conectar**. Em modo mock, o
callback local ativa uma identidade sintética para testar a interface e a fila.
Em modo Zernio, o OAuth solicita somente as áreas `posting,analytics`. A seleção de perfil pessoal ou página é feita no Capyra, a
partir de `GET /connect/pending-data`. A identidade nativa (`urn:li:person:…`
ou `urn:li:organization:…`) vem exclusivamente dessa resposta servidor a
servidor. A reconexão exige a mesma identidade; ausência de evidência bloqueia
a conexão, sem usar handle ou ID do fornecedor como substituto.

Formatos disponíveis: texto sem mídia (não vazio), uma imagem, carrossel de
2 a 20 imagens ou um vídeo. Texto tem limite de 3.000 caracteres; imagens
JPEG/PNG/GIF, até 8 MB cada. Vídeo MP4/MOV/AVI tem mínimo de 3 segundos,
máximo de 10 minutos em perfil pessoal ou 30 minutos em página, proporção
entre 1:2.4 e 2.4:1 e o teto de upload do Capyra (200 MB). Capas personalizadas,
documentos, enquetes e republicações não integram este escopo.

O filtro **LinkedIn** aparece em Métricas sociais. URLs de importação aceitam
HTTPS em `linkedin.com` e subdomínios; a disponibilidade de histórico e métricas
depende das permissões e do tipo de conta. Métricas ausentes continuam
indisponíveis. Perfis pessoais têm métricas apenas dos posts publicados pelo
provedor; conectar uma rede adicional não aumenta a franquia de identidades.

A migration `0008_social_linkedin.sql` amplia a rede permitida preservando IDs,
referências e índices de isolamento. Aplique localmente com o comando habitual
de migrations; a aplicação remota faz parte de um deploy autorizado.

Referências: [LinkedIn](https://docs.zernio.com/platforms/linkedin),
[dados OAuth pendentes](https://docs.zernio.com/connect/get-pending-oauth-data),
[seleção de perfil/página](https://docs.zernio.com/connect/select-linkedin-organization).
