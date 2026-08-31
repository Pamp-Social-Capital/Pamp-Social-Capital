use crate::errors::SocialCapitalError;
use crate::events::CreatorMarketCreated;
use crate::state::{CreatorMarket, ProtocolConfig};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(creator_id: [u8; 32])]
pub struct CreateCreatorMarket<'info> {
    #[account(
        init,
        payer = payer,
        space = CreatorMarket::INIT_SPACE,
        seeds = [b"creator_market", creator_id.as_ref()],
        bump
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_creator_market(ctx: Context<CreateCreatorMarket>, creator_id: [u8; 32]) -> Result<()> {
    require!(!ctx.accounts.protocol_config.paused, SocialCapitalError::ProtocolPaused);

    let market = &mut ctx.accounts.creator_market;
    let config = &ctx.accounts.protocol_config;

    market.creator_id = creator_id;
    // Default wallet is the system program until claimed by actual creator
    market.creator_wallet = ctx.accounts.system_program.key();
    market.claimed = false;
    market.supply = 0;
    market.reserve_lamports = 0;
    market.total_volume_lamports = 0;
    market.paused = false;
    market.bump = ctx.bumps.creator_market;

    emit!(CreatorMarketCreated {
        creator_market: market.key(),
        creator_id,
        creator_wallet: market.creator_wallet,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
