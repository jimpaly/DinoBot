import { ArgOption, Args, Command } from "../../bot-framework";
import { stripIndent } from 'common-tags'

module.exports = new Command({
	name: 'test',
	description: 'command for testing',
	permission: 'owner',
	type: 'both',
	args: [{
		name: 'strOption',
		description: 'String option',
		type: 'string',
		optional: true,
	},{
		name: 'numOption',
		description: 'Number option',
		type: 'number',
		optional: true,
	},{
		name: 'userOption',
		description: 'User option',
		type: 'user',
		optional: true,
	},{
		name: 'memberOption',
		description: 'Member option',
		type: 'member',
		optional: true,
	},{
		name: 'channelOption',
		description: 'Channel option',
		type: 'channel',
		optional: true,
	}],
	async execute(args: Args) {
		return stripIndent`
			hello world!
			str: ${args.getString('strOption')}
			num*2: ${(args.getNumber('numOption')??0)*2}
			username: ${args.getUser('userOption')?.username}
			nickname: ${args.getMember('memberOption')?.nickname}
			channel: ${args.getChannel('channelOption')?.id}
		`
	}
})