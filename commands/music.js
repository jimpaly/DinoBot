//jshint esversion: 8

const musicData = require('./music.json');
const Tools = require('../tools.js');
const ytdl = require('ytdl-core');

songQueue = [];
playlistQueue = [];
songHistory = [];
var currSong;
currPlaylist = "";
var connection;

module.exports = {
	name: 'Music',
	description: 'Play music and save playlists!',
	detail: 'With this command, you can play songs from youtube. You may also add songs to playlists if you have the dj role.',
	alias: ['music', 'm', 'song', 'songs'],
	usage: [
		['music playing', 'Shows info about the song currently playing'],
		['music queue|list', 'Lists the next songs.'],
		['music history', 'Lists the playing history.'],
		['music remove <queue number>', 'Removes a song from the queue.'],
		['music play [youtube url]', 'Adds song to the queue or resumes playing.'],
		['music skip', 'Skips the current song.'],
		['music shuffle', 'Shuffles the queue'],
		['music stop', 'Pauses the music'],
		['music leave', 'I\'ll leave the voice channel.'],
		['music clear', 'Clears the queue.'],
		['music volume [volume]', 'Sets the volume to a number from 0 to 100.'],
		['m playlist', 'Lists all the playlist on the server'],
		['m playlist play <playlist name>', 'Loads the playlist into the queue.'],
		['m playlist loop enable|disable', 'Toggle playlist looping.'],
		['m playlist show <name>', 'Lists all the songs in a playlist'],
		['m playlist edit <name> add <url>', 'Adds a song to a playlist'],
		['m playlist edit <name> remove <index>', 'Removes a song from a playlist']
	],
	public: true,
	developer: false,
	guildOnly: true,
	async execute(message, args) {
		if(!message.guild.channels.cache.has(musicData.channel)) {
			musicData.channel = message.channel.id;
			Tools.saveJSON(musicData, './commands/music.json');
		}
		if(args.length < 1) {
			return;
		} else if(Tools.isAdmin(message.member) && ['dj', 'role', 'djset'].includes(args[0])) {
			if(args.length < 3) {
				showDJ(message.channel, "");
			} else if(['add', 'set', 'new', 'create', 'c', 'a'].includes(args[1])) {
				if(message.guild.roles.cache.has(message.mentions.roles.firstKey())) {
					musicData.dj.push(message.mentions.roles.firstKey());
					showDJ(message.channel, "⬇️ DJ roles updated!")
					Tools.saveJSON(musicData, './commands/music.json');
				} else if(message.guild.roles.cache.find(role => role.name === args[2])) {
					musicData.dj.push(message.guild.roles.cache.find(role => role.name === args[2]).id);
					showDJ(message.channel, "⬇️ DJ roles updated!")
					Tools.saveJSON(musicData, './commands/music.json');
				} else {
					Tools.fault("That role doesn't exist!");
				}
			} else if(['remove', 'delete', 'rm', 'del', 'r', 'd'].includes(args[1])) {
				if(!musicData.dj[parseInt(args[2])-1]) {
					Tools.fault(message.channel, "That isn't the number of a DJ role!");
				} else {
					musicData.dj.splice(parseInt(args[2], 1));
					showDJ(message.channel, "⬇️ DJ roles updated!")
					Tools.saveJSON(musicData, './commands/music.json');
				}
			} else {
				showDJ(message.channel, "");
			}
		} else if(Tools.isAdmin(message.member) && ['channel', 'announce'].includes(args[0])) {
			if(args.length < 2) {
				if(musicData.channel) {
					message.channel.send({embed: {description:
						`Announcement channel: <#${musicData.channel}>`}});
				} else {
					message.channel.send({embed: {description:
						`No announcement channel is set!`}});
				}
			} else if(!message.guild.channels.cache.has(message.mentions.channels.firstKey())) {
				Tools.fault("That isn't a valid channel!");
			} else {
				musicData.channel = message.mentions.channels.firstKey();
				message.channel.send({embed: {description:
					`Announcement channel updated: <#${musicData.channel}>`}});
				Tools.saveJSON(musicData, './commands/music.json');
			}
		} else if(['playing', 'now', 'np', 'current'].includes(args[0])) {
			if(currSong) {
				showSong(message.channel, "Currently Playing", currSong);
			} else {
				message.channel.send({embed: {description: "Nothing is currently playing!"}});
			}
		} else if(['queue', 'q'].includes(args[0])) {
			message.channel.send('Loading queue...').then(list => {
				list.react('◀️').then(_ => list.react('▶️'));
				pageSongs(list, "Queue", songQueue.concat(playlistQueue), 1);
			});
		} else if(['history', 'h', 'prev', 'previous'].includes(args[0])) {
			message.channel.send('Loading history...').then(list => {
				list.react('◀️').then(_ => list.react('▶️'));
				pageSongs(list, "History", songHistory, 1);
			});
		} else if(isDJ(message) && ['remove', 'rm', 'rem', 'delete', 'del'].includes(args[0])) {
			removeFromQueue(parseInt(args[1]));
		} else if(['play', 'p', 'resume', 'r', 'continue', 'start', 'add'].includes(args[0])) {
			playSong(message, args[1]);
		} else if(isDJ(message) && ['skip', 'next'].includes(args[0])) {
			skipSong(message);
		} else if(isDJ(message) && ['shuffle', 'sh', 'random', 'rand', 'randomize'].includes(args[0])) {
			shuffleQueue(message);
		} else if(isDJ(message) && ['stop', 's', 'pause'].includes(args[0])) {
			stopSong(message);
		} else if(isDJ(message) && ['leave', 'quit', 'die', 'begone'].includes(args[0])) {
			message.guild.voice.channel.leave();
		} else if(isDJ(message) && ['clear', 'clearQueue', 'c'].includes(args[0])) {
			songQueue = [];
			playlistQueue = [];
			currPlaylist = "";
			message.channel.send("Cleared the queue!");
		} else if(isDJ(message) && ['volume', 'vol', 'v'].includes(args[0])) {
			if(args.length < 2) {
				message.channel.send({embed: {description: `The current volume is ${musicData.volume}/100`}});
			} else if(!isInVC(message)) {
				Tools.fault(message.channel, "I'm not in a voice channel!");
			} else if(!isNaN(parseFloat(args[1]))) {
				musicData.volume = Math.round(Math.min(Math.max(parseFloat(args[1]), 0), 100));
				connection.dispatcher.setVolumeLogarithmic(musicData.volume/100);
				message.channel.send({embed: {description: `Volume is now ${musicData.volume}/100`}});
				Tools.saveJSON(musicData, './commands/music.json');
			} else {
				message.channel.send({embed: {description: `The current volume is ${musicData.volume}/100`}});
			}
		} else if(['playlist', 'pl', 'songlist'].includes(args[0])) {
			if(args.length < 2) {
				showPlaylists(message);
			} else if(['play', 'load', 'p', 'start', 'queue', 'q'].includes(args[1])) {
				loadPlaylist(message, args[2]);
			} else if(isDJ(message) && ['loop', 'lp'].includes(args[1])) {
				if(args.length < 3) {
					message.channel.send({embed: {description:
						`Playlist looping is currently ${musicData.loop ? "on" : "off"}.`}});
				} else if(['enabled', 'enable', 'on', 'yes', 'y'].includes(args[1])) {
					musicData.loop = true;
					Tools.saveJSON(musicData, './commands/music.json');
				} else if(['disabled', 'disable', 'off', 'no', 'n'].includes(args[1])) {
					musicData.loop = false;
					Tools.saveJSON(musicData, './commands/music.json');
				} else {
					message.channel.send({embed: {description:
						`Playlist looping is currently ${musicData.loop ? "on" : "off"}.`}});
				}
				Tools.saveJSON(musicData, './commands/music.json');
			} else if(hasDJ(message) && ['create', 'c', 'make'].includes(args[1])) {
				createPlaylist(message, args[2]);
			} else if(hasDJ(message) && ['delete', 'del', 'd', 'remove', 'rm'].includes(args[1])) {
				deletePlaylist(message, args[2]);
			} else if(['show', 'list', 'ls', 'l'].includes(args[1])) {
				if(args.length < 3) {
					showPlaylists(message);
				} else if(!musicData.playlists[args[2]]) {
					Tools.fault(message.channel, "That playlist doesn't exist!");
				} else {
					message.channel.send(`Loading playlist: ${args[2]}...`).then(list => {
						list.react('◀️').then(_ => list.react('▶️'));
						pageSongs(list, `Songs in Playlist: ${args[2]}`, musicData.playlists[args[2]], 1);
					});
				}
			} else if(hasDJ(message) && ['edit', 'e'].includes(args[1])) {
				if(!musicData.playlists[args[2]]) {
					Tools.fault(message.channel, "Please specify an existing playlist.");
				} else if(['delete', 'del', 'd', 'remove', 'rm'].includes(args[3])) {
					removeFromPlaylist(message, args[2], parseInt(args[4])-1);
				} else if(['add', 'insert', 'a'].includes(args[3])) {
					addToPlaylist(message, args[2], args[4]);
				}
			} else {
				showPlaylists(message);
			}
		}
	}
};

