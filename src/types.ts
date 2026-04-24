interface WorkerLoader {
  load(options: {
    compatibilityDate: string;
    mainModule: string;
    modules: Record<string, string>;
    env?: Record<string, unknown>;
    globalOutbound?: unknown | null;
  }): {
    getEntrypoint(): { fetch(request: Request): Promise<Response> };
  };
}

export interface Env {
  LOADER: WorkerLoader;
}
