import { createMessageListener } from "../../bot-framework";
import { MemberStats } from "../../database";

module.exports = createMessageListener({
	async messageCreate(message) {
		if (message.guild?.id !== global.guild.id || !message.member) return
		
		await (await global.database.stats.getStats(message.member.id)).atomicUpdate(async stats => {
			const now = Date.now()

			// increment messages (and points)
			for (const timePeriod of MemberStats.timePeriods) stats.messages.amount[timePeriod]++
			const cooldown = now-new Date(stats.messages.lastReward).getTime()
			if(10*60000 - cooldown <= 0) { // TODO
				for (const timePeriod of MemberStats.timePeriods) stats.points[timePeriod]+= 5
				stats.messages.lastReward = new Date(now).toISOString()
			}
			
			const voiceCooldown = 5
			// update voice stats
			if (stats.voice.inVoice) {
				// stop incrementing if member isn't in voice channel anymore
				if(message.member?.voice.channel === null || message.member?.voice.deaf) {
					stats.voice.inVoice = false
				} else {	// increment if in voice channel
					const rewardTime = now - (now - new Date(stats.voice.lastReward).getTime())%voiceCooldown
					const rewardAmount = Math.floor((now - new Date(stats.voice.lastReward).getTime())/voiceCooldown/60000)
					stats.voice.lastUpdate = new Date(now).toISOString()
					stats.voice.lastReward = new Date(rewardTime).toISOString()
					for (const timePeriod of MemberStats.timePeriods) {
						stats.voice.duration[timePeriod]+= now - new Date(stats.voice.lastUpdate).getTime()
						stats.points[timePeriod]+= 5 * rewardAmount
					}
				}
			}

			// increment count
			if(message.channel.id === global.config.counting) {
				for (const timePeriod of MemberStats.timePeriods) {
					stats.counts[timePeriod]++
					stats.points[timePeriod]+= 10
				}
			}

			return stats
		})

		// increment bumps
		if(message.member?.id === '302050872383242240') {
			const bump = (message.embeds[0] ?? {}).description ?? ''
			if(bump !== undefined && bump.includes('Bump done')) {
				const memberId = bump.slice(2, 20)
				await (await global.database.stats.getStats(memberId)).atomicUpdate(stats => {
					for (const timePeriod of MemberStats.timePeriods) {
						stats.bumps[timePeriod]++
						stats.points[timePeriod]+= 100
					}
					return stats
				})
				// log(`<@!${memberId}> got {stats.bumps} points bumping the server!`, [memberId], [])
			}
		}

		// TODO
		// If it's their first message, create a profile
		// let profile = await Profiles.get(message.member.id)
		// if(profile.joins.length == 0) profile.addInviter() 
		// if(profile.joins.length == 1 && message.member.joinedAt) 
		// 	profile.joins[0].date = message.member.joinedAt

		// await database.stats.upsert(stats)
	},

	// decrement count when deleted
	async messageDelete(message) {
		if(message.guild?.id !== global.guild.id || !message.member) return
		if(message.channel.id !== global.config.counting) return
		await (await global.database.stats.getStats(message.member.id)).atomicUpdate(stats => {
			for (const timePeriod of MemberStats.timePeriods) {
				stats.counts[timePeriod]--
				stats.points[timePeriod]-= 10
			}
			return stats
		})
	}
})