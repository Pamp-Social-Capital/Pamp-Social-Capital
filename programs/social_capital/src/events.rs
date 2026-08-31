use anchor_lang::prelude::*;

#[event]
pub struct CreatorMarketCreated {
    pub creator_market: Pubkey,
    pub creator_id: [u8; 32],
    pub creator_wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct KeysPurchased {
    pub buyer: Pubkey,
    pub creator_market: Pubkey,
    pub key_amount: u64,
    pub gross_cost: u64,
    pub curve_cost: u64,
    pub creator_fee: u64,
    pub protocol_fee: u64,
    pub new_supply: u64,
    pub spot_price: u64,
    pub timestamp: i64,
}

#[event]
pub struct KeysSold {
    pub seller: Pubkey,
    pub creator_market: Pubkey,
    pub key_amount: u64,
    pub gross_return: u64,
    pub net_return: u64,
    pub creator_fee: u64,
    pub protocol_fee: u64,
    pub new_supply: u64,
    pub spot_price: u64,
    pub timestamp: i64,
}

#[event]
pub struct CreatorClaimed {
    pub creator_market: Pubkey,
    pub creator_wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CreatorFeesWithdrawn {
    pub creator_market: Pubkey,
    pub creator_wallet: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct CreatorFeeAccrued {
    pub creator_market: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolFeeCollected {
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct PscBuybackExecuted {
    pub caller: Pubkey,
    pub sol_spent: u64,
    pub psc_received: u64,
    pub timestamp: i64,
}

#[event]
pub struct PscBurnExecuted {
    pub amount: u64,
    pub timestamp: i64,
}
