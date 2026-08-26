use crate::errors::SocialCapitalError;
use anchor_lang::prelude::*;

// k = 100,000 lamports (0.0001 SOL)
// Price(s) = k * s^2
pub const K_CONSTANT: u128 = 100_000;

pub fn calculate_spot_price(supply: u64) -> Result<u64> {
    let supply_u128 = supply as u128;
    let price = K_CONSTANT
        .checked_mul(supply_u128.checked_pow(2).ok_or(SocialCapitalError::MathOverflow)?)
        .ok_or(SocialCapitalError::MathOverflow)?;
    Ok(price as u64)
}

// Integral of k * s^2 ds is (k / 3) * s^3
// Cost from s1 to s2 is (k / 3) * (s2^3 - s1^3)
pub fn calculate_buy_cost(current_supply: u64, amount: u64) -> Result<u64> {
    if amount == 0 {
        return Ok(0);
    }
    
    let s1 = current_supply as u128;
    let s2 = (current_supply.checked_add(amount).ok_or(SocialCapitalError::MathOverflow)?) as u128;

    let s2_cubed = s2.checked_pow(3).ok_or(SocialCapitalError::MathOverflow)?;
    let s1_cubed = s1.checked_pow(3).ok_or(SocialCapitalError::MathOverflow)?;
    
    let diff = s2_cubed.checked_sub(s1_cubed).ok_or(SocialCapitalError::MathOverflow)?;
    
    let cost = (K_CONSTANT.checked_mul(diff).ok_or(SocialCapitalError::MathOverflow)?) / 3;
    
    Ok(cost as u64)
}

pub fn calculate_sell_return(current_supply: u64, amount: u64) -> Result<u64> {
    if amount == 0 || current_supply < amount {
        return Ok(0);
    }
    
    let s2 = current_supply as u128;
    let s1 = (current_supply.checked_sub(amount).ok_or(SocialCapitalError::MathOverflow)?) as u128;

    let s2_cubed = s2.checked_pow(3).ok_or(SocialCapitalError::MathOverflow)?;
    let s1_cubed = s1.checked_pow(3).ok_or(SocialCapitalError::MathOverflow)?;
    
    let diff = s2_cubed.checked_sub(s1_cubed).ok_or(SocialCapitalError::MathOverflow)?;
    
    let return_amount = (K_CONSTANT.checked_mul(diff).ok_or(SocialCapitalError::MathOverflow)?) / 3;
    
    Ok(return_amount as u64)
}

pub fn calculate_market_cap(current_supply: u64) -> Result<u64> {
    let spot_price = calculate_spot_price(current_supply)?;
    let mcap = (spot_price as u128)
        .checked_mul(current_supply as u128)
        .ok_or(SocialCapitalError::MathOverflow)?;
    Ok(mcap as u64)
}
