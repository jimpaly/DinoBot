import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Discord } from '../../tools'

module.exports = class BackgroundCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'background',
            aliases: ['bg', 'bkg', 'wallpaper'],
            group: 'profile',
            memberName: 'background',
            description: 'Profile Background',
            details: `Set your profile card's background photo!`,
			examples: [
				"`{prefix}background` Show your current background",
				"`{prefix}background set <img url>` Set a new background photo at the url",
                "`{prefix}background set <image attachment>` Upload an image to use as your background photo",
				"`{prefix}profile blur <intensity>` Set how much blur you want to apply",
			],
            args: [{
                key: 'option',
                prompt: 'What do you want to do? (`set` or `blur`)',
                type: 'string',
                validate: (arg: string) => ['set', 'edit', 'update', 'blur'].includes(arg),
                parse: (arg: string) => {
                    if(['set', 'edit', 'update'].includes(arg)) return 'set'
                    else return 'blur'
                },
                default: '',
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    
    async run(message: CommandoMessage, { member }: { member: Discord.User }) {
        return message.say('never gonna give you up')
    }

}