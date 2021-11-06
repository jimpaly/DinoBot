import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { oneLine } from 'common-tags'
import { Discord } from "../../tools";

module.exports = class PingCommand extends Command {

	constructor(client: CommandoClient) {
		super(client, {
			name: 'ping',
			group: 'utility',
			memberName: 'ping',
			description: 'Ping',
            details: 'Checks the bot\'s ping to Discord.',
			throttling: {
				usages: 5,
				duration: 10
			}
		});
	}

	async run(message: CommandoMessage) {	// Copied from Commando's ping command. It does what it does
		const pingMsg = await message.say('Pinging...');
		return pingMsg.edit('', {embed: await Discord.embed({
			title: 'Pong!',
			description: oneLine`
				The message round-trip took ${
					(pingMsg.editedTimestamp || pingMsg.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp)
				}ms. ${this.client.ws.ping ? `The heartbeat ping is ${Math.round(this.client.ws.ping)}ms.` : ''}
			`
		})});
	}
};
