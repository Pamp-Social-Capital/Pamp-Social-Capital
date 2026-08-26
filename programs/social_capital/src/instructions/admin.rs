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
    protocol_fee_bps: Option<u16>,
    default_creator_fee_bps: Option<u16>,
    new_authority: Option<Pubkey>,
    new_treasury: Option<Pubkey>,
) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;

    if let Some(fee) = protocol_fee_bps {
        config.protocol_fee_bps = fee;
    }
    if let Some(fee) = default_creator_fee_bps {
        config.default_creator_fee_bps = fee;
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
