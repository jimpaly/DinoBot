# DinoBot

![DINO RAWR!](https://repository-images.githubusercontent.com/343701024/118b1780-7af0-11eb-8807-cd481d90685c)

A friendly little bot for a friendly little Discord Server I'm in :)

***

## Running on your own bot

Here are the steps you should follow to get this up and running with your own bot

1. Make sure you've [made a Discord application](https://discordjs.guide/preparations/setting-up-a-bot-application.html) and installed [node.js](https://nodejs.org/en/)
2. Download the [latest release](https://github.com/jimpaly/DinoBot/releases/latest), or run  
```
curl -s https://api.github.com/repos/jimpaly/DinoBot/releases/latest \ 
| grep "\"browser_download_url\":.*zip" \ 
| cut -d '"' -f 4 \
| wget -qi - -O DinoBot.zip
```
3. Unzip the downloaded file, or run `unzip DinoBot`
3. Run `npm install` to install the dependencies
4. Run `npm run init` to change the names of the template files/folders and enter your tags in [private.json](https://github.com/jimpaly/DinoBot/blob/master/private-template.json)
5. Run `npm start` to run the bot

In the future, you can simply update the bot with `npm run update`!
