import { Roles } from './roleManager';

// Discord-API Bot-Tokenexport
export const BOT_TOKEN = ''; // TODO populate this

// Ids of the NFT-Collections on Soonaverse currently maximum 10
export const COLLECTION_IDS = ['0x287eb6a8c83a352debe57bf0f3a96f30ff734825'];

// Id of the discord server
export const GUILD_ID = '995435565405196399';

// Roles depending on the minimum amount of NFT hold
// Object keyed by nftType then required number of those NFTs and then
// the role that gives you. This means a user will be given one role per
// nft group
export const ROLES: Roles = {
    Palm: {
        '1': '999610366839496704',
        '5': '999610688681037904',
        '10': '999610766124654662',
    },
    Floating: {
        '1': '999610813243478046',
        '5': '999610933674528798',
        '10': '999610974128582717',
    },
    Tranquillity: {
        '1': '999611058354393168',
        '5': '999611131154927649',
        '10': '999611278517616640',
    },
    Ascension: {
        '1': '999611309685489674',
        '5': '999611362433040424',
        '10': '999611412273959012',
    },
    Night: {
        '1': '999611525935415336',
        '5': '999611595707654175',
        '10': '999611644982341693',
    },
};
