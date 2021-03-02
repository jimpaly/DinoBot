//jshint esversion: 8

const Tools = require('../tools.js');
const counting = require('./counting.json');
const mathjs = require('mathjs');

module.exports = {
	name: 'Counting',
	description: 'Play the counting game',
	detail: `Counting time! This command is for the counting game in {counting.channel}!!! Here are the rules:

> Each time you count, you have a 50/50 chance of gaining or losing points, and for each consecutive count, your gain decreases, while your loss increases:
> 1st: +${counting.reward} or -0
> 2nd: +${counting.reward-counting.decrease} or -${counting.decrease}
> 3rd: +${counting.reward-2*counting.decrease} or -${2*counting.decrease}
> ... *This goes on forever, so you can have a 100% chance of just losing points if you go long enough ;-;*

> When you mess up, you lose 10% of your points and the server number decreases by that same amount

> Also, when you count with math, you get more points! For each *different* operator (+-/*^) you get an extra 2 points(before boost), but also a +10% penalty

> When someone counts a **multiple of 10** (but not 100), they get a **+20% point boost** (and +20% penalty) for their next 10 counts

> When someone counts a **multiple of 100**, they get a **+100% point boost** (and +100% penalty) for their next 10 counts`,
	alias: ['counting', 'count', 'c'],
	usage: [
		['counting score|points|player [@member]', 'Check your or someone else\'s score 😏'],
		['counting leaderboard|scores', 'I\'ll list all the people playing, with the people with the highest score on top!'],
		['counting server|number', 'See the current number and some other server stats for the game!'],
		['counting stat|number|curr', 'I\'ll tell you the current number we\'re on!'],
		['counting channel [#channel]', '(Admin only) Check or change the channel where the game is played.'],
		['counting reward <reward> <reward decrease>', '(Admin only) Set the amount a player gets for each count <reward> and the amount that reward decreases for each consecutive point <reward decrease> (default 10, 2)'],
		['counting newgame|restart', '(Admin only) Delete ALL stats and start a new counting game anew ;-;'],
		['counting liveleaderboard|livelb|startlb', '(Admin only)', 'Create a top-10 leaderboard that will be constantly updated! (Good if pinned)']
	],
	public: true,
	developer: false,
	guildOnly: true,
	execute(message, args) {
		if(args.length < 1) {
			Tools.fault(message.channel, 'Looks like you need some help! Try `{prefix}help counting` 😉');
		} else if(['stat', 'stats', 'score', 'point', 'points', 'member', 'player', 'player', 'user'].includes(args[0].toLowerCase())) {
			if(args.length < 2) {
				sendStats(message.channel, message.member);
			} else if(message.mentions.members.size > 0) {
				sendStats(message.channel, message.mentions.members.first());
			} else {
				message.guild.members.fetch({ query: args[1], limit: 100 }).then(members => {
					if(members.size < 1) {
						Tools.fault(message.channel, 'I can\'t seem to find that member! Are you sure they\'re in the server?');
						return; }
					for(const member of members.values()) {
						if(counting.players.find(player => player.id === member.id) != undefined) {
							sendStats(message.channel, message.guild.member(member));
							return;
						}
					}
					sendStats(message.channel, members.first());
				});
			}
		} else if(['leaderboard', 'lb', 'scores'].includes(args[0].toLowerCase())) {
			message.channel.send('Loading leaderboard...').then(list => {
				list.react('◀️').then(_ => list.react('▶️'));
				pageList(list, 1);
			});
		} else if(['server', 'number', 'num', 'serverstats'].includes(args[0].toLowerCase())) {
			score = Tools.sum(counting.players, 'score');
			count = Tools.sum(counting.players, 'count');
			correct = Tools.sum(counting.players, 'correct');
			plus = Tools.sum(counting.players, 'plus');
			message.channel.send({ embed: {
				title: 'Counting Game Stats!',
				thumbnail: { url: message.guild.iconURL({format: 'png', dynamic: true, size: 512})},
				fields: [
					{ inline: true, name: `Number`, value: `${counting.number} (${counting.number+1} next)` },
					{ inline: true, name: `Total Score`, value: `${score}` },
					{ inline: true, name: `Player Count`, value: `${counting.players.length}` },
					{ inline: true, name: `Total Accuracy`, value: `${correct}/${count} (${Tools.percent(correct/count)})` },
					{ inline: true, name: `Accumulative Reward`, value: `+${plus} (${Tools.percent(plus/(2*plus-score))})` },
					{ inline: true, name: `Accumulative Penalty`, value: `-${plus-score} (${Tools.percent((plus-score)/(2*plus-score))})` }
				]
			}});
		} else if(message.member.hasPermission('ADMINISTRATOR') || message.member.id === 'MY_USER_ID') {
			if(['channel', 'setchannel', 'configchannel', 'channels'].includes(args[0].toLowerCase())) {
				if(message.mentions.channels.size < 1) {
					Tools.fault(message.channel, 'You need to specify a channel for me to use!');
				} else {
					counting.channel = message.mentions.channels.first().id;
					Tools.saveJSON(counting, './commands/counting.json');
					Tools.success(message.channel, `You can now play/continue the counting game in <#${counting.channel}>!`);
				}
			} else if(['reward', 'rewards', 'setreward', 'configreward'].includes(args[0].toLowerCase())) {
				if(args.length < 2 || !parseInt(args[1]) || parseInt(args[1]) <= 0) {
					Tools.fault(message.channel, 'I need a valid (positive whole number) value for the initial reward!');
				} else if(args.length < 3 || !parseInt(args[2]) || parseInt(args[1]) < 0) {
					Tools.fault(message.channel, 'I need a valid (non-negative whole number) value for the reward decrease!');
				} else {
					counting.reward = parseInt(args[1]);
					counting.decrease = parseInt(args[2]);
					Tools.saveJSON(counting, './commands/counting.json');
					Tools.success(message.channel, `Now, players will get ${counting.reward} points on their initial count, and the reward decreases by ${counting.decrease} for each consecutive count.`);
				}
			} else if(['newgame', 'restart'].includes(args[0].toLowerCase())) {
				message.channel.send({ embed: { title: 'Are you sure??',
					description: `Enter the current number to continue, with a dash(=) in front, like "=4" (if you enter something else, I'll cancel your request :D)`
				}}).then(_ => {
					message.channel.awaitMessages(response => { return response.member === message.member; }, {maxProcessed: 1, time: 10000, faults: ['time']}).then(response => {
						if(response.first().content.startsWith('=') && response.first().content.slice(1) === `${counting.number}`) {
							Tools.success(message.channel, `The game starts afresh! Set the counting channel to start again!`);
							message.channel.send(`⬇️ And don't worry! All the data for the previous game is stored here!`, {files: ['./commands/counting.json']});
							counting.channel = ''; counting.number = 0; counting.players = []; counting.leaderboard = {channel: '', message: ''};
							Tools.saveJSON(counting, './commands/counting.json');
						} else {
							message.channel.send({ embed: { title: 'Phew!',
								description: `I've cancelled your request since you didn't send the correct number. Don\'t worry! Everything\'s still safe!`
							}});
						}
					}).catch(() => {
						message.channel.send({ embed: { title: 'Phew!',
							description: `I've cancelled your request since you didn't reply in time! Everything's still safe!`
						}});
					});
				});
			} else if(['live', 'livelb', 'liveleaderboard', 'startlb', 'startlive', 'startleaderboard'].includes(args[0].toLowerCase())) {
				message.channel.send('Creating leaderboard...').then(msg => {
					counting.leaderboard.channel = msg.channel.id;
					counting.leaderboard.message = msg.id;
					updateLb(message.client);
				});
			}
		}
	},
	count(message) {
		if(message.channel.id !== counting.channel) return;
		if(!'1234567890'.includes(message.content.slice(0, 1))) return;
		if(!'1234567890'.includes(message.content.slice(-1))) return;
		number = 0;
		try { number = mathjs.evaluate(message.content); }
		catch(err) {return};
		if(message.content === '') return;
		console.log(message.content);
		random = Tools.random(1, 2)
		place = getPlace(message.member);
		if(place == -1) {
			counting.players.push({
				id: message.member.id,
				score: 0, consec: 0,					// score, amount scored for next count
				boost: 0, boostAmount: 0,			// %score boost, amount of rounds of boost left
				count: 0, correct: 0, plus: 0	// times counted, times correct, total added score
			});
			message.channel.send({embed: {
				title: `Welcome to the counting game, ${message.member.displayName}!`,
				description: (number == counting.number+1 ?
					`Yay! You got it right on your first try ${random == 1 ? `and earned 10 points!` : `but you were unlucky and didn't earn points...`}` :
					`Oof! You got it wrong on your first try ;-; But don't worry! You didn't lose any points! (since you're already at 0 lol)`) +
					Tools.replace('\nPlease read the rules in the pinned messages or by typing `{prefix}help counting`')
			}});
			place = counting.players.length-1;
		}
		if(number == counting.number+1) {
			if(random == 1) setStats(message, place, number, getReward(counting.players[place].consec)[0], true);
			else setStats(message, place, number, getReward(counting.players[place].consec)[1], true);
		} else if(number < counting.number+3 && number > counting.number-3) {
			setStats(message, place, number, 0, false);
			message.channel.send({embed:{
				title: [
					`OOF, ${message.member.displayName} messed up!`,
					`Looks like ${message.member.displayName} made a mistake!`,
					`${message.member.displayName} just had a little accident!`][Tools.random(0, 2)],
				description: [
					`I'm gonna look over this one since it looks like it was a mistake.`,
					`Good thing I'm feeling nice right now.`,
					`Don't worry, I spared you.`][Tools.random(0, 2)] +
					`\nThe number is still ${counting.number}`
			}});
		} else {
			setStats(message, place, number, -counting.players[place].score*0.1, false);
			message.channel.send({embed:{
				title: [
					`OOF! ${message.member.displayName} just messed up!`,
					`Are you serious? Why did you mess up, ${message.member.displayName}?`,
					`WHYYYY!! I hate you, ${message.member.displayName}!`,
					`Wow, ${message.member.displayName} is so dumb!`,
					`Can you even count, ${message.member.displayName}?!`][Tools.random(0, 4)],
				description: `<@${message.member.id}> just lost 10% of their points!!\n` + [
					`The next number is ${counting.number+1} now ;-;`,
					`Now we have to start back from ${counting.number+1}.`,
					`Time to take it back from ${counting.number+1}`,
					`We're going all the way back to ${counting.number+1}`,
					`Next person, count ${counting.number+1}`][Tools.random(0, 4)]
			}});
		}
		Tools.saveJSON(counting, './commands/counting.json');
	}
};

