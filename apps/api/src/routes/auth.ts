import { FastifyInstance, FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { db, users } from "@social-capital/db";
import { eq } from "drizzle-orm";
import bs58 from "bs58";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/challenge", async (request, reply) => {
    const { wallet } = request.query as { wallet: string };
    if (!wallet) return reply.status(400).send({ error: "Wallet address is required" });

    try {
      const nonce = crypto.randomUUID();
      const message = `Sign this message to verify your wallet for Pump Social Capital.\nNonce: ${nonce}`;
      
      await db.insert(users).values({
        walletAddress: wallet,
        nonce: nonce,
      }).onConflictDoUpdate({
        target: users.walletAddress,
        set: { nonce: nonce }
      });

      return reply.send({ success: true, message });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to generate challenge" });
    }
  });

  fastify.post("/verify", async (request, reply) => {
    const { wallet, signature, message } = request.body as { wallet: string, signature: string, message: string };
    
    if (!wallet || !signature || !message) {
      return reply.status(400).send({ success: false, error: "Missing required fields" });
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, wallet)
      });

      if (!user || !user.nonce) {
        return reply.status(404).send({ success: false, error: "Challenge not found for this wallet" });
      }

      // Verify the message matches our expected format and nonce
      const expectedMessage = `Sign this message to verify your wallet for Pump Social Capital.\nNonce: ${user.nonce}`;
      if (message !== expectedMessage) {
        return reply.status(400).send({ success: false, error: "Message does not match challenge" });
      }

      // Verify cryptographic signature
      const signatureUint8 = bs58.decode(signature);
      const messageUint8 = new TextEncoder().encode(message);
      const pubKeyUint8 = bs58.decode(wallet);
      
      const isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, pubKeyUint8);
      
      if (!isValid) {
        return reply.status(401).send({ success: false, error: "Invalid signature" });
      }

      // Prevent replay attacks by clearing nonce
      await db.update(users).set({ nonce: null }).where(eq(users.walletAddress, wallet));

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET || "super_secret_dev_key";
      const token = jwt.sign({ wallet }, jwtSecret, { expiresIn: '7d' });

      return reply.send({ success: true, token });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to verify signature" });
    }
  });
};
