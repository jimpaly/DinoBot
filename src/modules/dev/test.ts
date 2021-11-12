import { createCommand } from "../../bot-framework";
import { stripIndent } from 'common-tags'
import { Channel, GuildMember, User } from "discord.js";

module.exports = createCommand<{
	strOption?: string,
	numOption?: number,
	userOption?: User,
	memberOption?: GuildMember,
	channelOption?: Channel,
}>({
	name: 'test',
	description: 'command for testing',
	permission: 'owner',
	type: 'both',
	args: {
		strOption: {
			description: 'String option',
			type: 'string',
			optional: true,
		},
		numOption: {
			description: 'Number option',
			type: 'number',
			optional: true,
		},
		userOption: {
			description: 'User option',
			type: 'user',
			optional: true,
		},
		memberOption: {
			description: 'Member option',
			type: 'member',
			optional: true,
		},
		channelOption: {
			description: 'Channel option',
			type: 'channel',
			optional: true,
		},
	},
	execute: ({strOption, numOption, userOption, memberOption, channelOption}) => stripIndent`
		hello world!
		str: ${strOption ?? 'none'}
		num*2: ${(numOption??0)*2}
		username: ${(userOption)?.username ?? 'none'}
		nickname: ${(memberOption)?.nickname ?? 'none'}
		channel: <#${(channelOption)?.id ?? 'none'}>
	`
})

.addSubcommand<{
	num1: number,
	num2: number,
}>({
	name: 'add',
	description: 'Add two numbers',
	args: {
		num1: {
			description: 'First number',
			type: 'number',
			optional: false,
		},
		num2: {
			description: 'Second number',
			type: 'number',
			optional: false,
		}
	},
	execute: ({num1, num2}) => `${num1+num2}`
})

.addSubcommand<{
	num1: number,
	num2: number,
}>({
	name: 'multiply',
	description: 'Multiply two numbers',
	args: {
		num1: {
			description: 'First number',
			type: 'number',
			optional: false,
		},
		num2: {
			description: 'Second number',
			type: 'number',
			optional: false,
		}
	},
	execute: ({num1, num2}) => `${num1*num2}`
})

.addSubcommand<{
	num: number,
}>({
	name: 'square',
	description: 'Square a number',
	args: {
		num: {
			description: 'The number to be squared',
			type: 'number',
			optional: false,
		}
	},
	execute: ({num}) => `${num*num}`
})