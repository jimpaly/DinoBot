const Tools = require('../tools')
const Data = require('../data');

module.exports = {
	name: 'Profiles',
	description: 'Create a profile to introduce yourself!',
	commands: [
		{
			name: 'Profile',
			alias: ['profile', 'p', 'pf'],
			description: `Show your profile card and update your info!`,
			usage: [
				['profile', `Display your own profile card`],
				['profile (member) <member>', `Show someone's profile card`],
                ['profile set <component> <value>', 'Customize your profile card (refer to below command for more)'],
                ['profile components|set', 'Get to know the components more!']
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
                message.channel.send('Coming soon...')
			}
		}, {
			name: 'Timezone',
			alias: ['timezone', 'tz', 'time'],
			description: `Set your timezone! Currently only used for the \`daily\` command
                        The best way to enter a timezone is with a name from the "TZ database name" column in [this Wikipedia table](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
                        Alternatively, you may use numbers in hours (e.g. +3.5, -2:00, 7)`,
			usage: [
				['timezone', `Show your current time`],
				['timezone <member>', `Show your current time`],
				['timezone set <timezone>', `Set your timezone`]
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
                if(['set', 'update', 'edit'].includes(args[0])) {
                    let timezone = Tools.getTimezone(args[1])
                    if(timezone === undefined) return Tools.fault(message.channel, `${args[1]} isn't a valid timezone! Try \`{prefix}help timezone\` to learn about what you can enter.`)
                    Data.set(`member.${message.author.id}.timezone`, timezone)
                    showTime(Tools.getAuthor(message))
                } else if(args.length == 0) {
                    showTime(Tools.getAuthor(message))
                } else Tools.findMember(message, args[0]).then((member) => {
                    if(member === undefined) Tools.fault(message.channel, `I couldn't find a person named ${args[0]}!`)
                    else showTime(member)
                })
                function showTime(member) {
                    message.channel.send({embed: Data.replaceEmbed({
                        title: `Timezone of ${Tools.getName(member)}`,
                        thumbnail: {url: Tools.getAvatar(member)},
                        fields: [{
                            name: 'Timezone',
                            value: `{member.${member.id}.timezone}`,
                            inline: true
                        }, {
                            name: 'Current Time',
                            value: `{member.${member.id}.timezone.time}`,
                            inline: true
                        }]
                    })})
                }
			}
		}
    ],
    addMember(member, inviter) {

        // Invite stat in leveling
        for(const otherInviter of Data.get('level.members')) {
            if(otherInviter === inviter) continue
            if(Data.get(`member.${otherInviter}.invite.left`).includes(member.id)) {
                Data.set(`member.${otherInviter}.invite.left.remove`, member.id, false)
                Data.set(`member.${otherInviter}.invite.returned.add`, member.id, false)
            }
        }
        if(Data.get(`member.${inviter}.invite.left`).includes(member.id)) {
            Data.set(`member.${inviter}.invite.left.remove`, member.id, false)
            Data.set(`member.${inviter}.invite.returned.add`, member.id, false)
        } else {
            Data.set(`member.${inviter}.invite.joined.add`, member.id, false)
        }
        Data.set(`member.${inviter}.points.add`, Data.get(`level.invite`), false)
        Data.save('Leveling')

        Data.set(`member.${member.id}.join`, inviter, false)
		Data.set(`level.log`, `<@!${inviter}> got ${Data.get(`level.invite`)} points for inviting <@!${member.id}>!`)
    },
    removeMember(member) {

        for(const inviter of Data.get('level.members')) {
            if(Data.get(`member.${inviter}.invite.returned`).includes(member.id)) {
                Data.set(`member.${inviter}.invite.returned.remove`, member.id, false)
                Data.set(`member.${inviter}.invite.left.add`, member.id, false)
            } else if(Data.get(`member.${inviter}.invite.joined`).includes(member.id)) {
                Data.set(`member.${inviter}.invite.left.add`, member.id, false)
            }
        } Data.save('Leveling')
    }
};


/*

"template": {
    "bio": "",
    "background": "",
    "timezone": "+0",
    "joined": {
        "first": 0,
        "firstInvite": "",
        "last": 0,
        "lastInvite": ""
    }
}
*/