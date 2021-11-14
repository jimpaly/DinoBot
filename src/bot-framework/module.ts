import { Command } from "."
import { Listener } from "./listener"

interface ModuleCreator {
	directory: string
	name: string
	commands?: string[]
	listeners?: string[]
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
		readonly listeners: string[],
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

	async getListeners(): Promise<Listener[]> {
		const listeners: Listener[] = []
		for (const file of this.listeners) {
			listeners.push((await require(`../modules/${this.directory}/${file}.js`)) as Listener)
		}
		return listeners
	}

}

export function createModule({
	name, directory, commands = [], listeners = []
}: ModuleCreator): Module { return new Module(
	name, directory, commands, listeners
)}