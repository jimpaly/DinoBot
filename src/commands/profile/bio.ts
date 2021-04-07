import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Discord } from '../../tools'

module.exports = class BackgroundCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'bio',
            aliases: ['biography', 'about', 'profileset', 'setprofile'],
            group: 'profile',
            memberName: 'bio',
            description: 'Profile Bio',
            details: `Tell others a bit about yourself on your profile card!`,
			examples: [
				"`{prefix}bio` Show your current bio",
				"`{prefix}bio set <paragraph>` Set a new bio",
                "`{prefix}bio likes <list>...` Make a list of some stuff you enjoy",
				"`{prefix}bio dislikes <list>...` Make a list of stuff you don't quite like",
				"`{prefix}bio pronouns <pronouns>` Tell other what pronouns you'd like to be referred to as",
				"`{prefix}bio birthday <date>` Set your birthday (m/d/y, d/m/y, or just year works fine)",
				"`{prefix}bio status <status message> <emoji|image url|attachment>` Set a nice status!",
			],
            args: [{
                key: 'option',
                prompt: 'What do you want to do? (try `help bio` to see the options)',
                type: 'string',
                validate: (arg: string) => ['set', 'update', 'blur'].includes(arg),
                parse: (arg: string) => {
                    if(['set', 'update'].includes(arg)) return 'set'
                    else return 'blur'
                },
                default: '',
            }, {
                key: 'args',
                prompt: 'What would you like to set that to?',
                type: 'string',
                infinite: true,
                default: [],
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    
    async run(message: CommandoMessage, { member }: { member: Discord.User }) {
        return message.say('never gonna let you down')
    }

}