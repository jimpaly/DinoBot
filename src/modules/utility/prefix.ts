// import { oneLine } from 'common-tags'
// import { Command } from '../../tools/command'
// import { Config } from '../../database'
// import { Discord } from '../../tools'

// export const command: Partial<Command> = {
// 	name: 'prefix',
// 	description: 'set the bot prefix',
// 	permission: 'admin',
// 	async execute() {
// 		async run(message: CommandoMessage, { prefix }: { prefix: string }) {
//         // If a new prefix is mentioned, set the new prefix
//         if(prefix && message.member?.hasPermission('ADMINISTRATOR')) {  
//             Config.setPrefix(prefix)
//             return message.embed(await Discord.embed({ description: 'Changed the prefix to `{prefix}`' }))
//         } else {    // If no new prefix is mentioned, just show the current prefix
//             return message.embed(await Discord.embed({ description: 'Current prefix: `{prefix}`' }))
//         }
//     }
// 	}
//     // constructor(client: CommandoClient) {
//     //     super(client, {
//     //         name: 'prefix',
//     //         aliases: ['setprefix', 'botprefix', 'configprefix'],
//     //         group: 'utility',
//     //         memberName: 'prefix',
//     //         description: 'Prefix',
//     //         details: oneLine`
//     //             Use this command to change the prefix you use to summon me! 
//     //             Of course, you can always @ me if you forgot my prefix 😉
//     //         `,
// 		// 	examples: [
// 		// 		'`{prefix}prefix` Show my current prefix',
// 		// 		'`{prefix}prefix <new prefix>` Change my prefix',
// 		// 	],
//     //         args: [{
//     //             key: 'prefix',
//     //             prompt: 'What do you want to set the new prefix to?',
//     //             type: 'string',
//     //             default: '',
//     //             max: 20
//     //         }]
//     //     })
//     // }

//     // async run(message: CommandoMessage, { prefix }: { prefix: string }) {
//     //     // If a new prefix is mentioned, set the new prefix
//     //     if(prefix && message.member?.hasPermission('ADMINISTRATOR')) {  
//     //         Config.setPrefix(prefix)
//     //         return message.embed(await Discord.embed({ description: 'Changed the prefix to `{prefix}`' }))
//     //     } else {    // If no new prefix is mentioned, just show the current prefix
//     //         return message.embed(await Discord.embed({ description: 'Current prefix: `{prefix}`' }))
//     //     }
//     // }
// }