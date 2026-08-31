use crate::errors::SocialCapitalError;
use crate::events::{CreatorClaimed, CreatorFeesWithdrawn};
use crate::state::{CreatorMarket, ProtocolConfig};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;

#[derive(Accounts)]
pub struct ClaimCreator<'info> {
    #[account(
        mut,
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub creator_wallet: Signer<'info>,
    /// CHECK: Instructions sysvar
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,
}

pub fn claim_creator(ctx: Context<ClaimCreator>) -> Result<()> {
    let market = &mut ctx.accounts.creator_market;
    
    require!(!market.claimed, SocialCapitalError::MarketAlreadyClaimed);

    // Verify Ed25519 signature
    let ixs = &ctx.accounts.instructions;
    let ed25519_ix = load_instruction_at_checked(0, ixs)
        .map_err(|_| SocialCapitalError::Unauthorized)?;
    
    require!(
        ed25519_ix.program_id == anchor_lang::solana_program::ed25519_program::ID,
        SocialCapitalError::Unauthorized
    );

    // The backend signer must be the one who signed this
    let backend_signer = ctx.accounts.protocol_config.backend_signer;

    // Build the expected message: claim_creator:<market_pubkey>:<wallet_pubkey>
    let mut expected_msg = b"claim_creator:".to_vec();
    expected_msg.extend_from_slice(market.key().to_string().as_bytes());
    expected_msg.extend_from_slice(b":");
    expected_msg.extend_from_slice(ctx.accounts.creator_wallet.key().to_string().as_bytes());

    // Ed25519 instruction data format:
    // 0: num_signatures
    // 1: padding
    // 2-3: signature_offset
    // 4-5: signature_instruction_index
    // 6-7: public_key_offset
    // 8-9: public_key_instruction_index
    // 10-11: message_data_offset
    // 12-13: message_data_size
    // 14-15: message_instruction_index
    
    require!(ed25519_ix.data.len() >= 16, SocialCapitalError::Unauthorized);

    let pubkey_offset = u16::from_le_bytes([ed25519_ix.data[6], ed25519_ix.data[7]]) as usize;
    let msg_offset = u16::from_le_bytes([ed25519_ix.data[10], ed25519_ix.data[11]]) as usize;
    let msg_size = u16::from_le_bytes([ed25519_ix.data[12], ed25519_ix.data[13]]) as usize;

    require!(
        ed25519_ix.data.len() >= pubkey_offset + 32,
        SocialCapitalError::Unauthorized
    );
    let recovered_pubkey = &ed25519_ix.data[pubkey_offset..pubkey_offset + 32];
    require!(
        recovered_pubkey == backend_signer.as_ref(),
        SocialCapitalError::Unauthorized
    );

    require!(
        ed25519_ix.data.len() >= msg_offset + msg_size,
        SocialCapitalError::Unauthorized
    );
    let recovered_msg = &ed25519_ix.data[msg_offset..msg_offset + msg_size];
    require!(
        recovered_msg == expected_msg.as_slice(),
        SocialCapitalError::Unauthorized
    );

    market.creator_wallet = ctx.accounts.creator_wallet.key();
    market.claimed = true;

    emit!(CreatorClaimed {
        creator_market: market.key(),
        creator_wallet: market.creator_wallet,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SetCreatorWallet<'info> {
    #[account(
        mut,
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump,
        has_one = creator_wallet @ SocialCapitalError::Unauthorized
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    pub creator_wallet: Signer<'info>,
}

pub fn set_creator_wallet(ctx: Context<SetCreatorWallet>, new_wallet: Pubkey) -> Result<()> {
    let market = &mut ctx.accounts.creator_market;
    market.creator_wallet = new_wallet;
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCreatorFees<'info> {
    #[account(
        seeds = [b"creator_market", creator_market.creator_id.as_ref()],
        bump = creator_market.bump,
        has_one = creator_wallet @ SocialCapitalError::Unauthorized
    )]
    pub creator_market: Account<'info, CreatorMarket>,
    
    /// CHECK: Creator fee vault PDA
    #[account(
        mut,
        seeds = [b"creator_fee_vault", creator_market.key().as_ref()],
        bump
    )]
    pub creator_fee_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator_wallet: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn withdraw_creator_fees(ctx: Context<WithdrawCreatorFees>) -> Result<()> {
    let vault = &ctx.accounts.creator_fee_vault;
    let amount = vault.lamports();
    
    require!(amount > 0, SocialCapitalError::MathOverflow); // Standard error for now

    let market_key = ctx.accounts.creator_market.key();
    let bump = ctx.bumps.creator_fee_vault;
    let seeds = &[
        b"creator_fee_vault".as_ref(),
        market_key.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    msg!("Withdrawing {} lamports from vault via CPI", amount);
    
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: vault.to_account_info(),
                to: ctx.accounts.creator_wallet.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;

    msg!("Successfully transferred {} lamports to creator", amount);

    emit!(CreatorFeesWithdrawn {
        creator_market: market_key,
        creator_wallet: ctx.accounts.creator_wallet.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
