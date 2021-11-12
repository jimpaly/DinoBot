import { createModule } from "../../bot-framework"

module.exports = createModule({
	directory: 'dev',
	name: 'Dev',
	commands: [
		'convert',
		'test',
		'admin',
	],
})