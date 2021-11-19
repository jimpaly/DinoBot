import { oneLine, stripIndents } from "common-tags";
import { createCommand } from "../../bot-framework";

module.exports = createCommand({
	name: 'ping',
	description: 'Checks the bot\'s ping to Discord.',
	type: 'both',
	args: {},
	async execute({}, reply) {
		const message1 = await reply('Pinging...');
		const message2 = await reply({embeds: [{
			title: 'Pong!',
		}]});
		await message2.edit({embeds: [{
			title: 'Pong!',
			description: stripIndents`
				The message round-trip took ${message2.createdTimestamp - message1.createdTimestamp}ms. 
				API latency is ${global.client.ws.ping}ms.`
		}]});
	}
});