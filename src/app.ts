import { Context, Callback, ScheduledEvent } from 'aws-lambda';
import { Client, Intents } from 'discord.js';
import { Soon } from 'soonaverse';
import { BOT_TOKEN, COLLECTION_IDS, GUILD_ID, ROLES } from './config';
import { RoleManager } from './roleManager';

const intents = new Intents();
intents.add('GUILDS');
intents.add('GUILD_MEMBERS');

const client = new Client({
    intents: intents,
});

const soon = new Soon();
const nftRoleManager = new RoleManager(COLLECTION_IDS, soon, client, ROLES, GUILD_ID);

async function update() {
    await nftRoleManager.updateCurrentHolders();
}

export const handler = (event: ScheduledEvent, context: Context, callback: Callback): void => {
    context.callbackWaitsForEmptyEventLoop = false;
    client.once('ready', () => {
        console.log(`Logged in as ${client.user!.tag}!`);
        update().then(() => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'All up to date, go get em',
                }),
            });
        });
    });

    client.on('warn', (warning) => {
        console.log(warning);
    });
    client.on('error', console.error);
    process.on('unhandledRejection', (error) => {
        console.log('Error:', error);
    });

    client.login(BOT_TOKEN);
};
