import type { Server } from "bun";

export function createFetch<T extends (request: Request, server: Server) => Response | null | Promise<Response | null>>(
  ...handlers: T[]
) {
  return async (request: Request, server: Server) => {
    for (const handler of handlers) {
      const response = await handler(request, server);
      if (response) {
        return response;
      }
    }
    return new Response("Not Found", { status: 404 });
  };
}
