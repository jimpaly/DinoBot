const Tools = require('../tools');
const Data = require('../bot')

module.exports = {
	name: 'Text',
	description: 'Configure bot reactions',
	detail: `Sometimes I will react to messages you send! You can use this command to enable or disable that!`,
	alias: ['text', 'reaction', 'reactions'],
	usage: [
		['text (show)', 'I\'ll tell you if I react to your messages!'],
		['text enable|disable', 'I\'ll start or stop reacting to your messages!']
	],
	public: true,
	developer: false,
	guildOnly: false,
	execute(message, args) {
		if(args.length < 1 || ['show', 'display'].includes(args[0])) {
			sendStatus(message.channel, '', message.member);
		} else if(['enable', 'on', 'true', 'yes'].includes(args[0])) {
			setText(message.channel, message.member, true);
		} else if(['disable', 'off', 'false', 'no'].includes(args[0])) {
			setText(message.channel, message.member, false);
		}
	},
	react(message) {

		if(Data.getData(`text.${message.member.id}`)) return

		m = trimPunc(message.content);

		if(/creeper$|creepers$/.test(m.toLowerCase())) {
			message.channel.send('Awww Maaan~~');
		} else if(/^o+$/.test(m.toLowerCase().slice(0, -1)) && m.toLowerCase().endsWith('oof')) {
			message.channel.send(`<:oo1:816586405178376193>${'<:oo2:816586405157273642>'.repeat(m.length-3)}<:oof:816586405409062933>`)
		} else if(/^m+$/.test(m.toLowerCase().slice(1)) && m.toLowerCase().startsWith('hmm')) {
			for(const c of m) if(!['h', 'm'].includes(c.toLowerCase())) return
			message.channel.send(`What are you thinking about, <@${message.author.id}>?\n${'🤔'.repeat(Math.pow(m.length, 0.8))}`)
		} else if(/^(o+|u+)$/.test(m.toLowerCase().slice(1)) && /^(noo|nuu)/.test(m.toLowerCase())) {
			message.channel.send(m.replace(/[uo]/g, $1 => rep($1, 'uo')).replace(/[UO]/g, $1 => rep($1, 'UO')))
		} else if(isOwO(m.toLowerCase().slice(-3))) {
			message.channel.send(m.slice(-3).replace(/[uo]/g, $1 => rep($1, 'uo')).replace(/[UO]/g, $1 => rep($1, 'UO')))
		} else if(/^[OU]/.test(m.slice(-3)) && /[OU]$/.test(m.slice(-3)) && ['o', 'u'].includes(m.charAt(m.length-2))) {
			message.channel.send(m.slice(-3).replace(/[UO]/g, $1 => rep($1, 'UO')))
		} else if(['meow', 'nyah'].includes(m.toLowerCase().slice(-4))) {
			message.channel.send(m.slice(-4)
				.replace(/[mn]/g, $1 => rep($1, 'mn')).replace(/[MN]/g, $1 => rep($1, 'MN'))
				.replace(/[ey]/g, $1 => rep($1, 'ey')).replace(/[EY]/g, $1 => rep($1, 'EY'))
				.replace(/[oa]/g, $1 => rep($1, 'oa')).replace(/[OA]/g, $1 => rep($1, 'OA'))
				.replace(/[wh]/g, $1 => rep($1, 'wh')).replace(/[WH]/g, $1 => rep($1, 'WH'))
			)
		}
	}
};

function setText(channel, member, enabled) {
	Data.setData(`text.${enabled ? 'enable' : 'disable'}`, member.id)
	sendStatus(channel, `⬇️ I just updated your preferences!, <@${member.id}>`, member);
}

function sendStatus(channel, message, member) {
	channel.send(message, { embed: Data.replace({
		title: `Reaction/Text Preference of ${member.displayName}`,
		description: `Reactions are {text.${member.id}} for you!`
	})});
}



function isOwO(str) {
	if(str.length != 3) return false;
	if(!/^[ou]/.test(str) || !/[ou]$/.test(str)) return false;
	if(['w', 'v', '-', '_', '^', '=', 'n'].includes(str.slice(1, -1))) return true;
	return false;
}

function trimPunc(str) {
	si = 0; ei = 0;
	for(i = 0; i < str.length; i++) {
		if(!['.', ',', '?', '!', ';', '-', '~', ':', '/', '`'].includes(str.charAt(i))) {
			si = i; break;
		}
	}
	for(i = str.length-1; i >= 0; i--) {
		if(!['.', ',', '?', '!', ';', '-', '~', ':', '/', '`'].includes(str.charAt(i))) {
			ei = i+1; break;
		}
	}
	return str.slice(si, ei);
}

function isOnly(str, char) {
	return new RegExp("^[\s" + char + "]+$").test(str)
}

function rep(str, rp) {
	return str === rp.charAt(0) ? rp.charAt(1) : rp.charAt(0)
}
