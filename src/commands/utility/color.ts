import { oneLine } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'
import { Config } from '../../database'
import { Discord, Draw } from '../../tools'

module.exports = class ColorSetCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'color',
            aliases: ['setcolor', 'botcolor', 'configcolor'],
            group: 'utility',
            memberName: 'color',
            description: 'Color',
            details: oneLine`
                Change the bot color! 
                This color will mainly be used in embeds (the colored bar at the left)
            `,
			examples: [
				'`{prefix}color` Show the current color',
				'`{prefix}color <hex>` Set a new color (e.g. #d2da87)',
			],
            userPermissions: ['ADMINISTRATOR'],
            args: [{
                key: 'color',
                prompt: 'What color do you want to set me to?',
                type: 'string',
                validate: (color: string) => Draw.parseHex(color) !== '',
                default: ''
            }]
        })
    }

    async run(message: CommandoMessage, { color }: { color: string }) {

        if(color) Config.setColor(color)
        return message.embed(await Discord.embed({
            title: 'Color is set to: {color}',
            image: { url: 'attachment://color.jpg' }
        }), {files: [{
            attachment: Draw.createColorImage(Config.getColor(), 600, 200),
            name: 'color.jpg'
        }]})
    }

}