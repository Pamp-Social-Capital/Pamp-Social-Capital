import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL, SocialCapital } from "../packages/sdk/src/idl/social_capital";
import * as fs from "fs";
import * as os from "os";
import dotenv from "dotenv";

dotenv.config({ path: "./apps/api/.env" });

async function main() {
    // 1. Setup Wallet & Connection to MAINNET-BETA
    const keypairFile = fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf-8");
    const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keypairFile)));
    const wallet = new Wallet(keypair);
    
    console.log("Using deployer wallet:", keypair.publicKey.toBase58());
    
    // IMPORTANT: Pointing to Mainnet
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
    
    const program = new Program<SocialCapital>(IDL, provider);
    
    console.log("Initializing Protocol Config on MAINNET...");
    console.log("Program ID:", program.programId.toBase58());
    
    // 2. PDAs
    const [protocolConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol")],
        program.programId
    );
    
    const [buybackStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyback_state")],
        program.programId
    );
    
    console.log("Protocol PDA:", protocolConfigPda.toBase58());
    
    // 3. Variables
    // PSC_MINT on Mainnet (must be set in .env or hardcoded here if different)
    const pscMint = new PublicKey(process.env.PSC_MINT_ADDRESS || "2eE9dKVAWaXSJ6p8LR23HdN9yQW2GirnVKT6jviqEejy");
    
    // Backend Signer for OAuth
    const backendSigner = keypair.publicKey;
    
    try {
        console.log("Sending initialize tx...");
        const tx = await program.methods.initializeProtocol(pscMint, backendSigner)
            .accounts({
                protocolConfig: protocolConfigPda,
                buybackState: buybackStatePda,
                authority: keypair.publicKey, // Deployer becomes absolute authority
                treasury: keypair.publicKey,  // Fees will be withdrawable to this wallet
                systemProgram: new PublicKey("11111111111111111111111111111111")
            })
            .rpc();
            
        console.log("✅ Mainnet Protocol Initialized successfully!");
        console.log("Tx Signature:", tx);
    } catch (e) {
        console.error("❌ Failed:", e);
    }
}

main();