function sendStats(channel, member) {
	place = getPlace(member);
	if(place == -1) {
		Tools.fault(channel, `Looks like <@${member.id}> hasn\'t joined the game yet! Just start counting to enter!`);
		return;
	}
	player = counting.players[place];
	reward = getReward(player.consec);
	channel.send({ embed: {
		title: `Counting stats of ${member.displayName}`,
		fields: [
			{ inline: true, name: `Score`, value: `${player.score} (${Tools.addSign(reward[0])} or ${Tools.addSign(reward[1])} next turn)` },
			{ inline: true, name: `Leaderboard`, value: `${Tools.numPostfix(place+1)} place` },
			{ inline: true, name: `Boost`, value: `${Tools.addSign(Tools.percent(player.boost))} ${player.boostAmount > 0 ? `(${player.boostAmount} turns left)` : ''}` },
			{ inline: true, name: `Accuracy`, value: `${player.correct}/${player.count} (${Tools.percent(player.correct/player.count)})` },
			{ inline: true, name: `Accumulative Reward`, value: `+${player.plus} (${Tools.percent(player.plus/(2*player.plus-player.score))})` },
			{ inline: true, name: `Accumulative Penalty`, value: `-${player.plus-player.score} (${Tools.percent((player.plus-player.score)/(2*player.plus-player.score))})` }
		],
		thumbnail: { url: member.user.displayAvatarURL({format: 'png', dynamic: true, size: 256}) },
		timestamp: Date.now()
	}});
}
function pageList(message, page) {
	if(page > Math.ceil(counting.players.length/10)) page = Math.ceil(counting.players.length/10);
	if(page < 1) page = 1;
	const embed = {
		title: 'Leaderboard',
		description: '',
		thumbnail: { url: 'https://cdn.discordapp.com/attachments/707380815889432610/722156237873086504/podium.png'},
		footer: {text: page+'/'+Math.ceil(counting.players.length/10)},
		timestamp: Date.now()
	}
	for(place = (page-1)*10; place < counting.players.length && place < page*10; place++) {
		player = counting.players[place];
		switch(place) {
			case 0: embed.description += '🥇'; break;
			case 1: embed.description += '🥈'; break;
			case 2: embed.description += '🥉'; break;
			case 3: embed.description += '<:4_:721619195837546537>'; break;
			case 4: embed.description += '<:5_:721619195888009246>'; break;
			default: embed.description+= `${place+1}`;
		}
		embed.description += ` <@${player.id}> (${player.score})\n`;
	}
	if(embed.description === '') embed.description = 'Looks like nobody started counting yet!';
	message.edit('', {embed: embed});
	const filter = (reaction, user) => {
		if(!user.bot) reaction.users.remove(user);
		return ['◀️', '▶️'].includes(reaction.emoji.name) && !user.bot;
	}
	message.awaitReactions(filter, {max: 1, time: 20000, errors: ['time']}).then(collected => {
		if(collected.first().emoji.name === '◀️') {
			pageList(message, page-1);
		} else if(collected.first().emoji.name === '▶️') {
			pageList(message, page+1);
		}
	}).catch(_ => {
		message.reactions.removeAll();
	});
}
function setStats(message, place, number, point, correct) {
	player = counting.players[place];
	numOp = 0;
	for(let op of '+-/*^') if(message.content.includes(op)) numOp+= 1;
	console.log(numOp);
	if(correct) point = Math.ceil((point+numOp*2)*(1+player.boost));
	else point = Math.ceil((point)*(1+player.boost+numOp*0.1));
	if(correct || (!correct && point >= 0)) {
		reactNum(message, `${Tools.addSign(point)}${!correct ?
			(point < 0 ? '😤' : (point == 0 ? '😑' : '🤷‍♀️')) :
			(point > 0 ? '🏆' : (point == 0 ? '😑' : '😢'))}`);
	} else {
		message.react('😤')
	}
	if(correct) counting.number++;
	else counting.number+= point; if(counting.number < 0) counting.number = 0;
	player.score+= point; if(player.score < 0) player.score = 0;
	player.count++;
	player.consec++;
	if(correct) player.correct++;
	if(point > 0) player.plus+= point;
	if(player.boostAmount > 0) player.boostAmount--;
	if(player.boostAmount == 0) player.boost = 0;
	if(correct && number % 100 == 0) { player.boost = 1.0; player.boostAmount = 10; }
	else if(correct && number % 10 == 0) { player.boost = 0.2; player.boostAmount = 10; }
	for(let p in counting.players) if(p != place) counting.players[p].consec = 0;

	newPlace = place;
	if(point > 0) {
		for(; newPlace > 0; newPlace--) {
			if(counting.players[newPlace-1].score >= player.score) break;
		}
	} else if(point < 0) {
		for(; newPlace < counting.players.length-1; newPlace++) {
			if(counting.players[newPlace+1].score <= player.score) break;
		}
	}
	temp = counting.players[place];
	counting.players[place] = counting.players[newPlace];
	counting.players[newPlace] = temp;
	updateLb(message.client);
}
function updateLb(client) {
	if(counting.leaderboard.channel === '' || counting.leaderboard.message === '') return;
	const embed = {
		title: 'Counting Game!',
		description: Tools.replace(`Welcome to the counting game! Here are the basics:

> You can gain or lose points each time you count, but when you mess up, you'll lose points by a lot!

> Also, when you count incorrectly, the number will get pushed back too ;-; so don't mess up!

> When you use math with +,-,/,*,^, you even get more points! (but also a higher penalty if you mess up)

> You also get nice point boosts when you count a multiple of 10!

Try \`{prefix}help counting\` to see the rules in more detail! `),
		image: { url: 'https://cdn.discordapp.com/attachments/707380815889432610/722234128187129956/nums.png'},
		footer: {text: 'Last updated'},
		timestamp: Date.now(),
		fields: [
			{ inline: true, name: 'Current Number', value: `${counting.number}`},
			{ inline: true, name: 'Number of Players', value: `${counting.players.length}` },
			{ name: 'Leaderboard', value: '' }
		]
	}
	for(place = 0; place < counting.players.length && place < 10; place++) {
		player = counting.players[place];
		switch(place) {
			case 0: embed.fields[2].value += '🥇'; break;
			case 1: embed.fields[2].value += '🥈'; break;
			case 2: embed.fields[2].value += '🥉'; break;
			case 3: embed.fields[2].value += '<:4_:721619195837546537>'; break;
			case 4: embed.fields[2].value += '<:5_:721619195888009246>'; break;
			default:embed.fields[2].value += `${place+1}`;
		}
		embed.fields[2].value += ` <@${player.id}> (${player.score})\n`;
	}
	if(embed.fields[2].value === '') embed.fields[2].value = 'Oof! Nobody started counting yet!';
	Tools.getMessage(client, counting.leaderboard.channel, counting.leaderboard.message, msg => {
		msg.edit('', {embed: embed});
	});
}

function getPlace(member) {
	return counting.players.findIndex(player => player.id === member.id);
}

async function reactNum(message, number) {
	for(let c of number) {
		if(c == '+') await message.react('721619193883263036');
		else if(c == '-') await message.react('721619193715359744');
		else if(c == '1') await message.react('721619194109624340');
		else if(c == '2') await message.react('721619194378190849');
		else if(c == '3') await message.react('721619194554220546');
		else if(c == '4') await message.react('721619195837546537');
		else if(c == '5') await message.react('721619195888009246');
		else if(c == '6') await message.react('721619195455864884');
		else if(c == '7') await message.react('721810869121581056');
		else if(c == '8') await message.react('721619195917500466');
		else if(c == '9') await message.react('721619261189259265');
		else if(c == '0') await message.react('721619193971343400');
		// else if(c == '🏆' && number[1] == '0') await message.react('😑');
		// else if(c == '🏆' && number[0] == '+') await message.react('🏆');
		// else if(c == '🏆' && number[0] == '-') await message.react('😢');
		else await message.react(c);
	}
}

function getReward(consec) {
	return [
		counting.reward-counting.decrease*consec,
		-counting.decrease*consec
	];
}
