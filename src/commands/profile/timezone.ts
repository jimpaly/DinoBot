import { oneLine, stripIndent } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Profiles, Stats } from '../../database'
import { Discord, Time, Tools } from '../../tools'

module.exports = class RepCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'timezone',
            aliases: ['tz', 'time'],
            group: 'profile',
            memberName: 'timezone',
            description: 'Timezone',
            details: stripIndent`
                Set your timezone! Currently only used for the \`daily\` command
                ${oneLine`The best way to enter a timezone is with a name from the "TZ database name" column in 
                [this Wikipedia table](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).`}
                Alternatively, you may use numbers in hours (e.g. +3.5, -2:00, 7)`,
			examples: [
				"`{prefix}timezone` Show your current time",
				"`{prefix}timezone <member>` Show someone else's current time",
				"`{prefix}timezone <timezone>` Set your timezone",
			],
            args: [{
                key: 'memberOrTimezone',
                prompt: 'Which member do you want to see the timezone of?',
                type: 'string',
                default: '',
                validate: async (arg: string) => Time.getTimezone(arg) !== undefined
                                            || await Discord.findMember(arg) !== undefined,
                parse: async (arg: string) => Time.getTimezone(arg) || await Discord.findMember(arg),
                error: oneLine`Either I can't find that member, or that's an invalid timezone!
                    Try \`{prefix}help timezone\` to learn about what you can enter for the timezone.`,
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    
    async run(message: CommandoMessage, { memberOrTimezone }: { memberOrTimezone: Discord.User | string }) {
        let member = memberOrTimezone as Discord.User, timezone = ''
        if(typeof memberOrTimezone === 'string') {
            timezone = memberOrTimezone
            member = message.member ?? message.author
        }
        let profile = await Profiles.get(member.id)
        if(timezone) {
            profile.timezone = timezone
            profile.save()
        }
        return message.embed(await Discord.embed({
            title: `Timezone of {member.name}`,
            thumbnail: {url: '{member.avatar}'},
            fields: [{
                name: 'Timezone',
                value: `{member.timezone}`,
                inline: true
            }, {
                name: 'Current Time',
                value: `{member.timezone.time}`,
                inline: true
            }]
        }, { member, profile }))
    }

}