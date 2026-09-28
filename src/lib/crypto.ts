import crypto from "crypto";

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Critical Security Error: Missing ENCRYPTION_KEY or NEXTAUTH_SECRET in production environment."
      );
    }
    return crypto
      .createHash("sha256")
      .update("insta-automate-dev-insecure-key-do-not-use-in-prod-32b")
      .digest();
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(plainText: string): string {
  if (!plainText) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decryptToken(cipherText: string): string {
  if (!cipherText) return "";
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.warn("[Crypto] Failed to decrypt token:", err);
    return cipherText;
  }
}

export function isTokenEncrypted(token: string): boolean {
  if (!token) return false;
  const parts = token.split(":");
  return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}
