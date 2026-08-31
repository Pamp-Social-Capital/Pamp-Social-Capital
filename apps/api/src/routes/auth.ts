import { FastifyInstance, FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { db, users, activityLogs, creatorMarkets } from "@social-capital/db";
import { eq, and } from "drizzle-orm";
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
        await db.insert(activityLogs).values({
          action: 'WALLET_LOGIN',
          walletAddress: wallet,
          details: JSON.stringify({ error: "Invalid signature" }),
          status: 'ERROR'
        });
        return reply.status(401).send({ success: false, error: "Invalid signature" });
      }

      // Prevent replay attacks by clearing nonce
      await db.update(users).set({ nonce: null }).where(eq(users.walletAddress, wallet));

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error("JWT_SECRET is required");
      const token = jwt.sign({ wallet }, jwtSecret, { expiresIn: '7d' });

      await db.insert(activityLogs).values({
        action: 'WALLET_LOGIN',
        walletAddress: wallet,
        status: 'SUCCESS'
      });

      return reply.send({ success: true, token });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to verify signature" });
    }
  });

  fastify.post("/claim-signature", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or invalid authorization header" });
    }
    
    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return reply.status(500).send({ error: "JWT_SECRET is not configured" });
    }
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return reply.status(401).send({ error: "Invalid token" });
    }
    
    const wallet = decoded.wallet;
    
    const { marketPda, oauthToken } = request.body as { marketPda: string, oauthToken?: string };
    if (!marketPda) {
      return reply.status(400).send({ error: "marketPda is required" });
    }

    try {
      // 1. Determine verified X handle (via oauthToken if provided, else DB)
      let verifiedHandle: string | null = null;
      
      if (oauthToken) {
        try {
          const decodedOAuth = jwt.verify(oauthToken, process.env.JWT_SECRET as string) as { twitterHandle: string };
          verifiedHandle = decodedOAuth.twitterHandle;
        } catch (e) {
          fastify.log.error("Invalid oauth token provided for claim signature");
        }
      }
      
      if (!verifiedHandle) {
        const user = await db.query.users.findFirst({
          where: eq(users.walletAddress, wallet)
        });
        if (!user || !user.username) {
          return reply.status(403).send({ error: "User has not linked their X account" });
        }
        verifiedHandle = user.username;
      }

      // 2. Fetch market to verify ownership (Check DB first, then fallback to RPC)
      let isOwner = false;
      const network = process.env.SOLANA_NETWORK || 'devnet';
      const market = await db.query.creatorMarkets.findFirst({
        where: and(eq(creatorMarkets.network, network), eq(creatorMarkets.marketPda, marketPda))
      });

      if (market) {
        isOwner = (market.twitterHandle.toLowerCase() === verifiedHandle.toLowerCase());
      } else {
        // Fallback to Solana RPC due to webhook delay or unindexed market
        try {
          const { Connection, PublicKey, Keypair } = await import("@solana/web3.js");
          const { AnchorProvider, Wallet } = await import("@coral-xyz/anchor");
          const { PumpSocialCapitalSDK } = await import("@social-capital/sdk");
          
          const rpcUrl = process.env.SOLANA_RPC_URL as string;
          const connection = new Connection(rpcUrl);
          const dummyWallet = new Wallet(Keypair.generate());
          const provider = new AnchorProvider(connection, dummyWallet, {});
          const sdk = new PumpSocialCapitalSDK(connection, dummyWallet);
          
          const marketState = await sdk.program.account.creatorMarket.fetch(new PublicKey(marketPda));
          
          // Decode creator_id (32 bytes padded with zeros)
          let twitterHandleFromChain = "";
          for (let i = 0; i < marketState.creatorId.length; i++) {
            if (marketState.creatorId[i] !== 0) {
              twitterHandleFromChain += String.fromCharCode(marketState.creatorId[i]);
            } else {
              break;
            }
          }
          
          isOwner = (twitterHandleFromChain.toLowerCase() === verifiedHandle.toLowerCase());
        } catch (rpcErr) {
          fastify.log.error(rpcErr);
          return reply.status(404).send({ error: "Market not found in DB or on-chain" });
        }
      }

      if (!isOwner) {
        return reply.status(403).send({ error: "X account does not match market creator" });
      }

      // 3. Generate Ed25519 signature
      // The payload format from the smart contract: claim_creator:<market_pubkey>:<wallet_pubkey>
      const expectedMsg = `claim_creator:${marketPda}:${wallet}`;
      const messageUint8 = new TextEncoder().encode(expectedMsg);
      
      // Need a backend keypair
      // In production, load from env var. For this, we'll generate a dummy one if not present,
      // but the program expects a specific pubkey.
      const backendSecretKeyString = process.env.BACKEND_SIGNER_SECRET;
      if (!backendSecretKeyString) {
        return reply.status(500).send({ error: "BACKEND_SIGNER_SECRET not configured" });
      }
      
      const secretKey = bs58.decode(backendSecretKeyString);
      // Keypair generated via nacl.sign.keyPair.fromSecretKey(secretKey)
      // Note: secretKey here is expected to be 64 bytes (secret + public).
      const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);

      const signature = nacl.sign.detached(messageUint8, keyPair.secretKey);

      return reply.send({
        success: true,
        signature: bs58.encode(signature),
        message: expectedMsg,
        pubkey: bs58.encode(keyPair.publicKey)
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to generate signature" });
    }
  });
};