function showDJ(channel, text) {
	embed = {title: "DJ Roles", description: ""};
	for(i = 0; i < musicData.dj.length; i++) {
		embed.description += `${i+1}. <@&${musicData.dj[i]}>\n`;
	}
	if(embed.description === "") embed.description = "No DJ roles are set yet!";
	channel.send(text, {embed: embed});
}
function isDJ(message) {
	if(Tools.isAdmin(message.member)) return true;
	for(var role of musicData.dj) {
		if(message.member.roles.cache.has(role)) {
			return true;
		}
	}
	if(isSameVC(message) && message.member.voice.channel.members.size < 3) {
		return true;
	}
	return false;
}
function hasDJ(message) {
	if(Tools.isAdmin(message.member)) return true;
	for(var role of musicData.dj) {
		if(message.member.roles.cache.has(role)) {
			return true;
		}
	}
	return false;
}

function isInVC(message) {
	if(message.guild.voice && message.guild.voice.channel) return true;
	return false;
}
function isSameVC(message) {
	if(!isInVC(message)) return false;
	return message.guild.voice.channel.id === message.member.voice.channel.id;
}
async function joinVC(message) {
	musicChannel = message.member.voice.channel;
	if(!musicChannel) {
		return;
	}
	try {
		connection = await musicChannel.join();
	} catch (err) {
		Tools.error(message.channel, err);
	}
}

