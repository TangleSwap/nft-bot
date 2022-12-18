import { Client, Intents } from 'discord.js';
import { BOT_TOKEN } from './config';
import { updateCurrentHolders } from './roleManager';

const INTERVAL = 1000 * 60 * 60;

const intents = new Intents();
intents.add('GUILDS');
intents.add('GUILD_MEMBERS');

export const DISCORD_CLIENT = new Client({
    intents: intents,
});

async function update() {
    console.log('-----------------------------------------------------');
    var now = new Date();
    console.log(now.toUTCString());
    try {
        await updateCurrentHolders();
    } catch (error) {
        console.error(error);
        // lets not throw an error and just let the bot try again next
        // time
        // throw error;
    }
    setTimeout(update, INTERVAL);
}

DISCORD_CLIENT.once('ready', () => {
    console.log(`Logged in as ${DISCORD_CLIENT.user!.tag}!`);
    update();
});

DISCORD_CLIENT.login(BOT_TOKEN);
