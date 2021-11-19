import { createMessageListener } from "../../bot-framework";

module.exports = createMessageListener({
	messageCreate(message) {

	if (global.config.reactionDisabledMembers.includes(message.author.id)) return
	// if(!canReactIn(message.channel.id)) return

	if(message.author.id === message.client.user?.id) return

	function isOwO(str: string) {
		if(str.length != 3) return false;
		if(!/^[ou]/.test(str) || !/[ou]$/.test(str)) return false;
		if(['w', 'v', '-', '_', '^', '=', 'n'].includes(str.slice(1, -1))) return true;
		return false;
	}
	function rep(str: string, rp: string) {
		return str === rp.charAt(0) ? rp.charAt(1) : rp.charAt(0)
	}

	const m = (message.content.match(/[0-9a-zA-Z].*[0-9a-zA-Z]/) ?? [''])[0]

	if(/creeper$|creepers$/.test(m.toLowerCase())) {
		message.reply('Awww Maaan~~');
	} else if(/^o+$/.test(m.toLowerCase().slice(0, -1)) && m.toLowerCase().endsWith('oof')) {
		message.reply(`<:oo1:816586405178376193>${'<:oo2:816586405157273642>'.repeat(m.length-3)}<:oof:816586405409062933>`)
	} else if(/^m+$/.test(m.toLowerCase().slice(1)) && m.toLowerCase().startsWith('hmm')) {
		for(const c of m) if(!['h', 'm'].includes(c.toLowerCase())) return
		message.reply(`What are you thinking about, <@${message.author.id}>?\n${'🤔'.repeat(Math.pow(m.length, 0.8))}`)
	} else if(/^(o+|u+)$/.test(m.toLowerCase().slice(1)) && /^(noo|nuu)/.test(m.toLowerCase())) {
		message.reply(m.replace(/[uo]/g, x => rep(x, 'uo')).replace(/[UO]/g, x => rep(x, 'UO')))
	} else if(isOwO(m.toLowerCase().slice(-3))) {
		message.reply(m.slice(-3).replace(/[uo]/g, $1 => rep($1, 'uo')).replace(/[UO]/g, $1 => rep($1, 'UO')))
	} else if(/^[OU]/.test(m.slice(-3)) && /[OU]$/.test(m.slice(-3)) && ['o', 'u'].includes(m.charAt(m.length-2))) {
		message.reply(m.slice(-3).replace(/[UO]/g, $1 => rep($1, 'UO')))
	} else if(['meow', 'nyah'].includes(m.toLowerCase().slice(-4))) {
		message.reply(m.slice(-4)
			.replace(/[mn]/g, $1 => rep($1, 'mn')).replace(/[MN]/g, $1 => rep($1, 'MN'))
			.replace(/[ey]/g, $1 => rep($1, 'ey')).replace(/[EY]/g, $1 => rep($1, 'EY'))
			.replace(/[oa]/g, $1 => rep($1, 'oa')).replace(/[OA]/g, $1 => rep($1, 'OA'))
			.replace(/[wh]/g, $1 => rep($1, 'wh')).replace(/[WH]/g, $1 => rep($1, 'WH'))
		)
	}
	}
})