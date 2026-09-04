import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { IDL, SocialCapital } from "./idl/social_capital.js";
export { IDL };
export type { SocialCapital };
export class PumpSocialCapitalSDK {
  public program: any;

  constructor(
    public connection: Connection,
    public wallet: anchor.Wallet,
    programId?: PublicKey
  ) {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
      commitment: "confirmed",
    });
    
    // We use 'any' as the type parameter to bypass strict IDL constraints
    // since the IDL is generated manually
    this.program = new anchor.Program<any>(
      IDL as any,
      provider
    ) as any;
  }

  // PDAs
  public getProtocolConfigPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      this.program.programId
    );
    return pda;
  }

  public getBuybackStatePda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("buyback_state")],
      this.program.programId
    );
    return pda;
  }

  public getPscBuybackVaultPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("psc_buyback_vault")],
      this.program.programId
    );
    return pda;
  }

  public getCreatorMarketPda(creatorId: Uint8Array): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_market"), creatorId],
      this.program.programId
    );
    return pda;
  }

  public getUserPositionPda(creatorMarket: PublicKey, userWallet: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), creatorMarket.toBuffer(), userWallet.toBuffer()],
      this.program.programId
    );
    return pda;
  }

  public getCreatorFeeVaultPda(creatorMarket: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_fee_vault"), creatorMarket.toBuffer()],
      this.program.programId
    );
    return pda;
  }

  // Instructions
  public async createCreatorMarketInstruction(
    creatorId: number[] // 32-byte array
  ): Promise<anchor.web3.TransactionInstruction> {
    const configPda = this.getProtocolConfigPda();
    const marketPda = this.getCreatorMarketPda(new Uint8Array(creatorId));
    
    return await this.program.methods
      .createCreatorMarket(creatorId)
      .accounts({
        creatorMarket: marketPda,
        protocolConfig: configPda,
        payer: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  public async createCreatorMarket(
    creatorId: number[] // 32-byte array
  ): Promise<string> {
    const ix = await this.createCreatorMarketInstruction(creatorId);
    const tx = new anchor.web3.Transaction().add(ix);
    return await this.program.provider.sendAndConfirm!(tx);
  }

  public async buyKeysInstruction(
    creatorId: Uint8Array,
    amount: anchor.BN,
    maxSolCost: anchor.BN
  ): Promise<anchor.web3.TransactionInstruction> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const positionPda = this.getUserPositionPda(marketPda, this.wallet.publicKey);
    const feeVault = this.getCreatorFeeVaultPda(marketPda);
    const configPda = this.getProtocolConfigPda();
    const buybackVault = this.getPscBuybackVaultPda();

    return await this.program.methods
      .buyKeys(amount, maxSolCost)
      .accounts({
        creatorMarket: marketPda,
        userPosition: positionPda,
        protocolConfig: configPda,
        pscBuybackVault: buybackVault,
        creatorFeeVault: feeVault,
        buyer: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  public async buyKeys(
    creatorId: Uint8Array,
    amount: anchor.BN,
    maxSolCost: anchor.BN
  ): Promise<string> {
    const ix = await this.buyKeysInstruction(creatorId, amount, maxSolCost);
    const computeIx = anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 });
    const tx = new anchor.web3.Transaction().add(computeIx).add(ix);
    return await this.program.provider.sendAndConfirm!(tx, undefined, { commitment: "confirmed", skipPreflight: true });
  }

  public async sellKeysInstruction(
    creatorId: Uint8Array,
    amount: anchor.BN,
    minSolOutput: anchor.BN
  ): Promise<anchor.web3.TransactionInstruction> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const positionPda = this.getUserPositionPda(marketPda, this.wallet.publicKey);
    const feeVault = this.getCreatorFeeVaultPda(marketPda);
    const configPda = this.getProtocolConfigPda();
    const buybackVault = this.getPscBuybackVaultPda();

    return await this.program.methods
      .sellKeys(amount, minSolOutput)
      .accounts({
        creatorMarket: marketPda,
        userPosition: positionPda,
        protocolConfig: configPda,
        pscBuybackVault: buybackVault,
        creatorFeeVault: feeVault,
        seller: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  public async sellKeys(
    creatorId: Uint8Array,
    amount: anchor.BN,
    minSolOutput: anchor.BN
  ): Promise<string> {
    const ix = await this.sellKeysInstruction(creatorId, amount, minSolOutput);
    const computeIx = anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 });
    const tx = new anchor.web3.Transaction().add(computeIx).add(ix);
    return await this.program.provider.sendAndConfirm!(tx, undefined, { commitment: "confirmed", skipPreflight: true });
  }

  public async claimCreatorInstruction(creatorId: Uint8Array): Promise<TransactionInstruction> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const configPda = this.getProtocolConfigPda();
    
    return await this.program.methods
      .claimCreator()
      .accounts({
        creatorMarket: marketPda,
        protocolConfig: configPda,
        creatorWallet: this.wallet.publicKey,
        instructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      } as any)
      .instruction();
  }

  public async claimCreatorFees(creatorId: Uint8Array): Promise<string> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const feeVault = this.getCreatorFeeVaultPda(marketPda);

    return await this.program.methods
      .withdrawCreatorFees()
      .accounts({
        creatorMarket: marketPda,
        creatorWallet: this.wallet.publicKey,
        creatorFeeVault: feeVault,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  public async executeBuyback(
    solAmount: anchor.BN,
    pscAmount: anchor.BN,
    keeperTokenAccount: PublicKey,
    pscMint: PublicKey
  ): Promise<string> {
    const buybackStatePda = this.getBuybackStatePda();
    const configPda = this.getProtocolConfigPda();
    const pscBuybackVault = this.getPscBuybackVaultPda();

    return await this.program.methods
      .executeBuyback(solAmount, pscAmount)
      .accounts({
        buybackState: buybackStatePda,
        protocolConfig: configPda,
        pscBuybackVault: pscBuybackVault,
        authority: this.wallet.publicKey,
        keeperTokenAccount: keeperTokenAccount,
        pscMint: pscMint,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  // Fetching state
  public async getMarketState(creatorId: Uint8Array) {
    const marketPda = this.getCreatorMarketPda(creatorId);
    return await this.program.account.creatorMarket.fetch(marketPda);
  }

  public async getUserPosition(creatorId: Uint8Array, userWallet: PublicKey) {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const positionPda = this.getUserPositionPda(marketPda, userWallet);
    return await this.program.account.userPosition.fetch(positionPda);
  }
}
