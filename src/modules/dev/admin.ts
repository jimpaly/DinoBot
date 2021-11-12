import { createCommand } from "../../bot-framework";

module.exports = createCommand<{}>({
	name: 'admin',
	description: 'testing command permissions (this command is only usable by admins)',
	permission: 'admin',
	type: 'both',
	args: {},
	async execute() {
		return 'yay! you must be an admin!'
	}
})