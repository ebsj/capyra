# AGENT.md — AI Container

`apps/ai` e o runtime Python privado que executa `yt-dlp`, `ffmpeg` e OpenAI.

## Fronteira

- Recebe jobs internos do consumer do Worker.
- Le o source no R2 e grava report/artefatos em prefixos deterministicos.
- Devolve somente referencias; nunca acessa D1, JWT, Firebase ou OAuth.
- OpenAI e chamada diretamente, sem AI Gateway.

```bash
cd apps/ai
uv sync --frozen --group dev
uv run pytest
docker build -f Dockerfile.cloudflare -t capyra-ai:local .
```

Preserve o report interno snake_case e sua projecao publica camelCase. Repita
validacao de extensao, tamanho, MIME e `ffprobe` mesmo apos a conclusao do
upload pela API. Reentregas devem reutilizar `analyses/{analysisId}/`.

Falhas de URL, SSRF, binarios ausentes, OpenAI, `yt-dlp`, R2 e timeout devem ser
explicitas e testaveis. Nunca registre prompts, transcricoes, videos ou secrets.
