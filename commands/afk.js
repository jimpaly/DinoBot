const Tools = require('../tools.js');
afk = require('../data/afk.json');

module.exports = {
  name: 'AFK',
  description: 'Change your afk status!',
	detail: `
With this command, you'll be able to tell others that you're afk!
After you've set yourself as afk, people will be able to check that status. Also, I will automatically remove you from your afk status once you start chatting again!
	`,
  alias: ['afk', 'away'],
  usage: [
		['afk (set|start) [reason]', 'I\'ll set your status as AFK!'],
		['afk show [member]', 'Show the afk status of a member! Or, if you leave the member blank, I\'ll list all people that are away.'],
		['afk list', 'I\'ll give you a list of the afk statuses of all users that are afk.']
	],
  public: true,
  developer: false,
  guildOnly: false,
  execute(message, args) {
		if(args[0] === 'show') {
			if(args.length < 2) {
				listStatus(message.channel);
			} else if(Tools.exists(message.mentions.members.first())) {
				sendStatus(message.channel, '', message.mentions.members.first());
			} else {
				message.guild.members.fetch({ query: args[1], limit: 100 }).then(members => {
					if(members.size < 1) { Tools.fault(message.channel, 'I can\'t seem to find that member! Are you sure they\'re in the server?'); return; }
					for(let member of members.values()) {
						if(Tools.exists(afk[member.user.id])) {
							sendStatus(message.channel, '', message.guild.member(member.user));
							return;
						}
					}
					Tools.fault(message.channel, 'I don\'t think that user is AFK!');
				});
			}
		} else if(['list', 'ls', 'l', 'lst'].includes(args[0])) {
			listStatus(message.channel);
		} else if(['set', 'start'].includes(args[0])) {
			setAFK(message.channel, message.member, args.slice(1).join(' '));
		} else if(args.length < 1) {
			setAFK(message.channel, message.member, 'Mysterious... I wonder what they\'re doing....? 🤔')
		} else {
			setAFK(message.channel, message.member, args.join(' '));
		}
  },
	remove(channel, member) {
		if(!Tools.exists(afk[member.id])) return;
		rand = Tools.random(1, 10);
		if(rand == 1)	channel.send(`Welcome back, <@${member.id}>!!!`);
		else if(rand == 2)	channel.send(`Welcome back home, <@${member.id}>!!!`);
		else if(rand == 3)	channel.send(`Yay! <@${member.id}> is back!!!`);
		else if(rand == 4)	channel.send(`Ooo! <@${member.id}>, welcome back!!!`);
		else if(rand == 5)	channel.send(`Hello again, <@${member.id}>!!!`);
		else if(rand == 6)	channel.send(`Aannnd... They're back! Hello, <@${member.id}>!!!`);
		else if(rand == 7)	channel.send(`Nice to see you again, <@${member.id}>!!!`);
		else if(rand == 8)	channel.send(`Heya, <@${member.id}>; welcome back!!!`);
		else if(rand == 9)	channel.send(`<@${member.id}> is back from afk!!!`);
		else if(rand == 10)	channel.send(`And back from afk is... <@${member.id}>!!!`);
		delete afk[member.id];
		Tools.saveJSON(afk, './commands/afk.json');
	},
	removeSilent(member) {
		if(!Tools.exists(afk[member.id])) return;
		delete afk[member.id];
		Tools.saveJSON(afk, './commands/afk.json');
	}
};

function setAFK(channel, member, reason) {
	afk[member.id] = { reason: reason, timestamp: Date.now() };
	Tools.saveJSON(afk, './commands/afk.json');
	sendStatus(channel, `⬇️ I just set your status, <@${member.id}>`, member);
}
function sendStatus(channel, message, member) {
	channel.send(message, { embed: {
		title: `AFK Status of ${member.displayName}`,
		description: afk[member.id].reason,
		footer: { text: 'Last seen' },
		timestamp: afk[member.id].timestamp
	}});
}
function listStatus(channel) {
	embed = {
		title: 'All AFK Users',
		description: ''
	};
	for(let member in afk) embed.description += '<@'+member+'>\n> '+afk[member].reason+'\n\n';
	if(embed.description === '') embed.description = 'Looks like nobody\'s AFK!'
	channel.send({ embed: embed })
}
