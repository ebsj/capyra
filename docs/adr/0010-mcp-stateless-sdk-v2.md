# MCP is a stateless Worker on SDK v2

`apps/mcp` is a headless TypeScript Worker. Tools call only `/api/v1` as an **Operador**. The server is `@modelcontextprotocol/server` (MCP SDK v2) served with `createMcpHandler` from `agents/mcp/server`. One isolated server per request; no Durable Object, no MCP session store.

`McpAgent` and `@modelcontextprotocol/sdk` v1 with `WorkerTransport` keep a Durable Object (and SQL) per session. That is the expensive path and is deprecated for new servers. Stdio transports do not run on Workers. Auth is verified before the handler; the handler does not invent Capyra sessions.
