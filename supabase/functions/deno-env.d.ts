declare namespace Deno {
  const env: {
    get(name: string): string | undefined;
  };
  function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "jsr:@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
}

declare module "npm:stripe@19.1.0" {
  const Stripe: any;
  export default Stripe;
}
