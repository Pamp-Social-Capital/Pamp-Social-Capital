use crate::errors::SocialCapitalError;
use crate::events::{PscBuybackExecuted, PscBurnExecuted};
use crate::state::{BuybackState, ProtocolConfig};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ExecuteBuyback<'info> {
    #[account(
        mut,
        seeds = [b"buyback_state"],
        bump = buyback_state.bump,
        has_one = authority
    )]
    pub buyback_state: Account<'info, BuybackState>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// CHECK: PSC Buyback vault PDA
    #[account(
        mut,
        seeds = [b"psc_buyback_vault"],
        bump
    )]
    pub psc_buyback_vault: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = keeper_token_account.mint == protocol_config.psc_mint
    )]
    pub keeper_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = protocol_config.psc_mint
    )]
    pub psc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn execute_buyback(
    ctx: Context<ExecuteBuyback>,
    sol_amount: u64,
    psc_amount: u64,
) -> Result<()> {
    require!(!ctx.accounts.protocol_config.paused, SocialCapitalError::ProtocolPaused);
    require!(!ctx.accounts.buyback_state.paused, SocialCapitalError::MarketPaused);

    let vault = &mut ctx.accounts.psc_buyback_vault;
    require!(vault.lamports() >= sol_amount, SocialCapitalError::InsolvencyRisk);

    // 1. Burn PSC tokens from Keeper
    let cpi_accounts = Burn {
        mint: ctx.accounts.psc_mint.to_account_info(),
        from: ctx.accounts.keeper_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::burn(cpi_ctx, psc_amount)?;

    // 2. Transfer SOL from Buyback Vault to Keeper
    vault.sub_lamports(sol_amount)?;
    ctx.accounts.authority.add_lamports(sol_amount)?;

    // 3. Update Buyback State
    let state = &mut ctx.accounts.buyback_state;
    state.total_sol_deployed = state.total_sol_deployed.checked_add(sol_amount).unwrap();
    state.total_psc_bought = state.total_psc_bought.checked_add(psc_amount).unwrap();
    state.total_psc_burned = state.total_psc_burned.checked_add(psc_amount).unwrap();
    state.last_buyback_at = Clock::get()?.unix_timestamp;

    // 4. Emit Events
    emit!(PscBuybackExecuted {
        caller: ctx.accounts.authority.key(),
        sol_spent: sol_amount,
        psc_received: psc_amount,
        timestamp: state.last_buyback_at,
    });

    emit!(PscBurnExecuted {
        amount: psc_amount,
        timestamp: state.last_buyback_at,
    });

    Ok(())
}
