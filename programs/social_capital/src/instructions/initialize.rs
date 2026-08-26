use crate::state::ProtocolConfig;
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
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Safe, just a public key for receiving protocol fees
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_protocol(
    ctx: Context<InitializeProtocol>,
    protocol_fee_bps: u16,
    default_creator_fee_bps: u16,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_config;
    protocol.authority = ctx.accounts.authority.key();
    protocol.treasury = ctx.accounts.treasury.key();
    protocol.protocol_fee_bps = protocol_fee_bps;
    protocol.default_creator_fee_bps = default_creator_fee_bps;
    protocol.paused = false;
    protocol.bump = ctx.bumps.protocol_config;
    Ok(())
}
