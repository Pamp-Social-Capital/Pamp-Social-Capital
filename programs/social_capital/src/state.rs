use anchor_lang::prelude::*;

#[account]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub protocol_fee_bps: u16,
    pub default_creator_fee_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

impl ProtocolConfig {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 2 + 2 + 1 + 1;
}

#[account]
pub struct CreatorMarket {
    pub creator_id: [u8; 32],
    pub creator_wallet: Pubkey,
    pub claimed: bool,
    pub supply: u64,
    pub reserve_lamports: u64,
    pub total_volume_lamports: u128,
    pub creator_fee_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

impl CreatorMarket {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 1 + 8 + 8 + 16 + 2 + 1 + 1;
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub creator_market: Pubkey,
    pub key_balance: u64,
    pub total_bought_lamports: u128,
    pub total_sold_lamports: u128,
    pub bump: u8,
}

impl UserPosition {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 8 + 16 + 16 + 1;
}
