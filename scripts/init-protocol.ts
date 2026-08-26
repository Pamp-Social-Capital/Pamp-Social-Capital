import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { PumpSocialCapitalSDK } from "../packages/sdk/dist/index.js";
import fs from "fs";
import os from "os";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load wallet
  const secretKeyString = fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const keypair = Keypair.fromSecretKey(secretKey);
  
  const wallet = new anchor.Wallet(keypair);
  const sdk = new PumpSocialCapitalSDK(connection, wallet as any);
  
  const configPda = sdk.getProtocolConfigPda();
  console.log("Config PDA:", configPda.toBase58());
  
  try {
    const info = await connection.getAccountInfo(configPda);
    if (info) {
      console.log("Protocol already initialized!");
      return;
    }
    
    console.log("Initializing protocol...");
    const tx = await sdk.program.methods
      .initializeProtocol(100, 500) // 1% protocol fee, 5% creator fee
      .accounts({
        protocolConfig: configPda,
        authority: keypair.publicKey,
        treasury: keypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
      
    console.log("Success! Signature:", tx);
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
