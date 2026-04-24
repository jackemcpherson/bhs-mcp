import { executeCode } from "../sandbox/executor";
import type { Env } from "../types";
import { getSchemaInfo } from "./tools/schema";
import { getToolsInfo } from "./tools/tools";
import type { JsonRpcRequest, JsonRpcResponse } from "./types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOLS: ToolDefinition[] = [
  {
    name: "schema",
    description:
      "Get BHS API type definitions, method signatures, available filters, and example queries",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "tools",
    description: "Get sandbox capabilities, constraints, and guidance for writing BHS queries",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "code",
    description:
      "Execute TypeScript code in an isolated sandbox with access to BHS product search, stores, and cart management",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description:
            "TypeScript code. Has access to `bhs` object with search, product, facets, stores, and cart methods. Must return a value.",
        },
      },
      required: ["code"],
      additionalProperties: false,
    },
  },
];

function jsonRpcResponse(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function mcpContent(text: string) {
  return { content: [{ type: "text", text }] };
}

function mcpError(text: string) {
  return { content: [{ type: "text", text }], isError: true };
}

async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  env: Env,
  ctx: ExecutionContext,
) {
  switch (name) {
    case "schema":
      return mcpContent(getSchemaInfo());

    case "tools":
      return mcpContent(getToolsInfo());

    case "code": {
      const code = args.code;
      if (typeof code !== "string" || code.trim() === "") {
        return mcpError("code parameter is required and must be a non-empty string");
      }
      const result = await executeCode(code, env, ctx);
      if (result.error) {
        return mcpError(`Execution error (${result.execution_time_ms}ms): ${result.error}`);
      }
      return mcpContent(
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result, null, 2),
      );
    }

    default:
      return mcpError(`Unknown tool: ${name}`);
  }
}

async function handleJsonRpc(
  request: JsonRpcRequest,
  env: Env,
  ctx: ExecutionContext,
): Promise<JsonRpcResponse> {
  const { id, method, params } = request;

  switch (method) {
    case "initialize":
      return jsonRpcResponse(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "bhs-mcp", version: "1.0.0" },
      });

    case "tools/list":
      return jsonRpcResponse(id, { tools: TOOLS });

    case "tools/call": {
      const name = params?.name as string | undefined;
      const args = (params?.arguments ?? {}) as Record<string, unknown>;
      if (!name) {
        return jsonRpcError(id, -32602, "Missing tool name");
      }
      const result = await handleToolCall(name, args, env, ctx);
      return jsonRpcResponse(id, result);
    }

    case "ping":
      return jsonRpcResponse(id, {});

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function handleMcpRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return Response.json(
      jsonRpcError(null, -32600, "Only POST requests are accepted"),
      { status: 405, headers: CORS_HEADERS },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(jsonRpcError(null, -32700, "Parse error"), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const rpc = body as JsonRpcRequest;
  if (!rpc.jsonrpc || !rpc.method) {
    return Response.json(jsonRpcError(rpc?.id ?? null, -32600, "Invalid Request"), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const response = await handleJsonRpc(rpc, env, ctx);
  return Response.json(response, { headers: CORS_HEADERS });
}
