import { Args, Command } from "../../bot-framework"
import { oneLine } from 'common-tags'


module.exports = new Command({
	name: 'prefix',
	description: 'change the bot prefix',
	details: oneLine`
		Use this command to change the prefix you use to summon me! 
		Of course, you can always @ me if you forgot my prefix 😉
	`,
	type: 'both',
	args: [{
		name: 'prefix',
		description: 'the bot prefix',
		type: 'string',
		optional: true,
	}],
	async execute(args: Args, { member, permissions }) {
		const newPrefix = args.getString('prefix')
		if (!newPrefix) return `Prefix: ${global.config.prefix}`

		if (!permissions?.has('ADMINISTRATOR')) 
			return `You need to have admin permission to set the bot prefix!`

		global.config.prefix = newPrefix
		await global.database.upsertLocal('config', global.config)
		return `Prefix set to: ${global.config.prefix}`
	}
})