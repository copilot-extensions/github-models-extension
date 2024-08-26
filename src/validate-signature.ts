import express, { type Request, Response, NextFunction } from "express";
import { verify } from "@copilot-extensions/preview-sdk";

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
      if (!verify(req.body, signature, keyID, { token: tokenForUser })) {
        console.log("Signature verification failed");
        return res.status(401).send("Unauthorized");
      }

      console.log("Signature verified");

      req.body = JSON.parse(req.body.toString("utf-8"));
      next();
    } catch (err) {
      console.error(err);
      res.status(401).send("Unauthorized");
    }
  });
}