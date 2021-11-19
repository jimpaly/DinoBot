import { createModule } from "../../bot-framework";

module.exports = createModule({
	name: 'Utility',
	commands: [
		'help',
		'prefix',
		'perm',
		'ping',
		'color',
	]
})