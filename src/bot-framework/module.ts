import { Command } from "."

export interface ModuleOptions {
	directory: string
	commands: string[]
	category: string
}

/**
 * class defining a bot module. modules can contain 
 * commands, chat monitors, buttons, and other discord interaction stuff
 */
export class Module {

	directory: string
	commands: string[]
	category: string

	constructor(options: ModuleOptions) {
		this.directory = options.directory
		this.commands = options.commands
		this.category = options.category
	}

	/**
	 * loads all commands in this module
	 * @returns a list of commands
	 */
	async loadCommands(): Promise<Command[]> {
		const commands: Command[] = []
		for (const file of this.commands) {
			commands.push((await require(`../modules/${this.directory}/${file}.js`)) as Command)
		}
		return commands
	}

}