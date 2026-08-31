use crate::constants::{BPS_DENOMINATOR, CREATOR_FEE_SHARE_BPS, PROTOCOL_FEE_SHARE_BPS, TOTAL_TRADING_FEE_BPS};
use crate::errors::SocialCapitalError;
use crate::events::{CreatorFeeAccrued, KeysSold, ProtocolFeeCollected};
use crate::math::{calculate_sell_return, calculate_spot_price};
use crate::state::{CreatorMarket, ProtocolConfig, UserPosition};
use anchor_lang::prelude::*;

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
        has_one = owner @ SocialCapitalError::InvalidOwner
    )]
    pub user_position: Account<'info, UserPosition>,
    
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
    require!(position.key_balance >= amount, SocialCapitalError::InsufficientKeys);

    let market = &mut ctx.accounts.creator_market;

    // 1. Calculate curve return
    let curve_return = calculate_sell_return(market.supply, amount)?;
    require!(market.reserve_lamports >= curve_return, SocialCapitalError::InsolvencyRisk);

    // 2. Calculate fees (1.25% total, 95% of that to creator, 5% to protocol)
    let total_fee = (curve_return as u128)
        .checked_mul(TOTAL_TRADING_FEE_BPS as u128)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(SocialCapitalError::MathOverflow)?;

    let creator_fee = total_fee
        .checked_mul(CREATOR_FEE_SHARE_BPS as u128)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(SocialCapitalError::MathOverflow)? as u64;

    let protocol_fee = total_fee
        .checked_sub(creator_fee as u128)
        .ok_or(SocialCapitalError::MathOverflow)? as u64;

    // 3. Validate min return (slippage)
    let net_return = curve_return
        .checked_sub(protocol_fee)
        .ok_or(SocialCapitalError::MathOverflow)?
        .checked_sub(creator_fee)
        .ok_or(SocialCapitalError::MathOverflow)?;

    require!(net_return >= min_sol_received, SocialCapitalError::SlippageExceeded);

    // 4. Transfer SOL from Curve Reserve (PDA)
    // We update lamports directly since it's a PDA.

    // 4a. To Seller (net_return)
    if net_return > 0 {
        market.sub_lamports(net_return)?;
        ctx.accounts.seller.add_lamports(net_return)?;
    }

    // 4b. To Protocol (psc_buyback_vault)
    if protocol_fee > 0 {
        market.sub_lamports(protocol_fee)?;
        ctx.accounts.psc_buyback_vault.add_lamports(protocol_fee)?;
    }

    // 4c. To Creator (creator_fee_vault)
    if creator_fee > 0 {
        market.sub_lamports(creator_fee)?;
        ctx.accounts.creator_fee_vault.add_lamports(creator_fee)?;
    }

    // 5. Update State
    market.supply = market.supply.checked_sub(amount).unwrap();
    market.reserve_lamports = market.reserve_lamports.checked_sub(curve_return).unwrap();
    market.total_volume_lamports = market.total_volume_lamports.checked_add(curve_return as u128).unwrap();
    
    position.key_balance = position.key_balance.checked_sub(amount).unwrap();
    position.total_sold_lamports = position.total_sold_lamports.checked_add(net_return as u128).unwrap();

    // 6. Emit Events
    let spot_price = calculate_spot_price(market.supply)?;
    
    emit!(KeysSold {
        seller: ctx.accounts.seller.key(),
        creator_market: market.key(),
        key_amount: amount,
        gross_return: curve_return,
        net_return,
        creator_fee,
        protocol_fee,
        new_supply: market.supply,
        spot_price,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    if protocol_fee > 0 {
        emit!(ProtocolFeeCollected {
            amount: protocol_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    if creator_fee > 0 {
        emit!(CreatorFeeAccrued {
            creator_market: market.key(),
            amount: creator_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    Ok(())
}
