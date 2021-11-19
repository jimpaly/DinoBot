import { createModule } from "../../bot-framework"

module.exports = createModule({
	name: 'Dev',
	commands: [
		'convert',
		'test',
		'admin',
	],
})