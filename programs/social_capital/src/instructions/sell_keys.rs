use crate::errors::SocialCapitalError;
use crate::events::KeysSold;
use crate::math::{calculate_sell_return, calculate_spot_price};
use crate::state::{CreatorMarket, ProtocolConfig, UserPosition};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
pub struct SellKeys<'info> {
    #[account(
        mut,
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    
    #[account(
        mut,
        seeds = [b"position", creator_market.key().as_ref(), seller.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.owner == seller.key()
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
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn sell_keys(ctx: Context<SellKeys>, amount: u64, min_sol_received: u64) -> Result<()> {
    require!(!ctx.accounts.protocol_config.paused, SocialCapitalError::ProtocolPaused);
    require!(!ctx.accounts.creator_market.paused, SocialCapitalError::MarketPaused);

    let position = &mut ctx.accounts.user_position;
    require!(position.key_balance >= amount, SocialCapitalError::InsufficientKeyBalance);

    let market = &mut ctx.accounts.creator_market;
    let config = &ctx.accounts.protocol_config;

    // 1. Calculate sell return (gross)
    let gross_return = calculate_sell_return(market.supply, amount)?;

    // 2. Calculate fees from the gross return
    let protocol_fee = (gross_return as u128)
        .checked_mul(config.protocol_fee_bps as u128)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(SocialCapitalError::MathOverflow)? as u64;

    let creator_fee = (gross_return as u128)
        .checked_mul(market.creator_fee_bps as u128)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(SocialCapitalError::MathOverflow)? as u64;

    let total_fees = protocol_fee
        .checked_add(creator_fee)
        .ok_or(SocialCapitalError::MathOverflow)?;

    // 3. Calculate net return to seller
    let net_return = gross_return
        .checked_sub(total_fees)
        .ok_or(SocialCapitalError::MathOverflow)?;

    // 4. Validate min received (slippage)
    require!(net_return >= min_sol_received, SocialCapitalError::SlippageExceeded);

    // 5. Transfer SOL from Curve Reserve (Market PDA) to Seller
    // First, update internal state before transfer
    market.reserve_lamports = market.reserve_lamports.checked_sub(gross_return).unwrap();
    
    let market_key = market.key();
    let creator_id = market.creator_id;
    let bump = market.bump;
    let seeds = &[
        b"creator_market".as_ref(),
        creator_id.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    if net_return > 0 {
        market.sub_lamports(net_return)?;
        ctx.accounts.seller.add_lamports(net_return)?;
    }

    // 6. Transfer Fees from Curve Reserve to Vaults
    if protocol_fee > 0 {
        market.sub_lamports(protocol_fee)?;
        ctx.accounts.treasury.add_lamports(protocol_fee)?;
    }

    if creator_fee > 0 {
        market.sub_lamports(creator_fee)?;
        ctx.accounts.creator_fee_vault.add_lamports(creator_fee)?;
    }

    // 7. Update State
    market.supply = market.supply.checked_sub(amount).unwrap();
    market.total_volume_lamports = market.total_volume_lamports.checked_add(gross_return as u128).unwrap();
    
    position.key_balance = position.key_balance.checked_sub(amount).unwrap();
    position.total_sold_lamports = position.total_sold_lamports.checked_add(net_return as u128).unwrap();

    // 8. Emit Event
    let spot_price = calculate_spot_price(market.supply)?;
    
    emit!(KeysSold {
        seller: ctx.accounts.seller.key(),
        creator_market: market_key,
        key_amount: amount,
        gross_return,
        net_return,
        creator_fee,
        protocol_fee,
        new_supply: market.supply,
        spot_price,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
