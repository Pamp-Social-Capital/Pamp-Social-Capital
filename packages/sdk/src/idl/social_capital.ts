export type SocialCapital = {
  address: "FZUBnWcy7cq3RUbbUffMS61RpAoFHUTHABh8ibGacDQ2";
  metadata: {
    name: "socialCapital";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  version: "0.1.0";
  name: "socialCapital";
  instructions: [
    {
      name: "initializeProtocol";
      discriminator: [188, 233, 252, 106, 134, 146, 202, 91];
      accounts: [
        { name: "protocolConfig"; writable: true; signer: false },
        { name: "authority"; writable: true; signer: true },
        { name: "treasury"; writable: false; signer: false },
        { name: "systemProgram"; writable: false; signer: false }
      ];
      args: [
        { name: "protocolFeeBps"; type: "u16" },
        { name: "defaultCreatorFeeBps"; type: "u16" }
      ];
    },
    {
      name: "createCreatorMarket";
      discriminator: [189, 161, 33, 59, 174, 10, 224, 217];
      accounts: [
        { name: "creatorMarket"; writable: true; signer: false },
        { name: "protocolConfig"; writable: false; signer: false },
        { name: "payer"; writable: true; signer: true },
        { name: "systemProgram"; writable: false; signer: false }
      ];
      args: [{ name: "creatorId"; type: { array: ["u8", 32] } }];
    },
    {
      name: "buyKeys";
      discriminator: [24, 8, 156, 247, 54, 32, 202, 117];
      accounts: [
        { name: "creatorMarket"; writable: true; signer: false },
        { name: "userPosition"; writable: true; signer: false },
        { name: "protocolConfig"; writable: false; signer: false },
        { name: "treasury"; writable: true; signer: false },
        { name: "creatorFeeVault"; writable: true; signer: false },
        { name: "buyer"; writable: true; signer: true },
        { name: "systemProgram"; writable: false; signer: false }
      ];
      args: [
        { name: "amount"; type: "u64" },
        { name: "maxSolCost"; type: "u64" }
      ];
    },
    {
      name: "sellKeys";
      discriminator: [211, 221, 116, 16, 58, 49, 1, 247];
      accounts: [
        { name: "creatorMarket"; writable: true; signer: false },
        { name: "userPosition"; writable: true; signer: false },
        { name: "protocolConfig"; writable: false; signer: false },
        { name: "treasury"; writable: true; signer: false },
        { name: "creatorFeeVault"; writable: true; signer: false },
        { name: "seller"; writable: true; signer: true },
        { name: "systemProgram"; writable: false; signer: false }
      ];
      args: [
        { name: "amount"; type: "u64" },
        { name: "minSolOutput"; type: "u64" }
      ];
    },
    {
      name: "claimCreator";
      discriminator: [231, 240, 197, 249, 244, 10, 21, 59];
      accounts: [
        { name: "creatorMarket"; writable: true; signer: false },
        { name: "creatorWallet"; writable: true; signer: true }
      ];
      args: [];
    },
    {
      name: "withdrawCreatorFees";
      discriminator: [8, 30, 213, 18, 121, 105, 129, 222];
      accounts: [
        { name: "creatorMarket"; writable: true; signer: false },
        { name: "creatorFeeVault"; writable: true; signer: false },
        { name: "creatorWallet"; writable: true; signer: true },
        { name: "systemProgram"; writable: false; signer: false }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "protocolConfig";
      discriminator: [207, 91, 250, 28, 152, 179, 215, 209];
    },
    {
      name: "creatorMarket";
      discriminator: [88, 120, 123, 203, 45, 70, 195, 119];
    },
    {
      name: "userPosition";
      discriminator: [251, 248, 209, 245, 83, 234, 17, 27];
    }
  ];
  types: [
    {
      name: "protocolConfig";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "pubkey" },
          { name: "treasury"; type: "pubkey" },
          { name: "protocolFeeBps"; type: "u16" },
          { name: "defaultCreatorFeeBps"; type: "u16" },
          { name: "paused"; type: "bool" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "creatorMarket";
      type: {
        kind: "struct";
        fields: [
          { name: "creatorId"; type: { array: ["u8", 32] } },
          { name: "creatorWallet"; type: "pubkey" },
          { name: "claimed"; type: "bool" },
          { name: "supply"; type: "u64" },
          { name: "reserveLamports"; type: "u64" },
          { name: "totalVolumeLamports"; type: "u128" },
          { name: "creatorFeeBps"; type: "u16" },
          { name: "paused"; type: "bool" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "userPosition";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "pubkey" },
          { name: "creatorMarket"; type: "pubkey" },
          { name: "keyBalance"; type: "u64" },
          { name: "totalBoughtLamports"; type: "u128" },
          { name: "totalSoldLamports"; type: "u128" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "CreatorMarketCreated";
      type: { kind: "struct"; fields: [{ name: "creatorMarket"; type: "pubkey" }, { name: "creatorId"; type: { array: ["u8", 32] } }, { name: "creatorWallet"; type: "pubkey" }, { name: "creatorFeeBps"; type: "u16" }, { name: "timestamp"; type: "i64" }] };
    },
    {
      name: "KeysPurchased";
      type: { kind: "struct"; fields: [{ name: "buyer"; type: "pubkey" }, { name: "creatorMarket"; type: "pubkey" }, { name: "keyAmount"; type: "u64" }, { name: "grossCost"; type: "u64" }, { name: "curveCost"; type: "u64" }, { name: "creatorFee"; type: "u64" }, { name: "protocolFee"; type: "u64" }, { name: "newSupply"; type: "u64" }, { name: "spotPrice"; type: "u64" }, { name: "timestamp"; type: "i64" }] };
    },
    {
      name: "KeysSold";
      type: { kind: "struct"; fields: [{ name: "seller"; type: "pubkey" }, { name: "creatorMarket"; type: "pubkey" }, { name: "keyAmount"; type: "u64" }, { name: "grossReturn"; type: "u64" }, { name: "netReturn"; type: "u64" }, { name: "creatorFee"; type: "u64" }, { name: "protocolFee"; type: "u64" }, { name: "newSupply"; type: "u64" }, { name: "spotPrice"; type: "u64" }, { name: "timestamp"; type: "i64" }] };
    }
  ];
  events: [
    {
      name: "CreatorMarketCreated";
      discriminator: [0,0,0,0,0,0,0,0];
    },
    {
      name: "KeysPurchased";
      discriminator: [0,0,0,0,0,0,0,0];
    },
    {
      name: "KeysSold";
      discriminator: [0,0,0,0,0,0,0,0];
    }
  ];
  errors: [];
};

export const IDL: SocialCapital = {
  address: "FZUBnWcy7cq3RUbbUffMS61RpAoFHUTHABh8ibGacDQ2",
  metadata: {
    name: "socialCapital",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor"
  },
  version: "0.1.0",
  name: "socialCapital",
  instructions: [
    {
      name: "initializeProtocol",
      discriminator: [188, 233, 252, 106, 134, 146, 202, 91],
      accounts: [
        { name: "protocolConfig", writable: true, signer: false },
        { name: "authority", writable: true, signer: true },
        { name: "treasury", writable: false, signer: false },
        { name: "systemProgram", writable: false, signer: false }
      ],
      args: [
        { name: "protocolFeeBps", type: "u16" },
        { name: "defaultCreatorFeeBps", type: "u16" }
      ]
    },
    {
      name: "createCreatorMarket",
      discriminator: [189, 161, 33, 59, 174, 10, 224, 217],
      accounts: [
        { name: "creatorMarket", writable: true, signer: false },
        { name: "protocolConfig", writable: false, signer: false },
        { name: "payer", writable: true, signer: true },
        { name: "systemProgram", writable: false, signer: false }
      ],
      args: [{ name: "creatorId", type: { array: ["u8", 32] } }]
    },
    {
      name: "buyKeys",
      discriminator: [24, 8, 156, 247, 54, 32, 202, 117],
      accounts: [
        { name: "creatorMarket", writable: true, signer: false },
        { name: "userPosition", writable: true, signer: false },
        { name: "protocolConfig", writable: false, signer: false },
        { name: "treasury", writable: true, signer: false },
        { name: "creatorFeeVault", writable: true, signer: false },
        { name: "buyer", writable: true, signer: true },
        { name: "systemProgram", writable: false, signer: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "maxSolCost", type: "u64" }
      ]
    },
    {
      name: "sellKeys",
      discriminator: [211, 221, 116, 16, 58, 49, 1, 247],
      accounts: [
        { name: "creatorMarket", writable: true, signer: false },
        { name: "userPosition", writable: true, signer: false },
        { name: "protocolConfig", writable: false, signer: false },
        { name: "treasury", writable: true, signer: false },
        { name: "creatorFeeVault", writable: true, signer: false },
        { name: "seller", writable: true, signer: true },
        { name: "systemProgram", writable: false, signer: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "minSolOutput", type: "u64" }
      ]
    },
    {
      name: "claimCreator",
      discriminator: [231, 240, 197, 249, 244, 10, 21, 59],
      accounts: [
        { name: "creatorMarket", writable: true, signer: false },
        { name: "creatorWallet", writable: true, signer: true }
      ],
      args: []
    },
    {
      name: "withdrawCreatorFees",
      discriminator: [8, 30, 213, 18, 121, 105, 129, 222],
      accounts: [
        { name: "creatorMarket", writable: true, signer: false },
        { name: "creatorFeeVault", writable: true, signer: false },
        { name: "creatorWallet", writable: true, signer: true },
        { name: "systemProgram", writable: false, signer: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "protocolConfig",
      discriminator: [207, 91, 250, 28, 152, 179, 215, 209]
    },
    {
      name: "creatorMarket",
      discriminator: [88, 120, 123, 203, 45, 70, 195, 119]
    },
    {
      name: "userPosition",
      discriminator: [251, 248, 209, 245, 83, 234, 17, 27]
    }
  ],
  types: [
    {
      name: "protocolConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "treasury", type: "pubkey" },
          { name: "protocolFeeBps", type: "u16" },
          { name: "defaultCreatorFeeBps", type: "u16" },
          { name: "paused", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "creatorMarket",
      type: {
        kind: "struct",
        fields: [
          { name: "creatorId", type: { array: ["u8", 32] } },
          { name: "creatorWallet", type: "pubkey" },
          { name: "claimed", type: "bool" },
          { name: "supply", type: "u64" },
          { name: "reserveLamports", type: "u64" },
          { name: "totalVolumeLamports", type: "u128" },
          { name: "creatorFeeBps", type: "u16" },
          { name: "paused", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "userPosition",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "pubkey" },
          { name: "creatorMarket", type: "pubkey" },
          { name: "keyBalance", type: "u64" },
          { name: "totalBoughtLamports", type: "u128" },
          { name: "totalSoldLamports", type: "u128" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "CreatorMarketCreated",
      type: { kind: "struct", fields: [{ name: "creatorMarket", type: "pubkey" }, { name: "creatorId", type: { array: ["u8", 32] } }, { name: "creatorWallet", type: "pubkey" }, { name: "creatorFeeBps", type: "u16" }, { name: "timestamp", type: "i64" }] }
    },
    {
      name: "KeysPurchased",
      type: { kind: "struct", fields: [{ name: "buyer", type: "pubkey" }, { name: "creatorMarket", type: "pubkey" }, { name: "keyAmount", type: "u64" }, { name: "grossCost", type: "u64" }, { name: "curveCost", type: "u64" }, { name: "creatorFee", type: "u64" }, { name: "protocolFee", type: "u64" }, { name: "newSupply", type: "u64" }, { name: "spotPrice", type: "u64" }, { name: "timestamp", type: "i64" }] }
    },
    {
      name: "KeysSold",
      type: { kind: "struct", fields: [{ name: "seller", type: "pubkey" }, { name: "creatorMarket", type: "pubkey" }, { name: "keyAmount", type: "u64" }, { name: "grossReturn", type: "u64" }, { name: "netReturn", type: "u64" }, { name: "creatorFee", type: "u64" }, { name: "protocolFee", type: "u64" }, { name: "newSupply", type: "u64" }, { name: "spotPrice", type: "u64" }, { name: "timestamp", type: "i64" }] }
    }
  ],
  events: [
    {
      name: "CreatorMarketCreated",
      discriminator: [0,0,0,0,0,0,0,0]
    },
    {
      name: "KeysPurchased",
      discriminator: [0,0,0,0,0,0,0,0]
    },
    {
      name: "KeysSold",
      discriminator: [0,0,0,0,0,0,0,0]
    }
  ],
  errors: []
};

