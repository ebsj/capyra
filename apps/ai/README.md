# Capyra AI Container

`apps/ai` e o Cloudflare Container Python privado que executa o pipeline de
analise. A unica fronteira publica de negocio e `apps/api`; web, MCP e CLI nunca
chamam este app diretamente.

## Fluxo

1. O consumer da Queue chama `POST /jobs/analyze` pelo Container binding.
2. O container baixa a origem do R2 pelo host virtual
   `capyra-r2.internal`, interceptado pelo Worker.
3. `yt-dlp`, `ffprobe` e `ffmpeg` preparam a midia.
4. A OpenAI transcreve e produz o report estruturado.
5. Report e artefatos voltam ao mesmo binding R2 pelo host virtual.
6. A API valida o report, atualiza o D1 e o disponibiliza para polling.

O container nao recebe credenciais R2, nao acessa D1, auth, Firebase ou OAuth.
O transporte de objetos usa streaming HTTP privado com `GET`, `HEAD` e `PUT`.

## Endpoints privados

- `GET /health`: liveness; nao exige chave OpenAI.
- `GET /health/storage`: probe privado do transporte Worker/R2.
- `POST /jobs/analyze`: job interno chamado somente pelo Worker.

Os antigos endpoints host-local `/analyze` e `/analyze/upload` foram removidos.
Use o fluxo oficial em `/api/v1` para criar uma analise.

## Requisitos e setup

- Python 3.12 e `uv` para testes locais;
- Docker para construir/executar o Cloudflare Container;
- `ffmpeg` e `ffprobe` para executar o pipeline fora da imagem;
- `OPENAI_API_KEY` para analises reais.

```bash
cd apps/ai
UV_CACHE_DIR=/tmp/capyra-uv-cache uv sync --frozen --group dev
UV_CACHE_DIR=/tmp/capyra-uv-cache uv run pytest
docker build -f Dockerfile.cloudflare -t capyra-ai:local .
```

O ambiente completo sobe pela raiz com `npm run dev:cloudflare`. Sem
`OPENAI_API_KEY`, todos os serviços e o health do container iniciam, mas uma
analise falha explicitamente na configuracao do pipeline.

## Variaveis

| Variavel | Default | Uso |
| --- | --- | --- |
| `OPENAI_API_KEY` | unset | Obrigatoria ao executar uma analise |
| `CAPYRA_R2_BINDING_BASE_URL` | definida pelo Worker | Host privado do binding R2 |
| `SHORT_VIDEO_ANALYTIC_TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` | Transcricao |
| `SHORT_VIDEO_ANALYTIC_ANALYSIS_MODEL` | `gpt-5-mini` | Evidencia e sintese |
| `SHORT_VIDEO_ANALYTIC_REQUEST_TIMEOUT_SECONDS` | `180` | Timeout do pipeline |
| `SHORT_VIDEO_ANALYTIC_MAX_KEYFRAMES` | `16` | Limite de frames |
| `SHORT_VIDEO_ANALYTIC_SCENE_THRESHOLD` | `0.32` | Deteccao de cenas |
| `SHORT_VIDEO_ANALYTIC_FRAME_WIDTH` | `768` | Largura dos frames |
| `SHORT_VIDEO_ANALYTIC_MAX_SCENES` | `40` | Cortes candidatos |
| `SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE` | unset | Cookies Netscape do `yt-dlp` |
| `SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64` | unset | Cookies em base64; tem precedencia |

## Mapa da codebase

- `api.py`: liveness e montagem do router privado de jobs.
- `cloudflare_jobs.py`: contrato do job e transporte de objetos pelo binding.
- `application.py`: bootstrap, execucao e traducao de erros.
- `service.py`: orquestracao ponta a ponta.
- `download.py`: ingestao best effort com `yt-dlp`.
- `media.py`: metadados, audio, cenas e keyframes.
- `analysis.py`: OpenAI, selecao de skills e normalizacao.
- `models.py`: contrato Pydantic snake_case do report.

Entradas aceitas sao assets `.mp4`, `.mov` e `.webm` de ate 200 MB ou URLs
publicas suportadas em modo best effort. Falhas de URL, binarios, OpenAI,
storage e timeout permanecem explicitas e testaveis.
