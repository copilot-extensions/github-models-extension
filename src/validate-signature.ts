import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";

const GITHUB_KEYS_URI = "https://api.github.com/meta/public_keys/copilot_api";

interface GitHubKeysPayload {
  public_keys: Array<{
    key: string;
    key_identifier: string;
    is_current: boolean;
  }>;
}

export async function verifySignatureMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  express.text({ type: "*/*" })(req, res, async () => {
    try {
      const signature = req.get("GitHub-Public-Key-Signature") as string;
      const keyID = req.get("GitHub-Public-Key-Identifier") as string;
      const tokenForUser = req.get("X-GitHub-Token") as string;
      console.log(req.body);
      await verifySignature(req.body, signature, keyID, tokenForUser);

      req.body = JSON.parse(req.body.toString("utf-8"));
      next();
    } catch (err) {
      console.error(err);
      res.status(401).send("Unauthorized");
    }
  });
}

async function verifySignature(
  payload: string,
  signature: string,
  keyID: string,
  tokenForUser: string | null
): Promise<void> {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error("Invalid payload");
  }
  if (typeof signature !== "string" || signature.length === 0) {
    throw new Error("Invalid signature");
  }
  if (typeof keyID !== "string" || keyID.length === 0) {
    throw new Error("Invalid keyID");
  }

  const keys = (await fetch(GITHUB_KEYS_URI, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokenForUser}`,
    },
  }).then((res) => res.json())) as GitHubKeysPayload;
  const publicKey = keys.public_keys.find((k) => k.key_identifier === keyID);
  if (!publicKey) {
    throw new Error("No public key found matching key identifier");
  }

  const verify = crypto.createVerify("SHA256").update(payload);
  if (!verify.verify(publicKey.key, signature, "base64")) {
    throw new Error("Signature does not match payload");
  }
}
