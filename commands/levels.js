const Tools = require('../tools')
const Data = require('../data');
const { isNumber } = require('../tools');

module.exports = {
	name: 'Leveling',
	description: 'Create a profile, gain points, raise your level, and have fun!',
	commands: [
		{
			name: 'Profile',
			alias: ['profile', 'p', 'pf', 'user', 'player'],
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
                message.channel.send('bloop')
			}
		}, {
			name: 'Leveling',
			alias: ['level', 'levels', 'leveling', 'lvl', 'points', 'point', 'pts', 'score', 'scores'],
			description: `Stay active to gain points and level up!
                        There are a bunch of ways to gain levels, including messaging, inviting, voice chatting, and more!
                        Visit {levels.channel} to learn more!`,
			usage: [
				['level', `Show your levels and points`],
				['level (member) <member>', `Show someone's levels`],
                ['level leaderboard|all', `Show top members in points`]
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
				if(args.length === 0) {
                    showLevel(message.channel, message.member)
                }
			}
		}, {
            name: 'Invites',
            alias: ['invites', 'invite'],
            description: `Show your invite stats!`,
            usage: [
                ['invites', `Show your stats`],
                ['invites (member) <@member>', `Show someone else's invite stats`],
                ['invites leaderboard|all', 'Show top members in number of people invited'],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {
                message.channel.send('blop')
            }
        }, {
            name: 'Leaderboard',
            alias: ['leaderboard', 'lb', 'rank', 'ranks', 'ranking'],
            description: `List everybody's levels`,
            usage: [
                ['leaderboard (level|points|score)', `Show top members in leveling`],
                ['leaderboard rep|reputation', 'Show top members in reputation points']
                ['leaderboard messages|texting', `Show top members in message count`],
                ['leaderboard voice|talking', 'Show top members in time in voice chats'],
                ['leaderboard invites', 'Show top members in people invited'],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {
                message.channel.send('bloop')
            }
        }, {
            name: 'Daily',
            alias: ['daily', 'reward', 'rewards'],
            description: `Earn daily rewards! (resets ever day at 0:00 GMT)`,
            usage: [
                ['daily', `Obtain your daily reward!`]
            ],
            public: true,
            developer: false,
            guildOnly: true,
            execute(message, args) {
                message.channel.send('blop')
            }
        }, {
            name: 'Leveling Configuration',
            alias: ['levelconfig', 'lvlconfig', 'levelsettings', 'lvlsettings'],
            description: `Set different leveling settings (cooldowns are in minutes)`,
            usage: [
                ['levelConfig show|list', `Show all leveling settings`],
                ['levelConfig channel (enable|disable) [#channel]|(all)', 'Set channels to gain points in'],
                ['levelConfig message [min points] [max points] [cooldown]', 'Set points gained from text messaging'],
                ['levelConfig voice [min points] [max points] [cooldown]', 'Set points gained every [cooldown] minutes in vc'],
                ['levelConfig bump [min points] [max points]', 'Set points gained by bumping with Disboard'],
                ['levelConfig counting [min points] [max points]', 'Set points gained for each counting in {counting}'],
                ['levelConfig invite [min points] [max points]', 'Set points gained for inviting someone']
            ],
            public: false,
            developer: false,
            guildOnly: true,
            execute(message, args) {
                if(['show', 'list', 'all', 'settings'].includes(args[0])) {
                    message.channel.send({embed: Data.replaceEmbed({
                        title: 'Leveling Settings',
                        description: `
                        **Messaging:** {level.messaging} every {level.messaging.cooldown} sending messages
                        **Voice:** {level.voice} every {level.voice.cooldown} in a voice chat with another human
                        **Bump:** {level.bump} for each Disboard bump through the command
                        **Counting:** {level.counting} for each correct count in {counting}
                        **Invite:** {level.invite} for each invite (points removed if invite leaves)`
                    })})
                } else if(['message', 'm', 'messaging', 'texting', 'text'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.messaging', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.messaging', { max: parseInt(args[2]) })
                    if(Tools.isNumber(args[3])) Data.set('level.messaging.cooldown', parseInt(args[3]))
                    message.channel.send(Data.replace('Messaging settings set to: {level.messaging}, {level.messaging.cooldown}'))
                } else if(['voice', 'vc', 'talk', 'speak', 'talking', 'speaking'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.voice', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.voice', { max: parseInt(args[2]) })
                    if(Tools.isNumber(args[3])) Data.set('level.voice.cooldown', parseInt(args[3]))
                    message.channel.send(Data.replace('Voice settings set to: {level.voice}, {level.voice.cooldown}'))
                } else if(['bump', 'bumping', 'disboard'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.bump', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.bump', { max: parseInt(args[2]) })
                    message.channel.send(Data.replace('Bump settings set to: {level.bump}'))
                } else if(['counting', 'count', 'cnt'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.counting', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.counting', { max: parseInt(args[2]) })
                    message.channel.send(Data.replace('Counting settings set to: {level.counting}'))
                } else if(['invite', 'inviting', 'inv'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.invite', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.invite', { max: parseInt(args[2]) })
                    message.channel.send(Data.replace('Invite settings set to: {level.invite}'))
                } else {
                    message.channel.send('blop')
                }
            }
        }, 
	],
    level(message) {

        //TODO: check bump

        if(message.author.bot) return;

        let stats = {}
        let id = message.member.id

        // Points
        if(message.createdTimestamp - Data.get(`member.${id}.messageCooldown`) > Data.get('level.messaging.cooldown')*60000) {
            Data.set(`member.${message.member.id}.points`, Tools.randomRange(Data.get('level.messaging')), false)
        }

        //Messages
        Data.set(`member.${message.member.id}.messages`, 1, false)

        Data.set(`member.${message.member.id}.messageCooldown`, message.createdTimestamp, false)

        Data.save('Leveling')
        // Data.set(`member.${message.member.id}.stats`, stats)
    }
};

/**
 * Show the level stats of a member
 * @param {Discord.TextChannel} channel The channel to send the stats to
 * @param {Discord.GuildMember} member The member to show stats of
 */
function showLevel(channel, member) {
    channel.send({embed: Data.replaceEmbed({
        title: `Levels of ${member.displayName}`,
        fields: [
            {
                name: 'Level',
                value: `{member.${member.id}.level}`,
                inline: true
            }, {
                name: 'Points',
                value: `{member.${member.id}.points}`,
                inline: true
            }, {
                name: 'Daily Points',
                value: `{member.${member.id}.points.daily}`,
                inline: true
            }, {
                name: 'Weekly Points',
                value: `{member.${member.id}.points.weekly}`,
                inline: true
            }, {
                name: 'Monthly Points',
                value: `{member.${member.id}.points.monthly}`,
                inline: true
            }, {
                name: 'Annual Points',
                value: `{member.${member.id}.points.annual}`,
                inline: true
            }
        ]
    })})
}

/*


    "profiles": {
        "template": {
            "bio": "",
            "background": ""
        }
    },
    "invites": {
        "template": {
            "joined": {
                "first": 0,
                "firstInvite": "",
                "last": 0,
                "lastInvite": ""
            },
            "invites": []
        }
    },

    "template": {
      "messageCooldown": 0,
      "voiceCooldown": 0,
      "allTime": {
        "points": 0,
        "rep": 0,
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0
      },
      "daily": {
        "points": 0,
        "rep": 0,
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0
      },
      "weekly": {
        "points": 0,
        "rep": 0,
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0
      },
      "monthly": {
        "points": 0,
        "rep": 0,
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0
      },
      "annual": {
        "points": 0,
        "rep": 0,
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0
      }
    },
*/