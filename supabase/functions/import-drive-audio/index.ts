// ============================================================
// Supabase Edge Function: import-drive-audio
//
// Downloads an audio file from a public Google Drive "anyone with
// the link" URL, uploads it into the `lesson-audio` Storage bucket,
// and updates the corresponding `audio_sources` row.
//
// Deploy with:
//   supabase functions deploy import-drive-audio
//
// Required secrets (set with `supabase secrets set`):
//   SUPABASE_URL              (auto-provided in the function runtime)
//   SUPABASE_SERVICE_ROLE_KEY (set manually — service role, server-only)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ImportRequestBody {
  audio_source_id: string; // existing row id in audio_sources
  drive_link: string;      // the Google Drive share link
  lesson_id: string;       // used to build the storage path
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ------------------------------------------------------------
    // 1. Authenticate the calling user (from their JWT), so the
    //    uploaded file path is scoped to them and RLS is satisfied.
    // ------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    // Client scoped to the caller — used only to verify identity.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const userId = user.id;

    // Admin client — used for Storage upload + DB update, bypasses RLS
    // safely because we already verified the user and build the path
    // ourselves using their real user_id.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ------------------------------------------------------------
    // 2. Parse and validate the request body.
    // ------------------------------------------------------------
    const body: ImportRequestBody = await req.json();
    const { audio_source_id, drive_link, lesson_id } = body;

    if (!audio_source_id || !drive_link || !lesson_id) {
      return jsonResponse(
        { error: "audio_source_id, drive_link and lesson_id are required" },
        400
      );
    }

    // Mark as processing immediately so the UI can show progress.
    await adminClient
      .from("audio_sources")
      .update({ status: "processing" })
      .eq("id", audio_source_id)
      .eq("user_id", userId);

    // ------------------------------------------------------------
    // 3. Extract the Google Drive file ID from the share link.
    //    Supports formats like:
    //      https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    //      https://drive.google.com/open?id=FILE_ID
    //      https://drive.google.com/uc?id=FILE_ID
    // ------------------------------------------------------------
    const fileId = extractDriveFileId(drive_link);
    if (!fileId) {
      await markError(adminClient, audio_source_id, userId, "لینک گوگل درایو معتبر نیست.");
      return jsonResponse({ error: "Could not parse Google Drive file ID" }, 400);
    }

    // ------------------------------------------------------------
    // 4. Download the file bytes from Google Drive.
    //    Large files trigger a "can't scan for viruses" confirmation
    //    page instead of the raw bytes — we detect and follow that.
    // ------------------------------------------------------------
    let fileBytes: Uint8Array;
    let contentType: string;
    try {
      const result = await downloadDriveFile(fileId);
      fileBytes = result.bytes;
      contentType = result.contentType;
    } catch (err) {
      await markError(
        adminClient,
        audio_source_id,
        userId,
        "دانلود فایل از گوگل درایو ناموفق بود. لینک را بررسی کنید یا مطمئن شوید 'Anyone with the link' فعال است."
      );
      return jsonResponse({ error: `Drive download failed: ${(err as Error).message}` }, 502);
    }

    // ------------------------------------------------------------
    // 5. Determine file extension / format from content type.
    // ------------------------------------------------------------
    const { extension, format } = resolveAudioFormat(contentType);

    // ------------------------------------------------------------
    // 6. Upload into Supabase Storage under {user_id}/{lesson_id}/...
    // ------------------------------------------------------------
    const storagePath = `${userId}/${lesson_id}/${fileId}.${extension}`;

    if (!storagePath || !storagePath.trim()) {
      await markError(adminClient, audio_source_id, userId, "مسیر ذخیره‌سازی فایل ساخته نشد.");
      return jsonResponse({ error: "storage_path could not be generated" }, 500);
    }

    const { error: uploadError } = await adminClient.storage
      .from("lesson-audio")
      .upload(storagePath, fileBytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      await markError(adminClient, audio_source_id, userId, "آپلود فایل در Storage ناموفق بود.");
      return jsonResponse({ error: `Storage upload failed: ${uploadError.message}` }, 500);
    }

    // ------------------------------------------------------------
    // 7. Update the audio_sources row — this is now the source of
    //    truth for playback, not the original Drive link.
    // ------------------------------------------------------------
    const { error: updateError } = await adminClient
      .from("audio_sources")
      .update({
        storage_path: storagePath,
        format,
        status: "ready",
        error_message: null,
      })
      .eq("id", audio_source_id)
      .eq("user_id", userId);

    if (updateError) {
      // جلوگیری از باقی ماندن فایل بدون رکورد دیتابیس
      await adminClient.storage.from("lesson-audio").remove([storagePath]);
      return jsonResponse({ error: `DB update failed: ${updateError.message}` }, 500);
    }

    return jsonResponse({
      success: true,
      storage_path: storagePath,
      format,
      size_bytes: fileBytes.byteLength,
    });
  } catch (err) {
    console.error("Unhandled error in import-drive-audio:", err);
    return jsonResponse({ error: "Internal error", details: (err as Error).message }, 500);
  }
});

// ============================================================
// Helpers
// ============================================================

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function markError(
  adminClient: ReturnType<typeof createClient>,
  audioSourceId: string,
  userId: string,
  message: string
) {
  await adminClient
    .from("audio_sources")
    .update({ status: "error", error_message: message })
    .eq("id", audioSourceId)
    .eq("user_id", userId);
}

function extractDriveFileId(link: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,   // /file/d/FILE_ID/view
    /[?&]id=([a-zA-Z0-9_-]+)/,       // ?id=FILE_ID or &id=FILE_ID
  ];
  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Downloads a file from Google Drive by file ID, transparently
 * handling the "Google Drive can't scan this file for viruses"
 * confirmation page that appears for large files.
 */
async function downloadDriveFile(
  fileId: string
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const baseUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  let response = await fetch(baseUrl, { redirect: "follow" });
  let contentType = response.headers.get("content-type") || "";

  // If Drive returns an HTML confirmation page instead of the file,
  // find the confirm token and retry with it.
  if (contentType.includes("text/html")) {
    const html = await response.text();

    const confirmTokenMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
    const uuidMatch = html.match(/name="uuid" value="([0-9A-Za-z_-]+)"/);

    if (confirmTokenMatch) {
      const confirmToken = confirmTokenMatch[1];
      const retryUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}${
        uuidMatch ? `&uuid=${uuidMatch[1]}` : ""
      }`;
      response = await fetch(retryUrl, { redirect: "follow" });
      contentType = response.headers.get("content-type") || "";
    } else {
      throw new Error(
        "Google Drive returned an HTML page instead of the file. The link may not be public, or the file was not found."
      );
    }
  }

  if (!response.ok) {
    throw new Error(`Google Drive responded with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { bytes: new Uint8Array(arrayBuffer), contentType };
}

function resolveAudioFormat(contentType: string): { extension: string; format: string } {
  const map: Record<string, { extension: string; format: string }> = {
    "audio/mpeg": { extension: "mp3", format: "mp3" },
    "audio/mp3": { extension: "mp3", format: "mp3" },
    "audio/wav": { extension: "wav", format: "wav" },
    "audio/x-wav": { extension: "wav", format: "wav" },
    "audio/mp4": { extension: "m4a", format: "m4a" },
    "audio/x-m4a": { extension: "m4a", format: "m4a" },
    "audio/ogg": { extension: "ogg", format: "ogg" },
  };
  return map[contentType] || { extension: "bin", format: "unknown" };
}
