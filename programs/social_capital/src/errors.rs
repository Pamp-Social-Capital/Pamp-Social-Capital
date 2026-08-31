use anchor_lang::prelude::*;

#[error_code]
pub enum SocialCapitalError {
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Protocol is currently paused")]
    ProtocolPaused,
    #[msg("Creator market is currently paused")]
    MarketPaused,
    #[msg("Slippage limit exceeded")]
    SlippageExceeded,
    #[msg("Insufficient key balance")]
    InsufficientKeyBalance,
    #[msg("Market already claimed")]
    MarketAlreadyClaimed,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid creator wallet")]
    InvalidCreatorWallet,
    #[msg("Insolvency risk")]
    InsolvencyRisk,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Insufficient keys")]
    InsufficientKeys,
}
