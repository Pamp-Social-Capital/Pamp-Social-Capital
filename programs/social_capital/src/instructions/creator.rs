use crate::errors::SocialCapitalError;
use crate::events::{CreatorClaimed, CreatorFeesWithdrawn};
use crate::state::CreatorMarket;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimCreator<'info> {
    #[account(
        mut,
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    #[account(mut)]
    pub creator_wallet: Signer<'info>,
    // In a real app, you would verify an Ed25519 signature here 
    // to prove the user actually owns the X account associated with creator_id.
    // For MVP, we assume the backend acts as an oracle or we just claim it.
}

pub fn claim_creator(ctx: Context<ClaimCreator>) -> Result<()> {
    let market = &mut ctx.accounts.creator_market;
    
    require!(!market.claimed, SocialCapitalError::MarketAlreadyClaimed);

    market.creator_wallet = ctx.accounts.creator_wallet.key();
    market.claimed = true;

    emit!(CreatorClaimed {
        creator_market: market.key(),
        creator_wallet: market.creator_wallet,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SetCreatorWallet<'info> {
    #[account(
        mut,
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump,
        has_one = creator_wallet @ SocialCapitalError::Unauthorized
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    pub creator_wallet: Signer<'info>,
}

pub fn set_creator_wallet(ctx: Context<SetCreatorWallet>, new_wallet: Pubkey) -> Result<()> {
    let market = &mut ctx.accounts.creator_market;
    market.creator_wallet = new_wallet;
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCreatorFees<'info> {
    #[account(
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump,
        has_one = creator_wallet @ SocialCapitalError::Unauthorized
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    
    /// CHECK: Creator fee vault PDA
    #[account(
        mut,
        seeds = [b"creator_fee_vault", creator_market.key().as_ref()],
        bump
    )]
    pub creator_fee_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator_wallet: Signer<'info>,
}

pub fn withdraw_creator_fees(ctx: Context<WithdrawCreatorFees>) -> Result<()> {
    let vault = &ctx.accounts.creator_fee_vault;
    let amount = vault.lamports();
    
    require!(amount > 0, SocialCapitalError::MathOverflow); // Standard error for now

    let market_key = ctx.accounts.creator_market.key();
    let bump = ctx.bumps.creator_fee_vault;
    let seeds = &[
        b"creator_fee_vault".as_ref(),
        market_key.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    vault.sub_lamports(amount)?;
    ctx.accounts.creator_wallet.add_lamports(amount)?;

    emit!(CreatorFeesWithdrawn {
        creator_market: market_key,
        creator_wallet: ctx.accounts.creator_wallet.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
