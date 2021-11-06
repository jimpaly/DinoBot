import { Module } from "../../bot-framework"

export = new Module({
	directory: 'dev',
	commands: [
		'convert',
		'test',
	],
	category: 'dev',
})