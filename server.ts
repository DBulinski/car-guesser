import { createRequestHandler } from "react-router";
import { getLoadContext } from "load-context.js";

const handleRequest = createRequestHandler(() =>
  import.meta.hot
    ? // @ts-ignore - In the dev server this is the server-build generated by react-router
      import("virtual:react-router/server-build").catch()
    : // @ts-ignore - This file won’t exist if it hasn’t yet been built
      import("./dist/server/index.js").catch(),
);

export default {
  async fetch(request, env, ctx) {
    try {
      const loadContext = getLoadContext({
        request,
        context: {
          cloudflare: {
            // This object matches the return value from Wrangler's
            // `getPlatformProxy` used during development via Remix's
            // `cloudflareDevProxyVitePlugin`:
            // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
            cf: request.cf,
            ctx: {
              props: ctx.props?.bind?.(ctx),
              waitUntil: ctx.waitUntil.bind(ctx),
              passThroughOnException: ctx.passThroughOnException.bind(ctx),
            },
            caches,
            env,
          },
        },
      });

      return await handleRequest(request, loadContext);
    } catch (error) {
      console.error(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
