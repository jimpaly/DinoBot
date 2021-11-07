import { Command } from "../../bot-framework";

module.exports = new Command({
	name: 'admin',
	description: 'testing command permissions (this command is only usable by admins)',
	permission: 'admin',
	type: 'both',
	async execute() {
		return 'yay! you must be an admin!'
	}
})