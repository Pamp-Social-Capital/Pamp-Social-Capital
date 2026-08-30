import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { IDL, SocialCapital } from "./idl/social_capital";
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
  public async createCreatorMarket(
    creatorId: number[] // 32-byte array
  ): Promise<string> {
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
      .rpc();
  }

  public async buyKeys(
    creatorId: Uint8Array,
    amount: anchor.BN,
    maxSolCost: anchor.BN
  ): Promise<string> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const positionPda = this.getUserPositionPda(marketPda, this.wallet.publicKey);
    const feeVault = this.getCreatorFeeVaultPda(marketPda);
    const configPda = this.getProtocolConfigPda();

    // Fetch config to get treasury
    const config = await this.program.account.protocolConfig.fetch(configPda);

    return await this.program.methods
      .buyKeys(amount, maxSolCost)
      .accounts({
        creatorMarket: marketPda,
        userPosition: positionPda,
        protocolConfig: configPda,
        treasury: config.treasury,
        creatorFeeVault: feeVault,
        buyer: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  public async sellKeys(
    creatorId: Uint8Array,
    amount: anchor.BN,
    minSolOutput: anchor.BN
  ): Promise<string> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    const positionPda = this.getUserPositionPda(marketPda, this.wallet.publicKey);
    const feeVault = this.getCreatorFeeVaultPda(marketPda);
    const configPda = this.getProtocolConfigPda();

    // Fetch config to get treasury
    const config = await this.program.account.protocolConfig.fetch(configPda);

    return await this.program.methods
      .sellKeys(amount, minSolOutput)
      .accounts({
        creatorMarket: marketPda,
        userPosition: positionPda,
        protocolConfig: configPda,
        treasury: config.treasury,
        creatorFeeVault: feeVault,
        seller: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  public async claimCreator(creatorId: Uint8Array): Promise<string> {
    const marketPda = this.getCreatorMarketPda(creatorId);
    
    return await this.program.methods
      .claimCreator()
      .accounts({
        creatorMarket: marketPda,
        creatorWallet: this.wallet.publicKey,
      } as any)
      .rpc();
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
