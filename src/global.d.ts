import { Guild } from "discord.js"
import { BotClient } from "./bot-framework"
import { Database } from './database'
import { RxLocalDocument } from 'rxdb'
import { Config } from "./config"

declare global {
	// var config: RxLocalDocument<Database, ConfigDoc>
	var config: Config
	var client: BotClient
	var guild: Guild
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
