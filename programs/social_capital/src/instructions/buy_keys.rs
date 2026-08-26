use crate::errors::SocialCapitalError;
use crate::events::KeysPurchased;
use crate::math::{calculate_buy_cost, calculate_spot_price};
use crate::state::{CreatorMarket, ProtocolConfig, UserPosition};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
pub struct BuyKeys<'info> {
    #[account(
        mut,
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = UserPosition::INIT_SPACE,
        seeds = [b"position", creator_market.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,
    
    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    /// CHECK: Validated against protocol_config.treasury
    #[account(mut, address = protocol_config.treasury)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Creator fee vault PDA
    #[account(
        mut,
        seeds = [b"creator_fee_vault", creator_market.key().as_ref()],
        bump
    )]
    pub creator_fee_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn buy_keys(ctx: Context<BuyKeys>, amount: u64, max_sol_cost: u64) -> Result<()> {
    require!(!ctx.accounts.protocol_config.paused, SocialCapitalError::ProtocolPaused);
    require!(!ctx.accounts.creator_market.paused, SocialCapitalError::MarketPaused);

    let market = &mut ctx.accounts.creator_market;
    let config = &ctx.accounts.protocol_config;

    // 1. Calculate curve cost
    let curve_cost = calculate_buy_cost(market.supply, amount)?;

    // 2. Calculate fees
    let protocol_fee = (curve_cost as u128)
        .checked_mul(config.protocol_fee_bps as u128)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(SocialCapitalError::MathOverflow)? as u64;

    let creator_fee = (curve_cost as u128)
        .checked_mul(market.creator_fee_bps as u128)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(SocialCapitalError::MathOverflow)? as u64;

    // 3. Validate max cost (slippage)
    let total_cost = curve_cost
        .checked_add(protocol_fee)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_add(creator_fee)
        .ok_or(SocialCapitalError::MathOverflow)?;

    require!(total_cost <= max_sol_cost, SocialCapitalError::SlippageExceeded);

    // 4. Transfer SOL from buyer to Curve Reserve (Market PDA)
    if curve_cost > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: market.to_account_info(),
                },
            ),
            curve_cost,
        )?;
        market.reserve_lamports = market.reserve_lamports.checked_add(curve_cost).unwrap();
    }

    // 5. Transfer Protocol Fee
    if protocol_fee > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            protocol_fee,
        )?;
    }

    // 6. Transfer Creator Fee to Vault
    if creator_fee > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.creator_fee_vault.to_account_info(),
                },
            ),
            creator_fee,
        )?;
    }

    // 7. Update State
    market.supply = market.supply.checked_add(amount).unwrap();
    market.total_volume_lamports = market.total_volume_lamports.checked_add(curve_cost as u128).unwrap();
    
    let position = &mut ctx.accounts.user_position;
    if position.owner == Pubkey::default() {
        position.owner = ctx.accounts.buyer.key();
        position.creator_market = market.key();
        position.bump = ctx.bumps.user_position;
    }
    position.key_balance = position.key_balance.checked_add(amount).unwrap();
    position.total_bought_lamports = position.total_bought_lamports.checked_add(total_cost as u128).unwrap();

    // 8. Emit Event
    let spot_price = calculate_spot_price(market.supply)?;
    
    emit!(KeysPurchased {
        buyer: ctx.accounts.buyer.key(),
        creator_market: market.key(),
        key_amount: amount,
        gross_cost: total_cost,
        curve_cost,
        creator_fee,
        protocol_fee,
        new_supply: market.supply,
        spot_price,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
