use crate::errors::SocialCapitalError;
use crate::state::ProtocolConfig;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"protocol"],
        bump = protocol_config.bump,
        has_one = authority
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

pub fn update_protocol_config(
    ctx: Context<AdminAction>,
    psc_mint: Option<Pubkey>,
    backend_signer: Option<Pubkey>,
    new_authority: Option<Pubkey>,
    new_treasury: Option<Pubkey>,
) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;

    if let Some(mint) = psc_mint {
        config.psc_mint = mint;
    }
    if let Some(signer) = backend_signer {
        config.backend_signer = signer;
    }
    if let Some(auth) = new_authority {
        config.authority = auth;
    }
    if let Some(treasury) = new_treasury {
        config.treasury = treasury;
    }

    Ok(())
}

pub fn pause_protocol(ctx: Context<AdminAction>) -> Result<()> {
    ctx.accounts.protocol_config.paused = true;
    Ok(())
}

pub fn unpause_protocol(ctx: Context<AdminAction>) -> Result<()> {
    ctx.accounts.protocol_config.paused = false;
    Ok(())
}
