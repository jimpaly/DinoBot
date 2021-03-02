//jshint esversion: 6

const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const counting = require('./commands/counting.json');

module.exports = {

    fault(channel, message) {
        channel.send(
            new Discord.MessageEmbed()
            .setTitle('OOPS!')
            .setDescription(module.exports.replace(message))
        );
    },
    error(channel, err) {
        channel.send(
            new Discord.MessageEmbed()
            .setTitle('OOF!')
            .setDescription('I seem to be having a problem... Don\'t worry, this isn\'t your fault.')
        );
        console.error(err);
    },
		isAdmin(member) {
			if(member.hasPermission('ADMINISTRATOR')) {return true;}
			if(member.id === 'MY_USER_ID') {return true;}
			return false;
		},

		success(channel, message) {
			channel.send({ embed: {
				title: 'Success!',
				description: message
			}})
		},
    exists(variable) {
        return typeof variable !== 'undefined';
    },

		equalStr(str, opt) {
			if(!module.exports.exists(str)) return false;
			options = opt.split(' ');
			for(var option of options) {
				if(str.toLowerCase() === option.toLowerCase()) return true;
			}
			return false;
		},
		combine(elements, delim) {
			str = ''
			for(var element of elements) {
				str += element + delim;
			}
			return str.slice(0, str.length-delim.length).trim();
		},
		slice(str, opt) {
			options = opt.replace(/{prefix}/gi, config.prefix).split(' ');
			for(var option of options) {
				str = str.trim().slice(option.length);
			}
			return str.trim();
		},
		replace(str) {
			// {prefix}
		  const c = config.prefix.substr(-1);
		  if((c>='a'&&c<='z') || (c>='A'&&c<='Z')) {
		    str = str.replace(/{prefix}/gi, config.prefix+" ");
		  } else {
		    str = str.replace(/{prefix}/gi, config.prefix);
		  }
			// {counting.channel}
			str = str.replace(/{counting.channel}/gi, `<#${counting.channel}>`);
			str = str.replace(/{counting.reward}/gi, `<#${counting.reward}>`);
			str = str.replace(/{counting.decrease}/gi, `<#${counting.decrease}>`);
			return str;
		},
		numPostfix(num) {
			if(Math.floor(num%100/10) == 1) return `${num}th`;
			if(num%10 == 1) return `${num}st`;
			if(num%10 == 2) return `${num}nd`;
			if(num%10 == 3) return `${num}rd`;
			return `${num}th`;
		},
		percent(num) {
			if(isNaN(num)) return '0%'
			return `${Math.round(num*100)}%`;
		},
		addSign(num) {
			return num<0 ? `${num}` : `+${num}`;
		},

		saveJSON(object, file) {
			fs.writeFile(file, JSON.stringify(object, null, 2), (err) => {
				if (err) console.log('fault writing file messages.json:', err)
			});
		},

		getMessage(client, channel, message, callback) {
			client.channels.fetch(channel).then(ch => {
				ch.messages.fetch(message).then(msg => {
					callback(msg);
				});
			});
		},
		getURL(guild, channel, message) {
			return 'https://discordapp.com/channels/'+guild+'/'+channel+'/'+message;
		},

		random(min, max) {
			return Math.floor(Math.random() * (max+1-min)) + min;
		},
		sum(array, property) {
			sum = 0;
			for(let num of array.map(element => element[property])) sum += num;
			return sum;
		}

};
