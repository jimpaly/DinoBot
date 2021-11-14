import { createModule } from "../../bot-framework";

module.exports = createModule({
	directory: 'utility',
	name: 'Utility',
	commands: [
		'prefix',
		'perm',
		'ping',
		'color',
	]
})