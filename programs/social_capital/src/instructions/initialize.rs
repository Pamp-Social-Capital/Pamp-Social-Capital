use crate::state::{BuybackState, ProtocolConfig};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = authority,
        space = ProtocolConfig::INIT_SPACE,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    #[account(
        init,
        payer = authority,
        space = BuybackState::INIT_SPACE,
        seeds = [b"buyback_state"],
        bump
    )]
    pub buyback_state: Account<'info, BuybackState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Safe, just a public key for receiving protocol fees
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_protocol(
    ctx: Context<InitializeProtocol>,
    psc_mint: Pubkey,
    backend_signer: Pubkey,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_config;
    protocol.authority = ctx.accounts.authority.key();
    protocol.treasury = ctx.accounts.treasury.key();
    protocol.protocol_fee_bps = 0;
    protocol.default_creator_fee_bps = 0;
    protocol.psc_mint = psc_mint;
    protocol.backend_signer = backend_signer;
    protocol.paused = false;
    protocol.bump = ctx.bumps.protocol_config;

    let buyback = &mut ctx.accounts.buyback_state;
    buyback.authority = ctx.accounts.authority.key();
    buyback.psc_mint = psc_mint;
    buyback.total_sol_collected = 0;
    buyback.total_sol_deployed = 0;
    buyback.total_psc_bought = 0;
    buyback.total_psc_burned = 0;
    buyback.last_buyback_at = 0;
    buyback.paused = false;
    buyback.bump = ctx.bumps.buyback_state;

    Ok(())
}
