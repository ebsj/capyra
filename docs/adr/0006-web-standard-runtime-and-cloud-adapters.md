# TypeScript is web-standard; the cloud is an adapter

The API and MCP run on the Fetch model (`Request`/`Response`), not on Node, Express or Nest. Cloudflare is the first adapter (Workers, D1, R2, Queues, Cron). Domain code must not import Cloudflare-only APIs. The authenticated webapp stays on that portable path. The public site is a separate Next.js app and may use whatever host Next needs.

The alternative was “Docker Node anywhere” (Nest + Prisma + Postgres on a VM). That is portable and throws away the reason to start on Cloudflare. Python/AI and CLI are not in this repository.
