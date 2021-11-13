import { oneLine } from "common-tags";
import { createCommand } from "../../bot-framework";

module.exports = createCommand({
	name: 'ping',
	description: 'Ping',
	details: 'Checks the bot\'s ping to Discord.',
	type: 'both',
	args: {},
	async execute({}, reply) {
		const start = Date.now()
		await reply('Pinging...');
		const end = Date.now()
		return reply({embeds: [{
			title: 'Pong!',
			description: `The took ${end - start}ms.`
		}]});
	}
});