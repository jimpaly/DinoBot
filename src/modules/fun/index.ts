import { createModule } from "../../bot-framework"

module.exports = createModule({
	directory: 'fun',
	name: 'Fun',
	commands: [
		'counting',
		'reactions',
	],
	listeners: [
		'count-listener',
		'reactor',
	]
})