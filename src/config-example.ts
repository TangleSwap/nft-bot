// Discord-API Bot-Tokenexport
export const BOT_TOKEN = '';

// A List of Treasury-Wallets
export const WALLET_LIST = [
    'YOUR_WALLET_ADDRESS_1',
    'YOUR_WALLET_ADDRESS_2',
    'YOUR_WALLET_ADDRESS_2',
    'YOUR_WALLET_ADDRESS_2',
    'YOUR_WALLET_ADDRESS_2',
];

// Ids of the NFT-Collections on Soonaverse currently maximum 10 supported
export const COLLECTION_ID = ['0x287eb6a8c83a352debe57bf0f3a96f30ff734825'];

// Id of the discord server
export const GUILD_ID = '995435565405196399';

// Enable NFT-RoleManager feature
export const GRANT_ROLES_TO_NFT_HOLDERS = true;

// Enable treasury as nickname
export const SHOW_TREASURY_INFO = false;

export type roleObj = {
    roleid: string;
    reqNFTs: number;
};

// A table of roles depending on the minimum amount of NFT hold, only role 0 and
// the highest role is granted
export const ROLES_TABLE: roleObj[] = [
    // { roleid: "997611833454243850", reqNFTs: 0 }, // 0 is granted to every NFT-Owner
    { roleid: '997605748546752594', reqNFTs: 1 }, // 0 is granted to every NFT-Owner
    { roleid: '997605909633187870', reqNFTs: 20 },
];
