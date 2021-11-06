import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Discord, Tools } from '../../tools'

module.exports = class ProfileCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'profile',
            aliases: ['profiles', 'p', 'pf'],
            group: 'profile',
            memberName: 'profile',
            description: 'Profile Card',
            details: `Show or update your profile card and info!`,
			examples: [
				"`{prefix}profile` Display your own profile card",
				"`{prefix}profile <member>` Display someone's profile card",
				"`{prefix}profile set <component> <value>` Customize your profile card",
			],
            args: [{
                key: 'option',
                prompt: 'What do you want to do?',
                type: 'string',
                default: '',
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    
    async run(message: CommandoMessage, { member }: { member: Discord.User }) {
        return message.say('helo')
    }

}