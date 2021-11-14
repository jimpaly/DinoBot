import { createModule } from "../../bot-framework"

module.exports = createModule({
	directory: 'fun',
	name: 'Fun',
	commands: [
		'counting',
	],
	listeners: [
		'count-listener',
		'reactor',
	]
})