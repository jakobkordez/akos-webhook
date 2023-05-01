import * as dotenv from 'dotenv';
dotenv.config();

import { WebhookClient, EmbedBuilder } from 'discord.js';
import { CronJob } from 'cron';
import axios from 'axios';

const akosURL = 'https://www.akos-rs.si/?type=1452982642&o=Radioamaterji&no_cache=1&klicni_znak=&razred=&e=json&order[0][column]=0&order[0][dir]=asc&columns[0][data]=RA_KlicniZnak';

const webhookId = process.env.WEBHOOK_ID;
const webhookToken = process.env.WEBHOOK_TOKEN;

const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

const genSingleCalls = () => {
    const calls = new Set();

    for (let n = 0; n < 10; n++) {
        for (let l = 0; l < 26; l++) {
            calls.add(`S5${n}${String.fromCharCode(65 + l)}`);
        }
    }

    if (calls.size != 260) throw new Error('Invalid number of calls generated!');

    return calls;
}

const checkData = async () => {
    console.info(`[${new Date().toISOString()}] Checking data...`);

    try {
        const { data } = await axios.get(akosURL);

        const calls = genSingleCalls();

        for (const entry of data) {
            calls.delete(entry['Klicni znak']);
        }

        if (calls.size > 0) {
            const embed = new EmbedBuilder()
                .setTitle('Na voljo so enočrkovni klicni znaki:')
                .setColor('#3a8bda')
                .setDescription(Array.from(calls).map((v) => `- ${v}`).join('\n'));

            await webhookClient.send({
                username: 'Register Radioamaterjev',
                embeds: [embed]
            });
        }
    } catch (error) {
        console.error(error);
        return;
    }
};

const startNow = process.argv.includes('--now', 2);

const job = new CronJob('0 0 12 * * *', () => checkData(), null, true, 'Europe/Ljubljana', null, startNow);
