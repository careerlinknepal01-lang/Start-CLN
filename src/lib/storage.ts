import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (e.g., 'event-images', 'project-images', 'avatars')
 * @param userId - The user ID for folder organization
 * @param prefix - Optional prefix for the filename (e.g., 'event-', 'project-')
 * @returns The public URL of the uploaded file
 */
export async function uploadImage(
  file: File,
  bucket: string,
  userId: string,
  prefix: string = ""
): Promise<{ url: string; error: string | null }> {
  // Validate file type
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      url: "",
      error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      url: "",
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${prefix}${timestamp}.${extension}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return { url: "", error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filename);

    return { url: publicUrl, error: null };
  } catch (error) {
    return {
      url: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param url - The public URL of the file to delete
 * @param bucket - The storage bucket name
 */
export async function deleteImage(url: string, bucket: string): Promise<{ error: string | null }> {
  try {
    // Extract path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const filename = pathParts[pathParts.length - 2] + "/" + pathParts[pathParts.length - 1];

    const { error } = await supabase.storage.from(bucket).remove([filename]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}
