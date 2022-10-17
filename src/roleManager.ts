import { DISCORD_CLIENT } from './main';
import { Soon } from './soonaverse';
import { COLLECTION_IDS, GUILD_ID, ROLES } from './config';
const CHUNK_SIZE = 10;

const SOONAVERSE_CLIENT = new Soon();

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
    await SOONAVERSE_CLIENT.getNftsByCollections(COLLECTION_IDS).then(async (nfts) => {
        const addressToNfts = new Map<string, Map<string, number>>();
        const ownerAddresses: string[] = [];
        nfts.forEach((nftObj) => {
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

        const chunked_addresses: string[][] = [];
        for (let i = 0; i < ownerAddresses.length; i += CHUNK_SIZE) {
            chunked_addresses.push(ownerAddresses.slice(i, i + CHUNK_SIZE));
        }
        const discordToNfts = new Map();
        await Promise.all(
            chunked_addresses.map(async (addresses) => {
                const members = await SOONAVERSE_CLIENT.getMemberByIds(addresses);
                members.forEach((member) => {
                    if (member.discord) {
                        discordToNfts.set(member.discord, addressToNfts.get(member.uid));
                    }
                });
            }),
        );
        await syncBatchRoles(discordToNfts);
    });
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
    await DISCORD_CLIENT.guilds.fetch(GUILD_ID).then(async (guild: { members: { fetch: () => Promise<any> } }) => {
        await guild.members.fetch().then(async (members) => {
            await Promise.all(
                members.map(async (member: any) => {
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
                        memberRoles.forEach(async (role: { id: string }) => {
                            if (role.id in ROLE_IDS && !(role.id in allocateRoles)) {
                                await member.roles.remove(role.id).then((member: { user: { tag: string } }) => {
                                    console.log(member.user.tag + ' - removed role: ' + role.id);
                                });
                            }
                        });

                        // If member does not have the role, add
                        // them to it
                        for (const roleId of allocateRoles) {
                            if (!memberRoles.has(roleId)) {
                                await member.roles
                                    .add(roleId, 'NFT-Holder')
                                    .then((member: { user: { tag: string } }) => {
                                        console.log(member.user.tag + ' - added role: ' + roleId);
                                    });
                            }
                        }
                    } else {
                        // otherwise for each role in the table remove them from it
                        memberRoles.forEach(async (role: { id: string }) => {
                            if (role.id in ROLE_IDS) {
                                await member.roles.remove(role.id).then((member: { user: { tag: string } }) => {
                                    console.log(member.user.tag + ' - removed role: ' + role.id);
                                });
                            }
                        });
                    }
                }),
            );
        });
    });
    console.log('Finished syncing roles');
}
