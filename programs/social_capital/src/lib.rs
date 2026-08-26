use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

use instructions::*;

declare_id!("FZUBnWcy7cq3RUbbUffMS61RpAoFHUTHABh8ibGacDQ2");

#[program]
pub mod social_capital {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
        default_creator_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize_protocol(ctx, protocol_fee_bps, default_creator_fee_bps)
    }

    pub fn create_creator_market(
        ctx: Context<CreateCreatorMarket>,
        creator_id: [u8; 32],
    ) -> Result<()> {
        instructions::create_creator_market(ctx, creator_id)
    }

    pub fn buy_keys(ctx: Context<BuyKeys>, amount: u64, max_sol_cost: u64) -> Result<()> {
        instructions::buy_keys(ctx, amount, max_sol_cost)
    }

    pub fn sell_keys(ctx: Context<SellKeys>, amount: u64, min_sol_received: u64) -> Result<()> {
        instructions::sell_keys(ctx, amount, min_sol_received)
    }

    pub fn update_protocol_config(
        ctx: Context<AdminAction>,
        protocol_fee_bps: Option<u16>,
        default_creator_fee_bps: Option<u16>,
        new_authority: Option<Pubkey>,
        new_treasury: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_protocol_config(
            ctx,
            protocol_fee_bps,
            default_creator_fee_bps,
            new_authority,
            new_treasury,
        )
    }

    pub fn pause_protocol(ctx: Context<AdminAction>) -> Result<()> {
        instructions::pause_protocol(ctx)
    }

    pub fn unpause_protocol(ctx: Context<AdminAction>) -> Result<()> {
        instructions::unpause_protocol(ctx)
    }

    pub fn claim_creator(ctx: Context<ClaimCreator>) -> Result<()> {
        instructions::claim_creator(ctx)
    }

    pub fn set_creator_wallet(ctx: Context<SetCreatorWallet>, new_wallet: Pubkey) -> Result<()> {
        instructions::set_creator_wallet(ctx, new_wallet)
    }

    pub fn withdraw_creator_fees(ctx: Context<WithdrawCreatorFees>) -> Result<()> {
        instructions::withdraw_creator_fees(ctx)
    }
}

