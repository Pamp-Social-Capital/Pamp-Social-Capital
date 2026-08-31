import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL, SocialCapital } from "../packages/sdk/src/idl/social_capital";
import * as fs from "fs";
import * as os from "os";
import dotenv from "dotenv";

dotenv.config({ path: "./apps/api/.env" });

async function main() {
    const keypairFile = fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf-8");
    const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keypairFile)));
    const wallet = new Wallet(keypair);
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
    
    const program = new Program<SocialCapital>(IDL, provider);
    
    console.log("Initializing Protocol Config V2 on Devnet...");
    
    // Check if initialized
    const [protocolConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol")],
        program.programId
    );
    
    console.log("Protocol PDA:", protocolConfigPda.toBase58());
    
    const pscMint = new PublicKey(process.env.PSC_MINT_ADDRESS || "2eE9dKVAWaXSJ6p8LR23HdN9yQW2GirnVKT6jviqEejy");
    // For Devnet testing, we can use the same keypair as backend signer
    const backendSigner = keypair.publicKey;
    
    const [buybackStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyback_state")],
        program.programId
    );

    try {
        const tx = await program.methods.initializeProtocol(pscMint, backendSigner)
            .accounts({
                protocolConfig: protocolConfigPda,
                buybackState: buybackStatePda,
                authority: keypair.publicKey,
                treasury: keypair.publicKey,
                systemProgram: new PublicKey("11111111111111111111111111111111")
            })
            // Since we added new arguments to Rust (psc_mint, backend_signer), we need to pass them via remaining_accounts or the args array!
            // Wait, we didn't add them to args, we added them in instruction handler?
            // Let's check `initialize.rs` again...
            .rpc();
            
        console.log("Initialized successfully! Tx:", tx);
    } catch (e) {
        console.error("Failed:", e);
    }
}

main();
