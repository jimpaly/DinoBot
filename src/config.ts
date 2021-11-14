import { DeepReadonly } from 'rxdb/dist/types/types';

abstract class ConfigDoc {
	prefix: string
	color: string
	activity: {
		mode: string
		message: string
	}
	disabledChannels: string[]
	counting: string
}

export class Config extends ConfigDoc {

	constructor(doc: ConfigDoc) {
		super()
		for (const key in doc) 
			this[key as keyof ConfigDoc] = doc[key as keyof ConfigDoc] as any
	}

	async save() {
		await global.database.upsertLocal('config', this)
	}

}

export async function load() {
	return new Promise<void>(resolve => global.database.getLocal$('config').subscribe(async document => {
		global.config = new Config(copy<ConfigDoc>(document?.toJSON(), {
			prefix: ',',
			color: '#000000',
			activity: {
				mode: '',
				message: 'message',
			},
			disabledChannels: [],
			counting: '',
		}))
		resolve()
	}))
}

export function copy<T>(obj: DeepReadonly<T> | T | undefined, defaults: T): T {
	if(obj === undefined) return defaults
	if (typeof defaults !== 'object') {
		if (typeof obj === 'object') return defaults
		return obj as T
	} else if(Array.isArray(defaults)) {
		if(!Array.isArray(obj)) return defaults
		const newObj: any = []
		for(const element in obj)
			newObj[element] = copy(obj[element], defaults[element])
		// @ts-ignore
		return newObj as T
	} else {
		if (typeof obj !== 'object') return defaults
		const newObj: any = {}
		for(const property in defaults)
			newObj[property] = copy((obj as T)[property], defaults[property])
		return newObj as T
	}
}