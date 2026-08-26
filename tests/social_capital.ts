import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SocialCapital } from "../target/types/social_capital";
import { assert } from "chai";
import * as crypto from "crypto";

describe("social_capital", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SocialCapital as any;

  const authority = anchor.web3.Keypair.generate();
  const treasury = anchor.web3.Keypair.generate();
  const creator = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  const seller = anchor.web3.Keypair.generate();

  const protocolFeeBps = 200; // 2%
  const defaultCreatorFeeBps = 500; // 5%

  const creatorId = crypto.randomBytes(32);

  before(async () => {
    // Airdrop SOL to test accounts
    const airdrops = [authority, creator, buyer, seller].map(async (account) => {
      const sig = await provider.connection.requestAirdrop(
        account.publicKey,
        1000 * anchor.web3.LAMPORTS_PER_SOL
      );
      const latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: sig,
      });
    });
    await Promise.all(airdrops);
  });

  it("Is initialized!", async () => {
    const [protocolConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    await program.methods
      .initializeProtocol(protocolFeeBps, defaultCreatorFeeBps)
      .accounts({
        protocolConfig: protocolConfigPda,
        authority: authority.publicKey,
        treasury: treasury.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([authority])
      .rpc();

    const config = await program.account.protocolConfig.fetch(protocolConfigPda);
    assert.ok(config.authority.equals(authority.publicKey));
    assert.ok(config.treasury.equals(treasury.publicKey));
    assert.equal(config.protocolFeeBps, protocolFeeBps);
    assert.equal(config.defaultCreatorFeeBps, defaultCreatorFeeBps);
    assert.ok(!config.paused);
  });

  it("Create Creator Market", async () => {
    const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_market"), creatorId],
      program.programId
    );

    const [protocolConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    await program.methods
      .createCreatorMarket(Array.from(creatorId))
      .accounts({
        creatorMarket: marketPda,
        protocolConfig: protocolConfigPda,
        payer: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([creator])
      .rpc();

    const market = await program.account.creatorMarket.fetch(marketPda);
    assert.deepEqual(market.creatorId, Array.from(creatorId));
    assert.ok(market.creatorWallet.equals(anchor.web3.SystemProgram.programId));
    assert.ok(!market.claimed);
    assert.equal(market.supply.toNumber(), 0);
  });

  it("Buy Keys", async () => {
    const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_market"), creatorId],
      program.programId
    );
    const [protocolConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );
    const [userPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("position"), marketPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );
    const [creatorFeeVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_fee_vault"), marketPda.toBuffer()],
      program.programId
    );

    const amount = new anchor.BN(1);
    const maxSolCost = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL); // Overpay just in case

    await program.methods
      .buyKeys(amount, maxSolCost)
      .accounts({
        creatorMarket: marketPda,
        userPosition: userPositionPda,
        protocolConfig: protocolConfigPda,
        treasury: treasury.publicKey,
        creatorFeeVault: creatorFeeVault,
        buyer: buyer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();

    const market = await program.account.creatorMarket.fetch(marketPda);
    const position = await program.account.userPosition.fetch(userPositionPda);

    assert.equal(market.supply.toNumber(), 1);
    assert.equal(position.keyBalance.toNumber(), 1);
  });

  it("Buy Keys (Slippage Fail)", async () => {
    const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_market"), creatorId],
      program.programId
    );
    const [protocolConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );
    const [userPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("position"), marketPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );
    const [creatorFeeVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_fee_vault"), marketPda.toBuffer()],
      program.programId
    );

    const amount = new anchor.BN(1);
    const maxSolCost = new anchor.BN(1); // Unreasonably low max cost to trigger slippage

    try {
      await program.methods
        .buyKeys(amount, maxSolCost)
        .accounts({
          creatorMarket: marketPda,
          userPosition: userPositionPda,
          protocolConfig: protocolConfigPda,
          treasury: treasury.publicKey,
          creatorFeeVault: creatorFeeVault,
          buyer: buyer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([buyer])
        .rpc();
      assert.fail("Transaction should have failed with slippage error");
    } catch (err: any) {
      assert.include(err.message, "SlippageToleranceExceeded");
    }
  });

  it("Sell Keys", async () => {
    const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_market"), creatorId],
      program.programId
    );
    const [protocolConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );
    const [userPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("position"), marketPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );

    const amount = new anchor.BN(1);
    const minSolOutput = new anchor.BN(1);

    await program.methods
      .sellKeys(amount, minSolOutput)
      .accounts({
        creatorMarket: marketPda,
        userPosition: userPositionPda,
        protocolConfig: protocolConfigPda,
        treasury: treasury.publicKey,
        seller: buyer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();

    const market = await program.account.creatorMarket.fetch(marketPda);
    const position = await program.account.userPosition.fetch(userPositionPda);

    assert.equal(market.supply.toNumber(), 0);
    assert.equal(position.keyBalance.toNumber(), 0);
  });

  it("Claim Creator Fee", async () => {
    const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_market"), creatorId],
      program.programId
    );
    const [creatorFeeVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("creator_fee_vault"), marketPda.toBuffer()],
      program.programId
    );

    // Assuming we have to set the creator wallet first
    await program.methods
      .setCreatorWallet()
      .accounts({
        creatorMarket: marketPda,
        creator: creator.publicKey,
      } as any)
      .signers([creator])
      .rpc();

    // Now withdraw fees
    await program.methods
      .withdrawCreatorFees()
      .accounts({
        creatorMarket: marketPda,
        creator: creator.publicKey,
        creatorFeeVault: creatorFeeVault,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([creator])
      .rpc();
    
    // Assert successful claim
    const market = await program.account.creatorMarket.fetch(marketPda);
    assert.ok(market.creatorWallet.equals(creator.publicKey));
  });

  it("Update Protocol Config", async () => {
    const [protocolConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    await program.methods
      .updateProtocolConfig(300, 600, false)
      .accounts({
        protocolConfig: protocolConfigPda,
        authority: authority.publicKey,
      } as any)
      .signers([authority])
      .rpc();

    const config = await program.account.protocolConfig.fetch(protocolConfigPda);
    assert.equal(config.protocolFeeBps, 300);
    assert.equal(config.defaultCreatorFeeBps, 600);
  });
});
