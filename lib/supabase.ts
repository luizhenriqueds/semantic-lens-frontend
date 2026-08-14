import { createClient } from "@supabase/supabase-js";
import { dbFetch } from "./supabase/dbFetch";

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: dbFetch },
});

// postgrest-js retries GET/HEAD network failures itself (3x, 1s/2s/4s), on top of withRetry's
// budget - up to 16 requests for one read, exactly when the database is already struggling.
// `retry` is forwarded to every builder, but supabase-js marks its `rest` handle protected.
(supabase as unknown as { rest: { retry?: boolean } }).rest.retry = false;
