import * as fs from 'fs'



export interface Config {
	prefix: string
	status: {
			mode: string
			message: string
	}
}

export async function load() {
	global.config = await readJSON('config.json') as Config
}

/** Reads in an object from a JSON file, relative to `configuration/` */
export function readJSON(file: string) {
	return new Promise<any>((resolve, reject) => {
		fs.readFile(`./configuration/${file}`, 'utf8', (err, str) => {
			if (err) return reject(err)
			try { resolve(JSON.parse(str)) }
			catch(err) { reject(err) }
		})
	}).catch(err => console.error(`fault reading file ${file}:`, err))
}
/** saves an object to a JSON file, relative to `configuration/` */
export function saveJSON(object: object, file: string) {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(`./configuration/${file}`, JSON.stringify(object, null, 4), (err) => {
			if(err) reject(err)
			else resolve()
		})
	}).catch(err => console.error(`fault writing file ${file}:`, err))
}