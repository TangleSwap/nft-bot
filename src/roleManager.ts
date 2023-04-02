import { COLLECTION_ID, GUILD_ID, ROLES } from './config';
import { DISCORD_CLIENT } from './main';
import { SoonaverseApiManager } from './soonaverseApiManager';

const CHUNK_SIZE = 10;
export interface NftRoles {
    [reqNftCount: string]: string;
}

export interface Roles {
    [nftType: string]: NftRoles;
}

const ROLE_IDS = new Set();
Object.values(ROLES).forEach((nftRoles) => {
    Object.values(nftRoles).forEach((roleId) => {
        ROLE_IDS.add(roleId);
    });
});

export async function updateCurrentHolders() {
    console.log('Getting Current Holders');
    const nfts: any = await SoonaverseApiManager.getNftsByCollection(COLLECTION_ID);
    const addressToNfts = new Map<string, Map<string, number>>();
    const ownerAddresses: string[] = [];
    nfts.forEach((nftObj: any) => {
        const owner: string = nftObj['owner']!;
        // 'XXX Tranquillity Avenue' get Tranquillity
        const nftType = nftObj['name'].split(' ', 2)[1];

        if (addressToNfts.has(owner)) {
            const ownerNfts = addressToNfts.get(owner)!;
            let nftCount = 0;
            if (ownerNfts?.has(nftType)) {
                nftCount = ownerNfts.get(nftType)!;
            }
            ownerNfts.set(nftType, nftCount + 1);
        } else {
            ownerAddresses.push(owner);
            const ownerNfts = new Map<string, number>();
            ownerNfts.set(nftType, 1);
            addressToNfts.set(owner, ownerNfts);
        }
    });

    let discordToNfts = await getDiscordToNfts(ownerAddresses, addressToNfts)

    await syncBatchRoles(discordToNfts);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDiscordToNfts(ownerAddresses: string[], addressToNfts: Map<string, Map<string, number>>) {
    const chunked_addresses: string[][] = [];
    for (let i = 0; i < ownerAddresses.length; i += CHUNK_SIZE) {
        chunked_addresses.push(ownerAddresses.slice(i, i + CHUNK_SIZE));
    }
    const discordToNfts = new Map();
    for (let i = 0; i < chunked_addresses.length; i++) {
        await delay(1000);
        let addresses = chunked_addresses[i];
        addresses.forEach(async (address) => {
            let member = null;
            while (member == undefined) {
                try {
                    member = await SoonaverseApiManager.getMemberById(address);
                } catch (error) { console.log("Throttling error, retrying"); await delay(1000) };

            }
            if (member.discord) {
                discordToNfts.set(member.discord, addressToNfts.get(member.uid));
            }
        });
    }
    return discordToNfts;
}


function rolesToAllocate(membersNfts: Map<string, number>): Set<string> {
    const allocateRoles: Set<string> = new Set();

    membersNfts.forEach((count: number, nftType: string) => {
        if (count > 0) {
            let nftCountLowerBound = 0;
            Object.keys(ROLES[nftType]).forEach((key) => {
                const reqNftCount = parseInt(key);
                if (reqNftCount >= nftCountLowerBound && count >= reqNftCount) {
                    nftCountLowerBound = reqNftCount;
                }
            });
            if (nftCountLowerBound) {
                allocateRoles.add(ROLES[nftType][nftCountLowerBound.toString()]);
            }
        }
    });
    return allocateRoles;
}

async function syncBatchRoles(nftHolders: Map<string, Map<string, number>>) {
    console.log('Syncing Roles');
    // console.log(nftHolders);
    let guild = await DISCORD_CLIENT.guilds.fetch(GUILD_ID);
    await guild.members.fetch().then(async (members) => {
        for (const memberList of members) {
            const member = memberList[1];
            const memberRoles = member.roles.cache;

            if (nftHolders.has(member.user.tag)) {
                const membersNfts: Map<string, number> = nftHolders.get(member.user.tag)!;

                let totalNftCount = 0;
                membersNfts.forEach((val) => {
                    totalNftCount += val;
                });

                const allocateRoles: Set<string> = rolesToAllocate(membersNfts);

                // user info
                // console.log("--------------");
                // console.log(member.user.tag);
                // console.log(membersNfts);
                // console.log(nftCount);
                // console.log(roleId);
                // console.log("--------------");

                // remove them from other roles they are no longer a part of
                for (const roleList of memberRoles) {
                    const role = roleList[1];
                    if (ROLE_IDS.has(role.id) && !(allocateRoles.has(role.id))) {
                        await member.roles.remove(role.id);
                        console.log(member.user.tag + ' - removed role: ' + role.id);
                    }
                }
                // If member does not have the role, add them to it
                for (const roleId of allocateRoles) {
                    if (!memberRoles.has(roleId)) {
                        await member.roles.add(roleId, 'NFT-Holder');
                        console.log(member.user.tag + ' - added role: ' + roleId);
                    }
                }
            } else {
                // otherwise for each role in the table remove them from it
                for (const roleList of memberRoles) {
                    const role = roleList[1];
                    if (ROLE_IDS.has(role.id)) {
                        await member.roles.remove(role.id);
                        console.log(member.user.tag + ' - removed role: ' + role.id);
                    }
                }
            }
        }
    });
    console.log('Finished syncing roles');
}
