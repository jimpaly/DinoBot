import { RxCollection, RxDocument, RxJsonSchema, JsonSchema, RxCollectionCreator } from "rxdb"
import { isType } from "../tools"

export const categories = ['points', 'messages', 'voice', 'daily', 'reps', 'invites', 'bumps', 'counts'] as const
export type Category = typeof categories[number]
export function isCategory(str: string): str is Category { return isType(str, categories) }

export const timePeriods = ['alltime', 'daily', 'weekly', 'monthly', 'annual'] as const
export type TimePeriod = typeof timePeriods[number]
export function isTimePeriod(str: string): str is TimePeriod { return isType(str, timePeriods) }

type Stat = {[key in TimePeriod]: number}

type MemberStats = {
	id: string
	points: Stat
	messages: {
		amount: Stat
		lastReward: string
	}
	voice: {
		duration: Stat
		lastReward: string,
		lastUpdate: string,
		inVoice: boolean,
	}
	daily: {
		current: number
		total: Stat
		highest: Stat
		nextReward: string
	}
	reps: {
		received: Stat
		given: Stat
		stored: number
		lastGiven: string
		lastReceiver?: string
		lastGiver?: string
	}
	invites: {
		members: string[]
		joins: Stat
		leaves: Stat
		returns: Stat
	}
	bumps: Stat
	counts: Stat
}
type DocumentMethods = {
	getDailyCooldown: () => number
	getRepCooldown: () => number
}
type CollectionMethods = {
	getStats: (id: string) => Promise<Document>
	resetTimePeriods: () => Promise<void>
}

const statSchema: JsonSchema = {
	type: 'object',
	properties: {
		alltime: {
			type: 'number',
		},
		daily: {
			type: 'number'
		},
		weekly: {
			type: 'number'
		},
		monthly: {
			type: 'number'
		},
		annual: {
			type: 'number'
		},
	},
}
const defaultStat: Stat = {
	alltime: 0,
	daily: 0,
	weekly: 0,
	monthly: 0,
	annual: 0
}
const dateSchema = {
	type: 'string',
	format: 'date-time',
}
const defaultDate = new Date(0).toISOString()
const defaults: Omit<MemberStats, 'id'> = {
	points: defaultStat,
	messages: {
		amount: defaultStat,
		lastReward: defaultDate,
	},
	voice: {
		duration: defaultStat,
		lastReward: defaultDate,
		lastUpdate: defaultDate,
		inVoice: false
	},
	daily: {
		current: 0,
		total: defaultStat,
		highest: defaultStat,
		nextReward: defaultDate,
	},
	reps: {
		received: defaultStat,
		given: defaultStat,
		stored: 0,
		lastGiven: defaultDate,
	},
	invites: {
		members: [],
		joins: defaultStat,
		leaves: defaultStat,
		returns: defaultStat
	},
	bumps: defaultStat,
	counts: defaultStat
}
const schema: RxJsonSchema<MemberStats> = {
	title: 'Member Stats',
	description: 'activity statistics of individual members',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', },
		points: {
			...statSchema,
			default: defaults.points,
		},
		messages: {
			type: 'object',
			properties: {
				amount: statSchema,
				lastReward: dateSchema,
			},
			default: defaults.messages
		},
		voice: {
			type: 'object',
			properties: {
				duration: statSchema,
				lastReward: dateSchema,
				lastUpdate: dateSchema,
				inVoice: { type: 'boolean' }
			},
			default: defaults.voice
		},
		daily: {
			type: 'object',
			properties: {
				current: { type: 'number' },
				total: statSchema,
				highest: statSchema,
				nextReward: dateSchema,
			},
			default: defaults.daily
		},
		reps: {
			type: 'object',
			properties: {
				received: statSchema,
				given: statSchema,
				stored: { type: 'number' },
				lastGiven: dateSchema,
				lastReceiver: { type: 'string' },
				lastGiver: { type: 'string' },
			},
			default: defaults.reps
		},
		invites: {
			type: 'object',
			properties: {
				members: {
					type: 'array',
					items: { type: 'string' }
				},
				joins: statSchema,
				leaves: statSchema,
				returns: statSchema,
			},
			default: defaults.invites,
		},
		bumps: {
			...statSchema,
			default: defaults.bumps,
		},
		counts: {
			...statSchema,
			default: defaults.counts,
		},
	},
	required: ['id']
}
const methods: DocumentMethods = {

	getDailyCooldown(this: Document) {
		return Math.max(0, new Date(this.daily.nextReward).getTime() - Date.now())
	},
	getRepCooldown(this: Document) {
		// for now set on 10 minutes
    return Math.max(0, 10*60000 - (Date.now()-new Date(this.reps.lastGiven).getTime()))
	}
}
const statics: CollectionMethods = {
	async getStats(this: Collection, id: string) {
		return await this.findOne(id).exec() ?? this.newDocument({id})
	},
	resetTimePeriods() {
		throw new Error("Function not implemented.")
	}
}

export type Document = RxDocument<MemberStats, DocumentMethods>
export type Collection = RxCollection<MemberStats, DocumentMethods, CollectionMethods>
export const collection: RxCollectionCreator = { schema, methods, statics }