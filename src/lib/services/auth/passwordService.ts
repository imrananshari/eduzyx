import crypto from "node:crypto";

const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), derivedKey);
}
