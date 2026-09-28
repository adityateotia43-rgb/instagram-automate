import fs from "fs";
import path from "path";
import { prisma } from "../prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";

export type TokenStorageStrategy = "DATABASE" | "ENV_FILE";

export interface TokenRefreshResult {
  accessToken: string;
  expiresInSeconds: number;
  expiresAt: Date;
}

/**
 * Saves token to PostgreSQL via Prisma after securely encrypting with AES-256-GCM.
 */
export async function saveTokenToDatabase(
  instagramAccountId: string,
  newToken: string,
  expiresInSeconds: number
): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const encryptedToken = encryptToken(newToken);

    await prisma.oAuthToken.upsert({
      where: { instagramAccountId },
      update: {
        accessToken: encryptedToken,
        expiresAt,
        refreshedAt: new Date(),
        isValid: true,
      },
      create: {
        instagramAccountId,
        accessToken: encryptedToken,
        tokenType: "Bearer",
        scope: "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_read_engagement",
        expiresAt,
        refreshedAt: new Date(),
        isValid: true,
      },
    });

    return true;
  } catch (err) {
    console.error("[TokenStorage] Failed to save token to database:", err);
    return false;
  }
}

/**
 * Retrieves and decrypts an access token from the OAuthToken model.
 */
export async function getDecryptedTokenFromDatabase(
  instagramAccountId: string
): Promise<string | null> {
  try {
    const record = await prisma.oAuthToken.findUnique({
      where: { instagramAccountId },
    });
    if (!record || !record.isValid) return null;
    return decryptToken(record.accessToken);
  } catch (err) {
    console.error("[TokenStorage] Failed to retrieve token from database:", err);
    return null;
  }
}

/**
 * Option B (For local single-user machine setups): Updates INSTAGRAM_ACCESS_TOKEN inside the local .env file.
 */
export async function saveTokenToEnvFile(newToken: string): Promise<boolean> {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      return false;
    }

    const currentContent = fs.readFileSync(envPath, "utf-8");
    const regex = /^INSTAGRAM_ACCESS_TOKEN=.*$/m;

    let updatedContent: string;
    if (regex.test(currentContent)) {
      updatedContent = currentContent.replace(regex, `INSTAGRAM_ACCESS_TOKEN="${newToken}"`);
    } else {
      updatedContent = `${currentContent}\nINSTAGRAM_ACCESS_TOKEN="${newToken}"`;
    }

    fs.writeFileSync(envPath, updatedContent, "utf-8");
    process.env.INSTAGRAM_ACCESS_TOKEN = newToken;
    return true;
  } catch (err) {
    console.error("[TokenStorage] Failed to update token in .env file:", err);
    return false;
  }
}

/**
 * Calculates remaining days before a token expires.
 */
export function calculateDaysUntilExpiration(expiresAt: Date): number {
  const diffMs = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Inspects if a token is nearing expiration (e.g. less than 7 days remaining)
 * and requires a scheduled refresh.
 */
export function isTokenNearingExpiration(expiresAt: Date, warningThresholdDays = 7): boolean {
  return calculateDaysUntilExpiration(expiresAt) <= warningThresholdDays;
}
