import { Client } from 'discord.js';
import { Soon } from 'soonaverse';
const CHUNK_SIZE = 10;

export interface NftRoles {
    [reqNftCount: string]: string;
}

export interface Roles {
    [nftType: string]: NftRoles;
}

export class RoleManager {
    collectionIds: string[];
    soon: Soon;
    client: Client;
    roles: Roles;
    guildId: string;
    roleIds: Set<string>;

    constructor(collectionIds: string[], soon: Soon, client: Client, roles: Roles, guildId: string) {
        this.collectionIds = collectionIds;
        this.soon = soon;
        this.client = client;
        this.roles = roles;
        this.guildId = guildId;

        this.roleIds = new Set();
        Object.values(roles).forEach((nftRoles) => {
            Object.values(nftRoles).forEach((roleId) => {
                this.roleIds.add(roleId);
            });
        });
    }

    async updateCurrentHolders() {
        console.log('Getting Current Holders');
        await this.soon.getNftsByCollections(this.collectionIds).then(async (nfts) => {
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
                    const members = await this.soon.getMemberByIds(addresses);
                    members.forEach((member) => {
                        if (member.discord) {
                            discordToNfts.set(member.discord, addressToNfts.get(member.uid));
                        }
                    });
                }),
            );
            await this.syncBatchRoles(discordToNfts);
        });
    }

    rolesToAllocate(membersNfts: Map<string, number>): Set<string> {
        const allocateRoles: Set<string> = new Set();

        membersNfts.forEach((count: number, nftType: string) => {
            if (count > 0) {
                let nftCountLowerBound = 0;
                Object.keys(this.roles[nftType]).forEach((key) => {
                    const reqNftCount = parseInt(key);
                    if (reqNftCount >= nftCountLowerBound && count >= reqNftCount) {
                        nftCountLowerBound = reqNftCount;
                    }
                });
                if (nftCountLowerBound) {
                    allocateRoles.add(this.roles[nftType][nftCountLowerBound.toString()]);
                }
            }
        });
        return allocateRoles;
    }

    async syncBatchRoles(nftHolders: Map<string, Map<string, number>>) {
        console.log('Syncing Roles');
        await this.client.guilds.fetch(this.guildId).then(async (guild) => {
            await guild.members.fetch().then(async (members) => {
                await Promise.all(
                    members.map(async (member) => {
                        const memberRoles = member.roles.cache;

                        if (nftHolders.has(member.user.tag)) {
                            const membersNfts: Map<string, number> = nftHolders.get(member.user.tag)!;

                            let totalNftCount = 0;
                            membersNfts.forEach((val) => {
                                totalNftCount += val;
                            });

                            const allocateRoles: Set<string> = this.rolesToAllocate(membersNfts);

                            // user info
                            // console.log("--------------");
                            // console.log(member.user.tag);
                            // console.log(membersNfts);
                            // console.log(nftCount);
                            // console.log(roleId);
                            // console.log("--------------");

                            // remove them from other roles they are no longer a part of
                            memberRoles.forEach((role) => {
                                if (role.id in this.roleIds && !(role.id in allocateRoles)) {
                                    member.roles.remove(role.id).then((member) => {
                                        console.log(member.user.tag + ' - removed role: ' + role.id);
                                    });
                                }
                            });

                            // If member does not have the role, add them to it
                            for (const roleId of allocateRoles) {
                                if (!memberRoles.has(roleId)) {
                                    // console.log(member.user.tag + ' - added role: ' + roleId);
                                    member.roles.add(roleId, 'NFT-Holder').then((member) => {
                                        console.log(member.user.tag + ' - added role: ' + roleId);
                                    });
                                }
                            }
                        } else {
                            // otherwise for each role in the table remove them from it
                            memberRoles.forEach((role) => {
                                if (role.id in this.roleIds) {
                                    member.roles.remove(role.id).then((member) => {
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
}
