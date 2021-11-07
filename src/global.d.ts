import { Guild } from "discord.js"
import { BotClient } from "./bot-framework"
import { Config } from "./config"

declare global {
	var config: Config
	var client: BotClient
	var guild: Guild
	namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string
      OWNER: string
			GUILD: string
    }
  }
}
