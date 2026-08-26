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
      accounts: [
        { name: "protocolConfig"; isMut: true; isSigner: false },
        { name: "authority"; isMut: true; isSigner: true },
        { name: "treasury"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "protocolFeeBps"; type: "u16" },
        { name: "defaultCreatorFeeBps"; type: "u16" }
      ];
    },
    {
      name: "createCreatorMarket";
      accounts: [
        { name: "creatorMarket"; isMut: true; isSigner: false },
        { name: "protocolConfig"; isMut: false; isSigner: false },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [{ name: "creatorId"; type: { array: ["u8", 32] } }];
    },
    {
      name: "buyKeys";
      accounts: [
        { name: "creatorMarket"; isMut: true; isSigner: false },
        { name: "userPosition"; isMut: true; isSigner: false },
        { name: "protocolConfig"; isMut: false; isSigner: false },
        { name: "treasury"; isMut: true; isSigner: false },
        { name: "creatorFeeVault"; isMut: true; isSigner: false },
        { name: "buyer"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "amount"; type: "u64" },
        { name: "maxSolCost"; type: "u64" }
      ];
    }
  ];
  accounts: [
    {
      name: "protocolConfig";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "publicKey" },
          { name: "treasury"; type: "publicKey" },
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
          { name: "creatorWallet"; type: "publicKey" },
          { name: "reserveLamports"; type: "u64" },
          { name: "supply"; type: "u64" },
          { name: "totalVolumeLamports"; type: "u128" },
          { name: "creatorFeeBps"; type: "u16" },
          { name: "claimed"; type: "bool" },
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
          { name: "owner"; type: "publicKey" },
          { name: "creatorMarket"; type: "publicKey" },
          { name: "keyBalance"; type: "u64" },
          { name: "totalBoughtLamports"; type: "u128" },
          { name: "totalSoldLamports"; type: "u128" },
          { name: "bump"; type: "u8" }
        ];
      };
    }
  ];
  events: [];
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
      accounts: [
        { name: "protocolConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "treasury", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "protocolFeeBps", type: "u16" },
        { name: "defaultCreatorFeeBps", type: "u16" }
      ]
    },
    {
      name: "createCreatorMarket",
      accounts: [
        { name: "creatorMarket", isMut: true, isSigner: false },
        { name: "protocolConfig", isMut: false, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "creatorId", type: { array: ["u8", 32] } }]
    },
    {
      name: "buyKeys",
      accounts: [
        { name: "creatorMarket", isMut: true, isSigner: false },
        { name: "userPosition", isMut: true, isSigner: false },
        { name: "protocolConfig", isMut: false, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "creatorFeeVault", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "maxSolCost", type: "u64" }
      ]
    }
  ],
  accounts: [
    {
      name: "protocolConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "treasury", type: "publicKey" },
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
          { name: "creatorWallet", type: "publicKey" },
          { name: "reserveLamports", type: "u64" },
          { name: "supply", type: "u64" },
          { name: "totalVolumeLamports", type: "u128" },
          { name: "creatorFeeBps", type: "u16" },
          { name: "claimed", type: "bool" },
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
          { name: "owner", type: "publicKey" },
          { name: "creatorMarket", type: "publicKey" },
          { name: "keyBalance", type: "u64" },
          { name: "totalBoughtLamports", type: "u128" },
          { name: "totalSoldLamports", type: "u128" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  events: [],
  errors: []
};
