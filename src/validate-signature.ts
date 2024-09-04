import express, { type Request, Response, NextFunction } from "express";
import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";

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
      const { isValidRequest, payload } = await verifyAndParseRequest(req.body, signature, keyID, {
        token: tokenForUser,
      });
      if (!isValidRequest) {
        console.log("Signature verification failed");
        return res.status(401).send("Unauthorized");
      }

      console.log("Signature verified");

      req.body = payload
      next();
    } catch (err) {
      console.error(err);
      res.status(401).send("Unauthorized");
    }
  });
}
