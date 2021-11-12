import { Command } from "."

interface ModuleCreator {
	directory: string
	name: string
	commands: string[]
}

/**
 * class defining a bot module. modules can contain 
 * commands, chat monitors, buttons, and other discord interaction stuff
 */
export class Module {

	constructor(
		readonly name: string,
		readonly directory: string,
		readonly commands: string[],
	) { }

	/**
	 * loads all commands in this module
	 * @returns a list of commands
	 */
	async getCommands(): Promise<Command<any>[]> {
		const commands: Command<any>[] = []
		for (const file of this.commands) {
			commands.push((await require(`../modules/${this.directory}/${file}.js`)) as Command<any>)
		}
		return commands
	}

}

export function createModule({
	name, directory, commands,
}: ModuleCreator): Module { return new Module(
	name, directory, commands,
)}