use anchor_lang::prelude::*;

#[account]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub protocol_fee_bps: u16, // Preserved for backward ABI compatibility
    pub default_creator_fee_bps: u16, // Preserved for backward ABI compatibility
    pub paused: bool,
    pub bump: u8,
    // Newly added fields must be at the end
    pub psc_mint: Pubkey, 
    pub backend_signer: Pubkey,
}

impl ProtocolConfig {
    // 8 (discriminator) + 32 + 32 + 2 + 2 + 1 + 1 + 32 + 32
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 2 + 2 + 1 + 1 + 32 + 32;
}

#[account]
pub struct CreatorMarket {
    pub creator_id: [u8; 32],
    pub creator_wallet: Pubkey,
    pub claimed: bool,
    pub supply: u64,
    pub reserve_lamports: u64,
    pub total_volume_lamports: u128,
    pub creator_fee_bps: u16, // Preserved for backward ABI compatibility
    pub paused: bool,
    pub bump: u8,
}

impl CreatorMarket {
    // 8 (discriminator) + 32 + 32 + 1 + 8 + 8 + 16 + 2 + 1 + 1
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

#[account]
pub struct BuybackState {
    pub authority: Pubkey,
    pub psc_mint: Pubkey,
    pub total_sol_collected: u64,
    pub total_sol_deployed: u64,
    pub total_psc_bought: u64,
    pub total_psc_burned: u64,
    pub last_buyback_at: i64,
    pub paused: bool,
    pub bump: u8,
}

impl BuybackState {
    // 8 (discriminator) + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}
