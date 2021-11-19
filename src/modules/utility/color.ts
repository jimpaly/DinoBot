import { oneLine } from "common-tags"
import { createCommand } from "../../bot-framework"

module.exports = createCommand<{
	color?: string
}>({
	name: 'color',
	description: 'update the bot color',
	details: oneLine`
		Change the bot color! 
		This color will mainly be used in embeds (the colored bar at the left)
	`,
	aliases: ['setcolor', 'botcolor', 'configcolor'],
	permission: 'admin',
	type: 'both',
	args: {
		color: {
			description: 'The embed color',
			type: 'string',
			optional: true,
		}
	},
	async execute({color}) {
		// Set the color to the color config file
		if(color) {
			global.config.color = color
			await global.config.save()
			return {
				embeds: [{
					title: `Color now set to: ${global.config.color}`,
					image: { url: 'attachment://color.jpg' }
				}],
				// files: [{
				// 	attachment: Draw.createColorImage(Config.getColor(), 600, 200),
				// 	name: 'color.jpg'
				// }]
			}
		}
		// Send the new color image
		return {
			embeds: [{
				title: `Embed color: ${global.config.color}`,
				image: { url: 'attachment://color.jpg' }
			}],
		}
	}
})