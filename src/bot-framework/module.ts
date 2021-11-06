import { Command } from "."

export interface ModuleOptions {
	directory: string
	commands: string[]
	category: string
}

export class Module {

	directory: string
	commands: string[]
	category: string

	constructor(options: ModuleOptions) {
		this.directory = options.directory
		this.commands = options.commands
		this.category = options.category
	}

	async loadCommands(): Promise<Command[]> {
		const commands: Command[] = []
		for (const file of this.commands) {
			commands.push((await require(`../modules/${this.directory}/${file}.js`)) as Command)
		}
		return commands
	}

}