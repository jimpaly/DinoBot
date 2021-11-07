import { Arg, Args, Command } from "../../bot-framework";
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
	subCommands: [{
		name: 'add',
		description: 'Add two numbers',
		args: [{
			name: 'num1',
			description: 'First number',
			type: 'number'
		},{
			name: 'num2',
			description: 'Second number',
			type: 'number'
		}]
	}, {
		name: 'multiply',
		description: 'Multiply two numbers',
		args: [{
			name: 'num1',
			description: 'First number',
			type: 'number'
		},{
			name: 'num2',
			description: 'Second number',
			type: 'number'
		}]
	}, {
		name: 'square',
		description: 'Square a number',
		args: [{
			name: 'num',
			description: 'The number to be squared',
			type: 'number'
		}]
	}],
	async execute(args: Args) {
		const subCommand = args.getSubCommand()
		if (subCommand === 'add') {
			return `${(args.getNumber('num1')??0) + (args.getNumber('num2')??0)}`
		} else if (subCommand === 'multiply') {
			return `${(args.getNumber('num1')??0) * (args.getNumber('num2')??0)}`
		} else if (subCommand === 'square') {
			return `${(args.getNumber('num')??0)**2}`
		} else {
			return stripIndent`
				hello world!
				str: ${args.getString('strOption') ?? 'none'}
				num*2: ${(args.getNumber('numOption')??0)*2}
				username: ${(await args.getUser('userOption'))?.username ?? 'none'}
				nickname: ${(await args.getMember('memberOption'))?.nickname ?? 'none'}
				channel: <#${(await args.getChannel('channelOption'))?.id ?? 'none'}>
			`
		}
	}
})