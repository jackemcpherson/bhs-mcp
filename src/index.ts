import { handleMcpRequest } from "./mcp/protocol";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (path === "/mcp" || path.startsWith("/mcp/")) {
      return handleMcpRequest(request, env, ctx);
    }

    return new Response("BHS MCP Server", { status: 200 });
  },
};

export { BhsProxy } from "./sandbox/executor";
export type { Env };
