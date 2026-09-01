import { FastifyInstance, FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { db, users, activityLogs, creatorMarkets } from "@social-capital/db";
import { eq, and } from "drizzle-orm";
import bs58 from "bs58";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import { uniqueNamesGenerator, adjectives, colors, animals, NumberDictionary } from "unique-names-generator";

// Custom Web3 dictionary

const cryptoAdjectives = [
  "Based", "Degen", "Diamond", "Paper", "Moon", "Rug", "Savage", "Swift",
  "Quiet", "Neon", "Cyber", "Quantum", "Alpha", "Beta", "Sigma", "Chad",
  "Fresh", "Rare", "Epic", "Legendary", "Mystic", "Cosmic", "Galactic",
  "Bullish", "Bearish", "Wicked", "Fearless", "Reckless", "Steady", "Volatile",
  "Risky", "Smart", "Sharp", "Fast", "Lucky", "Unlucky", "Greedy", "Patient",
  "Bold", "Brave", "Aggressive", "Tactical", "Strategic", "Sneaky", "Clever",
  "Wild", "Crazy", "Insane", "Degenerate", "Unhinged", "Chaotic", "Cracked",
  "Goated", "Woke", "Dank", "Lunar", "Moonbound", "Moonshot", "Rugged",
  "Jeeted", "Aped", "Rekt", "Unrekt", "Ultra", "Mega", "Super", "Hyper",
  "Turbo", "Max", "Digital", "Virtual", "Synthetic", "Atomic", "Nuclear",
  "Plasma", "Electric", "Binary", "Encrypted", "Decentralized", "Autonomous",
  "Artificial", "Algorithmic", "Neural", "Holographic", "Infinite", "Parallel",
  "Orbital", "Stellar", "Astral", "Interstellar", "Singular", "Dimensional",
  "Mighty", "Powerful", "Supreme", "Ultimate", "Immortal", "Invincible",
  "Unstoppable", "Dominant", "Royal", "Golden", "Platinum", "Titan", "Colossal",
  "Massive", "Heavy", "Brutal", "Furious", "Deadly", "Dangerous", "Shadow",
  "Dark", "Phantom", "Ghostly", "Hidden", "Secret", "Unknown", "Anonymous",
  "Nameless", "Silent", "Invisible", "Obscure", "Arcane", "Cryptic", "Lost",
  "Forgotten", "Void", "Null", "Rapid", "Sonic", "Lightning", "Flash",
  "Velocity", "Supersonic", "Rocket", "Blazing", "Instant", "Frenzy", "Rush",
  "Nitro", "Warp", "Warped", "UltraRare", "Mythic", "Mythical", "Epic",
  "Ancient", "Eternal", "Timeless", "Primal", "Prime", "Genesis", "Origin",
  "First", "OG", "Classic", "Exclusive", "Elite", "Frozen", "Blazing",
  "Stormy", "Thunder", "Storm", "Volcanic", "Toxic", "Venomous", "Feral",
  "Arctic", "Infernal", "Solar", "Solaris", "Oceanic", "Desert", "Jungle",
  "Goofy", "Silly", "Nerdy", "Sleepy", "Hungry", "Broke", "Rich", "Poor",
  "Clueless", "Fearful", "Hopeless", "Hopium", "Copium", "Maximum", "Minimum",
  "Average", "Typical", "Random"
];

const cryptoNouns = [
  "Ape", "Whale", "Shrimp", "Jeet", "Chad", "Frog", "Cat", "Dog", "Doge",
  "Monkey", "Hunter", "Dodger", "Holder", "Hands", "Punk", "Ninja",
  "Pirate", "Ghost", "Bear", "Bull", "Shark", "Tiger", "Dragon",
  "Wolf", "Fox", "Lion", "Panther", "Leopard", "Cheetah", "Jaguar",
  "Cobra", "Viper", "Snake", "Python", "Scorpion", "Spider", "Raven",
  "Crow", "Hawk", "Eagle", "Falcon", "Owl", "Penguin", "Duck", "Goose",
  "Swan", "Chicken", "Rooster", "Parrot", "Turtle", "Tortoise", "Rabbit",
  "Bunny", "Hamster", "Mouse", "Rat", "Otter", "Beaver", "Badger", "Boar",
  "Bison", "Buffalo", "Horse", "Stallion", "Goat", "Ram", "Sheep", "Cow",
  "Pig", "Panda", "Koala", "Sloth", "Gorilla", "Orangutan", "Lemur",
  "Meerkat", "Mongoose", "Dolphin", "Orca", "Manta", "Squid", "Octopus",
  "Kraken", "Jellyfish", "Lobster", "Crab", "Piranha", "Marlin",
  "Swordfish", "Phoenix", "Griffin", "Hydra", "Titan", "Giant", "Goblin",
  "Wizard", "Mage", "Warlock", "Sorcerer", "Druid", "Demon", "Devil",
  "Angel", "Valkyrie", "Samurai", "Ronin", "Shogun", "Oni", "Vampire",
  "Werewolf", "Reaper", "Necromancer", "Trader", "Sniper", "Miner",
  "Builder", "Dev", "Founder", "Farmer", "Staker", "Validator", "Node",
  "Operator", "Watcher", "Scanner", "Researcher", "Analyst", "Strategist",
  "Investor", "Collector", "Flipper", "Swapper", "Hodler", "Maxi", "Shiller",
  "Caller", "Insider", "Arb", "Arbitrageur", "Hacker", "Coder", "Runner",
  "Specter", "Cipher", "Encryptor", "Decryptor", "Bot", "Botter", "Script",
  "Protocol", "Daemon", "Kernel", "Byte", "Bit", "Pixel", "Glitch", "Virus",
  "Firewall", "Proxy", "Warrior", "Soldier", "Knight", "Assassin",
  "Mercenary", "Gladiator", "Fighter", "Brawler", "Raider", "Ranger",
  "Gunner", "Commander", "Captain", "General", "Warlord", "Conqueror",
  "Rocket", "Moon", "Lambo", "Bag", "Bagholder", "Wallet", "Ledger",
  "Block", "Chain", "Token", "Coin", "Gem", "Diamond", "Candle", "Chart",
  "Pump", "Dump", "Rug", "Liquidity", "Pool", "Vault", "Bridge", "Oracle",
  "Contract", "Hash", "Phantom", "Void", "Zero", "One", "Echo", "Nova",
  "Orbit", "Comet", "Meteor", "Star", "Cosmos", "Galaxy", "Nebula",
  "Pioneer", "Voyager", "Explorer", "Nomad", "Drifter", "Wanderer",
  "Outlaw", "Rebel", "Renegade", "Maverick", "Legend", "Myth", "Oracle"
];
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

      // Prevent replay attacks and initialize default profile if needed
      let currentUsername = user.username;
      let currentAvatarUrl = user.avatarUrl;

      if (!currentUsername) {
        // Generate a highly unique, memecoin-style username
        let isUnique = false;
        let newUsername = "";
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          // Combine crypto words with generic adjectives/colors for high entropy
          const dicts = [
            [cryptoAdjectives, adjectives, colors], // Pick one list for first word
            [cryptoNouns, animals] // Pick one list for second word
          ];
          
          const firstDict = dicts[0][Math.floor(Math.random() * dicts[0].length)];
          const secondDict = dicts[1][Math.floor(Math.random() * dicts[1].length)];
          
          newUsername = uniqueNamesGenerator({
            dictionaries: [firstDict, secondDict],
            separator: '',
            style: 'capital',
            length: 2
          });

          // Check DB for collision
          const existingUser = await db.query.users.findFirst({
            where: eq(users.username, newUsername)
          });
          
          if (!existingUser) {
            isUnique = true;
          }
          attempts++;
        }
        
        if (!isUnique) {
          // Fallback if somehow 10 attempts failed (very rare)
          newUsername = `User_${wallet.slice(0, 4)}${Math.floor(Math.random() * 1000)}`;
        }
        
        currentUsername = newUsername;
        currentAvatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`;
      }

      await db.update(users)
        .set({ 
          nonce: null,
          username: currentUsername,
          avatarUrl: currentAvatarUrl
        })
        .where(eq(users.walletAddress, wallet));

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

  fastify.get("/me", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, error: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return reply.status(500).send({ success: false, error: "JWT_SECRET is not configured" });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { wallet: string };
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, decoded.wallet)
      });

      if (!user) {
        return reply.status(404).send({ success: false, error: "User not found" });
      }

      return reply.send({
        success: true,
        user: {
          walletAddress: user.walletAddress,
          username: user.username || null,
          avatarUrl: user.avatarUrl || null,
        }
      });
    } catch (e) {
      return reply.status(401).send({ success: false, error: "Invalid token" });
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
        return reply.status(403).send({ error: "X account session expired or not provided. Please authenticate again." });
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
