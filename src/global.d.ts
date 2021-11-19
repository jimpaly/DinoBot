import { Guild, Client } from "discord.js"
import { Module } from './bot-framework'
import { Database } from './database'
import { RxLocalDocument } from 'rxdb'
import { Config } from "./config"

declare global {
	// var config: RxLocalDocument<Database, ConfigDoc>
	var config: Config
	var client: Client
	var guild: Guild
	var modules: Module[]
	var database: Database
	namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string
      OWNER: string
			GUILD: string
			DIRECTORY: string
			DATABASE: string
    }
  }
}
