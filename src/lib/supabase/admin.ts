import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Service-role client — server-only, never import this from client code.
// Used exclusively for admin operations like inviting team members
// (supabase.auth.admin.*), which require bypassing RLS and the anon key's
// restricted privileges.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        // Without this, invite/recovery links redirect with tokens in the
        // URL hash fragment instead of a `code` query param, which our
        // server-side /auth/callback route (exchangeCodeForSession) can't
        // read — the fragment never reaches the server.
        flowType: "pkce",
      },
    }
  );
}
