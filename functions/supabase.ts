import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }

  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, table, data, query, file_url, file_name, bucket } = body;

    const supabase = getSupabase();

    // ─────────────────────────────────────────
    // UPSERT — insert or update a record
    // ─────────────────────────────────────────
    if (action === "upsert") {
      if (!table || !data) {
        return Response.json({ error: "Missing: table, data" }, { status: 400 });
      }
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, { onConflict: "id" })
        .select();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, data: result });
    }

    // ─────────────────────────────────────────
    // SELECT — query records from a table
    // ─────────────────────────────────────────
    if (action === "select") {
      if (!table) {
        return Response.json({ error: "Missing: table" }, { status: 400 });
      }
      let req = supabase.from(table).select("*");
      if (query?.filters) {
        for (const [col, val] of Object.entries(query.filters)) {
          req = req.eq(col, val);
        }
      }
      if (query?.limit) req = req.limit(query.limit);
      if (query?.order) req = req.order(query.order.column, { ascending: query.order.ascending ?? true });

      const { data: result, error } = await req;
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, data: result });
    }

    // ─────────────────────────────────────────
    // DELETE — remove a record by id
    // ─────────────────────────────────────────
    if (action === "delete") {
      if (!table || !query?.id) {
        return Response.json({ error: "Missing: table, query.id" }, { status: 400 });
      }
      const { error } = await supabase.from(table).delete().eq("id", query.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true });
    }

    // ─────────────────────────────────────────
    // UPLOAD FILE — store a file from a URL into Supabase Storage
    // ─────────────────────────────────────────
    if (action === "upload_file") {
      if (!file_url || !file_name) {
        return Response.json({ error: "Missing: file_url, file_name" }, { status: 400 });
      }
      const bucketName = bucket || "kandu-files";

      // Fetch file content from Base44 URL
      const fileResponse = await fetch(file_url);
      const fileBlob = await fileResponse.blob();
      const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";

      const path = `${user.id}/${Date.now()}_${file_name}`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(path, fileBlob, { contentType, upsert: true });

      if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(path);
      return Response.json({ success: true, public_url: urlData.publicUrl, path });
    }

    // ─────────────────────────────────────────
    // SYNC USER — upsert current Base44 user into Supabase "users" table
    // ─────────────────────────────────────────
    if (action === "sync_user") {
      const userPayload = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type || null,
        role: user.role || null,
        status: user.status || "active",
        city: user.city || null,
        bio: user.bio || null,
        skills: user.skills || null,
        avatar_url: user.avatar_url || null,
        rating: user.rating || null,
        verified: user.verified || false,
        synced_at: new Date().toISOString(),
        ...( data || {} )
      };

      const { data: result, error } = await supabase
        .from("users")
        .upsert(userPayload, { onConflict: "id" })
        .select();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, data: result });
    }

    return Response.json({ error: `Unknown action: "${action}". Valid: upsert, select, delete, upload_file, sync_user` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});