async function addToQueue(url) {
	var songInfo;
	try {
		songInfo = await ytdl.getInfo(url);
	} catch(err) {
		return false
	}

	const song = {
	 title: songInfo.videoDetails.title,
	 url: songInfo.videoDetails.video_url,
	};
	songQueue.push(song);
	return song;
}
function removeFromQueue(index) {
	if(songQueue[index]) {
		showSong(message.channel, "Removed from Queue", songQueue[index]);
		songQueue.splice(index, 1);
	} else if(playlistQueue[index-songQueue.length]) {
		showSong(message.channel, "Removed from Queue", playlistQueue[index-songQueue.length]);
		songQueue.splice(index, 1);
	} else {
		Tools.fault(message.channel, "That isn't the number of a song on the queue!");
	}
}
function showQueue(message) {
	embed = { title: "Queue", description: "" };
	for(i = 1; i < songQueue.length; i++) {
		song = songQueue[i];
		embed.description += `${i}. [${song.title}](${song.url})\n\n`;
	}
	if(embed.description === "") embed.description = "Nothing here!";
	message.channel.send({embed: embed});
}
function showHistory(message) {
	embed = { title: "History", description: "" };
	for(i = 0; i < songHistory.length; i++) {
		song = songQueue[i];
		embed.description += `${i+1}. [${song.title}](${song.url})\n\n`;
	}
	if(embed.description === "") embed.description = "Nothing here!";
	message.channel.send({embed: embed});
}
function shuffleQueue(message) {

	playlistQueue = songQueue.concat(playlistQueue);
	songQueue = [];

	newArr = [];

	while(playlistQueue.length > 0) {
		randIndex = Tools.random(0, playlistQueue.length-1);
		newArr.push(playlistQueue[randIndex]);
		playlistQueue.splice(randIndex, 1)
	}

	playlistQueue = newArr;

	message.channel.send({embed: {description: "Shuffled the queue!"}});

}

function showSong(channel, title, song) {
	channel.send({embed: {
		title: title,
		description: `[${song.title}](${song.url})`
	}})
}
async function playSong(message, url) {
	if(isInVC(message) && !isSameVC(message)) {
		Tools.fault(message.channel, "Join my voice channel first!");
	} else if(!message.member.voice.channel) {
		Tools.fault(message.channel, "Please join a voice channel first!");
	} else if(!url) {
		if(!currSong) {
			Tools.fault(message.channel, "There isn't anything in the queue to play!");
		} else if(!isInVC(message)) {
			await joinVC(message);
			announceChannel = await message.client.channels.fetch(musicData.channel);
			startSong(currSong, announceChannel);
		} else resumeSong()
	} else {
		song = await addToQueue(url);
		if(!song) {
			Tools.fault(message.channel, "That isn't a valid YouTube url!");
			return;
		}
		showSong(message.channel, "Added to Queue!", song);
		if(!isInVC(message)) await joinVC(message);
		if(!currSong) {
			currSong = songQueue.shift();
			announceChannel = await message.client.channels.fetch(musicData.channel);
			startSong(currSong, announceChannel);
		}
	}
}
function startSong(song, announceChannel) {
	if (!song) {
    return;
  }
	announceChannel.send({embed: {description: `Now playing: **[${currSong.title}](${currSong.url})**`}});
	const dispatcher = connection
    .play(ytdl(song.url, {filter: "audioonly", highWaterMark: 1<<25}))
    .on("finish", () => {
			songHistory.unshift(currSong);
			if(songHistory.length > 100) songHistory.pop();
			if(songQueue.length > 0) {
				currSong = songQueue.shift();
			} else {
				currSong = playlistQueue.shift();
				if(musicData.loop) fillPlaylistQueue();
			}
			if(currSong) startSong(currSong, announceChannel);
    })
    .on("error", error => console.error(error));
	dispatcher.setVolumeLogarithmic(musicData.volume/100);
}
function skipSong(message) {
	if (!isInVC(message) || !currSong) {
		Tools.fault(message.channel, "There is no song to skip!");
	} else {
		connection.dispatcher.end();
	}
}
function stopSong(message) {
  if (!isInVC(message)) {
		Tools.fault(message.channel, "There is nothing to stop!");
	} else {
  	connection.dispatcher.pause();
	}
}
function resumeSong() {
  if(connection.dispatcher) connection.dispatcher.resume();
}

