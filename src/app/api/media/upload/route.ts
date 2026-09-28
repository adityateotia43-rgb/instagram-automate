import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storageService, StoredMediaFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";
import { isDemoMode } from "@/lib/demo";
import { formatApiError } from "@/lib/errors";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 10;

function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case "image/png":
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case "image/webp": {
      const riff = buffer.subarray(0, 4).toString("ascii");
      const webp = buffer.subarray(8, 12).toString("ascii");
      return riff === "RIFF" && webp === "WEBP";
    }

    case "video/mp4":
    case "video/quicktime": {
      const boxType = buffer.subarray(4, 8).toString("ascii");
      return boxType === "ftyp" || boxType === "moov" || boxType === "mdat" || boxType === "wide";
    }

    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "upload", { limit: 20, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        "Upload rate limit reached. To ensure server stability, please wait a minute before uploading more media."
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!session && !isDemoMode()) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Authentication required. Please log in to upload media to your studio.",
            category: "PERMISSION_ERROR",
            actionLabel: "Sign In",
            actionUrl: "/auth/login",
          },
          { status: 401 }
        ),
        rateLimitResult
      );
    }

    const formData = await req.formData();
    const uploadedFiles = formData.getAll("files");

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "No files were selected for upload. Please choose an image or video.",
            category: "INVALID_MEDIA",
            actionLabel: "Select Files",
          },
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    if (uploadedFiles.length > MAX_FILES_PER_REQUEST) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: `Too many files selected (${uploadedFiles.length}). Instagram carousels support up to 10 media items maximum.`,
            category: "INVALID_MEDIA",
            actionLabel: "Select Up to 10 Files",
          },
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    const savedFiles: StoredMediaFile[] = [];

    for (const entry of uploadedFiles) {
      if (!(entry instanceof File)) continue;
      const file = entry as File;

      if (file.size === 0) {
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: `File "${file.name}" is empty (0 bytes). Please upload a valid, non-empty image or video.`,
              category: "INVALID_MEDIA",
            },
            { status: 400 }
          ),
          rateLimitResult
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Format "${file.type || 'unknown'}" is not supported. Instagram accepts JPG, PNG, WEBP images, and MP4 / MOV videos.`,
              category: "UNSUPPORTED_FORMAT",
              actionLabel: "Choose Supported Media",
            },
            { status: 400 }
          ),
          rateLimitResult
        );
      }

      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

      if (file.size > maxSize) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const maxMb = maxSize / (1024 * 1024);
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: `File "${file.name}" (${sizeMb}MB) exceeds Instagram's ${maxMb}MB limit. Please compress or resize the file before uploading.`,
              category: "INVALID_MEDIA",
              actionLabel: "Compress File",
            },
            { status: 400 }
          ),
          rateLimitResult
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!validateFileSignature(buffer, file.type)) {
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Security verification notice: File "${file.name}" appears damaged or its extension does not match its contents. Please re-export the file and try again.`,
              category: "INVALID_MEDIA",
              actionLabel: "Re-export File",
            },
            { status: 400 }
          ),
          rateLimitResult
        );
      }

      const stored = await storageService.saveFile(buffer, file.name, file.type);
      savedFiles.push(stored);

      if (userId) {
        try {
          await prisma.media.create({
            data: {
              id: stored.id,
              userId,
              url: stored.url,
              fileType: isVideo ? "VIDEO" : "IMAGE",
              mimeType: stored.mimeType,
              fileSize: stored.sizeBytes,
              storageKey: stored.filename,
            },
          });
        } catch {
          console.warn("[MediaUpload] Stored file locally; DB persistence pending active database connection.");
        }
      }
    }

    const res = NextResponse.json({
      success: true,
      files: savedFiles,
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error: unknown) {
    console.error("[MediaUpload] Error handling upload:", error);
    const friendly = formatApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: friendly.message,
        title: friendly.title,
        category: friendly.category,
        actionLabel: friendly.actionLabel,
        actionUrl: friendly.actionUrl,
      },
      { status: 500 }
    );
  }
}
