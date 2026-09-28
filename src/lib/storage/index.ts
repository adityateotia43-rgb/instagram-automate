import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StoredMediaFile {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    // Save inside Next.js public directory so files can be served directly at /uploads/...
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  /**
   * Ensures the upload directory exists.
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generates a collision-free filename preserving extension.
   */
  private generateSafeFilename(originalName: string, mimeType: string): string {
    const canonicalMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "video/mp4": ".mp4",
      "video/quicktime": ".mov",
    };

    const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"]);
    const rawExt = path.extname(originalName).toLowerCase();
    const canonicalExt = canonicalMap[mimeType] || ".jpg";
    const safeExt = allowedExtensions.has(rawExt) ? rawExt : canonicalExt;

    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString("hex");
    return `media_${timestamp}_${randomHash}${safeExt}`;
  }

  /**
   * Save a file buffer to disk.
   */
  async saveFile(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredMediaFile> {
    await this.ensureDirectory();

    const filename = this.generateSafeFilename(originalFilename, mimeType);
    const destination = path.join(this.uploadDir, filename);

    await fs.writeFile(destination, fileBuffer);

    // Build public URL. If NEXT_PUBLIC_APP_URL is set, use it; otherwise use relative path /uploads/...
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
    const publicUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/uploads/${filename}` : `/uploads/${filename}`;

    return {
      id: crypto.randomUUID(),
      filename,
      url: publicUrl,
      mimeType,
      sizeBytes: fileBuffer.length,
    };
  }

  /**
   * Delete an uploaded file by filename.
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const sanitized = path.basename(filename);
      if (!sanitized || sanitized.includes("..") || sanitized !== filename) {
        return false;
      }
      const filePath = path.join(this.uploadDir, sanitized);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