function pageSongs(message, title, songList, page) {
	if(page > Math.ceil(songList.length/10)) page = Math.ceil(songList.length/10);
	if(page < 1) page = 1;
	const embed = {
		title: title,
		description: '',
		footer: {text: page+'/'+Math.ceil(songList.length/10)}
	}
	for(index = (page-1)*10; index < songList.length && index < page*10; index++) {
		song = songList[index];
		embed.description+= `${index+1}. [${song.title}](${song.url})\n`;
	}
	if(embed.description === '') embed.description = 'Nothing here!';
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

function showPlaylists(message, text) {
	embed = {
		title: "Playlists",
		description: "",
	}
	for(var playlist of Object.keys(musicData.playlists))
		embed.description += `${playlist}\n`;
	if(embed.description === "") embed.description = "No playlists yet!"
	message.channel.send(text, {embed: embed});
}
async function loadPlaylist(message, playlist) {
	if(isInVC(message) && !isSameVC(message)) {
		Tools.fault(message.channel, "Join my voice channel first!");
	} else if(!message.member.voice.channel) {
		Tools.fault(message.channel, "Please join a voice channel first!");
	} else if(!playlist) {
		Tools.fault(message.channel, "You need to specify a playlist to play!");
	} else if(!musicData.playlists[playlist]) {
		Tools.fault(message.channel, "That playlist doesn't exist!");
	} else {
		currPlaylist = playlist;
		fillPlaylistQueue();
		message.channel.send({embed: {description: "Loaded playlist into queue."}});
		if(!isInVC(message)) await joinVC(message);
		if(!currSong) {
			currSong = playlistQueue.shift();
			message.client.channels.fetch(musicData.channel)
				.then(channel => startSong(currSong, channel))
		}
	}
}
async function updateSong(playlist, index) {
	songInfo = await ytdl.getInfo(musicData.playlists[playlist][index].url);
	song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	};
	musicData.playlists[playlist][index] = song;
	Tools.saveJSON(musicData, './commands/music.json');
}
async function fillPlaylistQueue() {
	plSongs = musicData.playlists[currPlaylist];
	if(!plSongs) return;
	while(playlistQueue.length < plSongs.length) {
		randIndex = Tools.random(0, plSongs.length-1);
		played = false;
		for(i = Math.floor(playlistQueue.length/2); i < playlistQueue.length; i++) {
			if(playlistQueue[i].url === plSongs[randIndex].url) {
				played = true;
				break;
			}
		}
		if(!played) {
			playlistQueue.push(plSongs[randIndex]);
			updateSong(currPlaylist, randIndex);
		}
	}
}
function createPlaylist(message, name) {
	if(musicData.playlists[name]) {
		Tools.fault(message.channel, "That playlist already exists!");
	} else {
		musicData.playlists[name] = [];
		Tools.saveJSON(musicData, './commands/music.json');
		showPlaylists(message, "⬇️ Playlist created!");
	}
}
function deletePlaylist(message, name) {
	if(!musicData.playlists[name]) {
		Tools.fault(message.channel, "That playlist doesn't exist!");
	} else {
		delete musicData.playlists[name];
		Tools.saveJSON(musicData, './commands/music.json');
		showPlaylists(message, "⬇️ Playlist removed!")
	}
}
function removeFromPlaylist(message, name, index) {
	if(!musicData.playlists[name][index]) {
		Tools.fault(message.channel, "That isn't the number of a song in the playlist!");
	} else {
		showSong(message.channel, `Removed from playlistame}`, musicData.playlists[name][index]);
		musicData.playlists[name].splice(index, 1);
		Tools.saveJSON(musicData, './commands/music.json');
	}
}
async function addToPlaylist(message, name, url) {
	songInfo = await ytdl.getInfo(url);
	song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	}
	musicData.playlists[name].push(song);
	Tools.saveJSON(musicData, './commands/music.json');
	showSong(message.channel, `Added to playlist`, song);
}
