const {Client, Collection, CommandInteraction, UserContextMenuInteraction, CommandInteractionOptionResolver, Intents: {FLAGS}} = require('discord.js');
const {Routes} = require('discord-api-types/v9');
const {MessageEmbed, MessageActionRow, TextInputComponent, Modal} = require('discord.js');
const {REST} = require('@discordjs/rest');
const axios = require('axios');
const {jsonParse, jsonSave, translate, getUserSettings} = require('./util');
const fs = require('fs');
const ms = require("ms")
const translators = jsonParse('./data/translators.json', {});
const {ActivityType} = require('discord.js');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');

const punctuationRegex = /[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=\-。、・？！「」\s]/g;

const intents = [
    FLAGS.GUILDS,
    FLAGS.GUILD_MESSAGES,
    FLAGS.GUILD_MESSAGE_REACTIONS,
    FLAGS.DIRECT_MESSAGES
];
const client = new Client({intents, partials: ['CHANNEL'], shards: 'auto'});
Object.defineProperty(client, 'config', {
    get: function () {
        return jsonParse('./config.json', {})
    }
});


const rest = new REST({version: '10'}).setToken(client.config.DISCORD_TOKEN);

if (client?.user?.id === '872528910301163551') {
    const {AutoPoster} = require('topgg-autoposter')
    const poster = AutoPoster('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg3MjUyODkxMDMwMTE2MzU1MSIsImJvdCI6dHJ1ZSwiaWF0IjoxNjczNTI0NjY3fQ.lEIfDZapXDoA1N1t3CqblCamVvUj_q4vqtOdzDFVd4Y', client)
    poster.on('posted', (stats) => {
    })
}

const startup = new Date()

async function fileUpdater() {
    let file1 = await axios.get('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json')
    let file2 = await axios.get('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json')
    let file3 = await axios.get('https://gitlab.com/Dimbreath/AnimeGameData/-/raw/main/ExcelBinOutput/AvatarExcelConfigData.json')

    jsonSave('./data/charSkill.json', file1?.data)
    jsonSave('./data/loc.json', file2?.data)

    let zg = file3?.data

    function query(data) {
        return Object.values(data)
            ?.filter(i => !i.id?.toString()?.startsWith('11'))
            ?.map(item => ({
                "iconName": item?.iconName,
                "sideIconName": item?.sideIconName,
                "skillDepotId": item?.skillDepotId,
                "nameTextMapHash": item?.nameTextMapHash,
                "qualityType": item?.qualityType,
                "weaponType": item?.weaponType,
                "id": item?.id
            }))
    }

    const data = query(zg)

    jsonSave('./data/charSkill.json', file1?.data)
    jsonSave('./data/loc.json', file2?.data)
    jsonSave('./data/characters.json', data)
}

setInterval(() => {
    const d = new Date();
    if (d.getUTCDay() !== 4) return null;

    fileUpdater();
}, 60 * 60 * 1000);

client.once('ready', async () => {
        const {data: hex} = await axios.get('https://discord.com/api/v8/applications/' + client.user.id + '/commands', {headers: {Authorization: 'Bot ' + client.token}})
        const ver = jsonParse('./package.json', {})
        const statusArray = [
            {
                type: 'WATCHING',
                content: 'over ' + await client.guilds.cache.size + ' servers',
                status: 'idle'
            },
            {
                type: 'WATCHING',
                content: await client.guilds.cache.reduce((a, b) => a + b.memberCount, 0) + ' Travelers',
                status: 'idle'
            },
            {
                type: 'LISTENING',
                content: client?.username + ' v' + ver?.version,
                status: 'idle'
            }
        ];

        async function pickPresence() {
            const option = Math.floor(Math.random() * statusArray.length);

            try {
                await client.user.setPresence({
                    activities: [
                        {
                            name: statusArray[option].content,
                            type: 'STREAMING',
                            url: 'https://twitch.tv/FortOfFans'
                        }],
                    status: statusArray[option].status
                })
            } catch (error) {
                console.error(error);
            }

        }

        setInterval(pickPresence, 30 * 1000);

        const data2 = jsonParse('./data/dailies.json', {})

        const hoYo = jsonParse('./data/hoYo.json', {})

        const h = Object.entries(hoYo)

        try {
            const commands = [];
            client.commands = new Collection();
            for (const file of fs.readdirSync('./commands')) {
                const command = require('./commands/' + file);
                command.name_localizations = {};
                command.description_localizations = {};
                for (const lang of Object.values(translators).filter((l, i, arr) => arr.indexOf(l) === i)) {
                    command.name_localizations[lang] = translate(command.name, lang).toLowerCase().replace(punctuationRegex, '');
                    if (![2, 3].includes(command.type)) command.description_localizations[lang] = translate(command.description, lang).substr(0, 100);
                }

                if (command.options) {
                    for (const option of command.options) {
                        option.name_localizations = {};
                        option.description_localizations = {};
                        for (const lang of Object.values(translators).filter((l, i, arr) => arr.indexOf(l) === i)) {
                            option.name_localizations[lang] = translate(option.name, lang).toLowerCase().replace(punctuationRegex, '');
                            option.description_localizations[lang] = translate(option.description, lang).substr(0, 100);
                        }
                    }
                }

                commands.push(command);
                client.commands.set(command.name, command);
            }

            console.log('Refreshing slash commands.');
            await rest.put(
                client.config.TEST_GUILD ?
                    Routes.applicationGuildCommands(client.user.id, client.config.TEST_GUILD) :
                    Routes.applicationCommands(client.user.id)
                ,
                {body: commands}
            );
            console.log('Refreshed slash commands.');
        } catch (e) {
            console.error(e);
            if (e.rawError) console.log(JSON.stringify(e.rawError.errors, null, '\t'));
        }

        Object.defineProperty(client, 'usedCommands', {
            get: function () {
                return parseInt(fs.readFileSync('./data/commands.txt').toString())
            },
            set: function (amt) {
                fs.writeFileSync('./data/commands.txt', amt.toString())
            },
        });

        setInterval(async () => {
            const reminders = jsonParse('./data/reminders.json', []).sort((a, b) => a.timestamp - b.timestamp);
            const next = reminders.shift();
            if (!next) return null;

            const date = Date.now();
            if (next.timestamp <= Math.floor(date / 1000)) {
                if (next.repeat) {
                    next.timestamp += next.repeat;
                    reminders.push(next);
                }

                jsonSave('./data/reminders.json', reminders);

                const user = await client.users.fetch(next.user);
                await user.send(next.message).catch(() => {
                });
            }
        }, 500);

        if (client?.user?.id === '872528910301163551') {
            setInterval(async () => {
                const hoYo = jsonParse('./data/hoYo.json', []);

                let i = 0;
                for (const user in hoYo) {
                    for (const cookie of hoYo[user]) if (!cookie.timestamp) hoYo[user][hoYo[user].indexOf(cookie)].timestamp = Math.floor(Date.now() / 1000) + 3 * ++i;
                }

                const cookies = Object.values(hoYo)
                    .flat(1)
                    .sort((a, b) => a.timestamp - b.timestamp);

                const next = cookies.shift();
                if (!next) return null;

                const {data} = await axios.get('https://discord.com/api/v8/applications/' + client.user.id + '/commands', {headers: {Authorization: 'Bot ' + client.token}})
                const user = Object.keys(hoYo).find(k => hoYo[k].find(({uid}) => uid === next.uid));
                const user2 = await client.users.fetch(user)
                const idx = hoYo[user].findIndex(c => c.cookie === next.cookie && c.uid === next.uid);
                const date = Date.now();
                if (next.timestamp <= Math.floor(date / 1000)) {
                    const accounts = h.shift();
                    const hoyoUser = new GenshinImpact({
                        uid: next.uid,
                        cookie: next.cookie
                    })

                    try {
                        const x = await hoyoUser.claimDaily()
                        const {data: rewards} = await axios.get('https://sg-hk4e-api.hoyolab.com/event/sol/home?lang=en-us&act_id=e202102251931481')
                        const gs = await rewards?.data?.awards?.[x?.info?.total_sign_day - 1]

                        if (getUserSettings(user)?.notification === true) {
                            client.channels.fetch('1127306304453623898').then((channel) =>
                                channel.send({
                                        // content: '<@' + user + '>',
                                        embeds: [new MessageEmbed()
                                            .setTitle(gs?.name + ' x' + parseInt(gs?.cnt))
                                            .setColor(getUserSettings(user).color)
                                            .setDescription(user2?.username + ' has logged in!\n\n' + x?.status + '\n\nYou have claimed `' + x?.info?.total_sign_day + '` rewards this month!')
                                            .setThumbnail(gs?.icon)
                                            .setFooter({text: next.uid + ' | ' + user})]
                                    },
                                    {
                                        allowedMentions: {
                                            "parse": []
                                        }
                                    }))
                        }

                        hoYo[user][idx].timestamp += 24 * 60 * 60;
                    } catch (e) {
                        if (e.toString() === 'Error: Cookie not valid') {

                            client.users.fetch(user).then((user) =>
                                user.send({
                                    embeds: [new MessageEmbed()
                                        .setTitle('You got forcefully logged out!')
                                        .setThumbnail('https://static.wikia.nocookie.net/logopedia/images/3/33/HoYoLAB_icon_new.png/revision/latest?cb=20220530005712')
                                        .setColor(getUserSettings(user).color)
                                        .setDescription('Your Cookie is not valid, so we decided to remove you from the auto daily login! Use: ' + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '>' + ' and login with a valid cookie\n\nMore Info how to get a valid cookie can be found watching this video: https://youtu.be/AI5bw1uhFPw')]
                                }))

                            delete hoYo[user]
                            jsonSave('./data/hoYo.json', hoYo)
                        }
                        if (e.toString() === 'Error: Failed to retrive daily information: Not logged in') {

                            client.users.fetch(user).then((user) =>
                                user.send({
                                    embeds: [new MessageEmbed()
                                        .setTitle('You got forcefully logged out!')
                                        .setThumbnail('https://static.wikia.nocookie.net/logopedia/images/3/33/HoYoLAB_icon_new.png/revision/latest?cb=20220530005712')
                                        .setColor(getUserSettings(user).color)
                                        .setDescription('Your Cookie is not valid, so we decided to remove you from the auto daily login! Use: ' + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '>' + ' and login with a valid cookie\n\nMore Info how to get a valid cookie can be found watching this video: https://youtu.be/AI5bw1uhFPw')]
                                }))

                            delete hoYo[user]
                            jsonSave('./data/hoYo.json', hoYo)
                        }
                    }
                }
                jsonSave('./data/hoYo.json', hoYo);
            }, 4000);
        }
    }
);

client.on('interactionCreate', async interaction => {
        const hoYoList = jsonParse('./data/hoYo.json', {});
        if (interaction.commandName === 'dailies') {
            const modal = new Modal()
                .setTitle('Register for Hoyolab Log-in Rewards')
                .setCustomId('registerUserModal')
                .setComponents(
                    new MessageActionRow().setComponents(
                        new TextInputComponent()
                            .setLabel('Please enter your UID')
                            .setCustomId('uid')
                            .setStyle(1)
                    ),
                    new MessageActionRow().setComponents(
                        new TextInputComponent()
                            .setLabel('Please Enter your Hoyolab Cookie.')
                            .setCustomId('hoYoCookie')
                            .setStyle(2)
                    )
                );
            interaction.showModal(modal)
        }


        if (interaction.type === 'MODAL_SUBMIT' && interaction.customId === 'registerUserModal') {
            if ((interaction.fields.getTextInputValue('hoYoCookie').includes('ltuid=') && (/^[6-9]/.test(interaction.fields.getTextInputValue('uid').charAt(0))))) {
                await interaction.reply({content: 'Your cookie and UID was successfully received! Cookie validation started! <a:loading:1127784704628764773>'});
                const hoyoUser = new GenshinImpact({
                    cookie: interaction.fields.getTextInputValue('hoYoCookie').replace(/(\r\n|\n|\r)/gm, ''),
                    uid: interaction.fields.getTextInputValue('uid').replace(/(\r\n|\n|\r)/gm, '')
                })
                try {
                    const j = await hoyoUser.claimDaily()
                } catch (e) {
                    if (e.toString().includes('Cookie not valid')) {
                        setTimeout(() => {
                            interaction.deleteReply()
                            interaction.channel.send({
                                content: '<@' + interaction.user.id + '>',
                                embeds: [new MessageEmbed()
                                    .setColor(getUserSettings(interaction.user.id).color)
                                    .setDescription('Your cookie is outdated please log out and log back into hoYoLab before grabbing the cookie!\n\nMore Info can be found watching this video: https://youtu.be/AI5bw1uhFPw')]
                            });
                            return null
                        }, 3500)
                    }
                    if (e.toString().includes('Not logged in')) {
                        setTimeout(() => {
                            interaction.deleteReply()
                            interaction.channel.send({
                                content: '<@' + interaction.user.id + '>',
                                embeds: [new MessageEmbed()
                                    .setColor(getUserSettings(interaction.user.id).color)
                                    .setDescription('Your cookie is outdated please log out and log back into hoYoLab before grabbing the cookie!\n\nMore Info can be found watching this video: https://youtu.be/AI5bw1uhFPw')]
                            });
                            return null
                        }, 3500)
                    }

                }

                const {data: hex} = await axios.get('https://discord.com/api/v8/applications/' + client.user.id + '/commands', {headers: {Authorization: 'Bot ' + client.token}})
                const data3 = jsonParse('./data/dailies.json', {})
                const x = await hoyoUser.claimDaily()
                const euid = interaction.fields.getTextInputValue('uid').replace(/(\r\n|\n|\r)/gm, '')
                const ecookie = interaction.fields.getTextInputValue('hoYoCookie').replace(/(\r\n|\n|\r)/gm, '')
                if (!x.toString().includes('Cookie not valid')) {
                    setTimeout(() => {
                        interaction.deleteReply()
                        if (!hoYoList[interaction.user.id]) hoYoList[interaction.user.id] = [];
                        {
                            if (hoYoList[interaction.user.id].find(i => i.uid === euid)) {
                                interaction.channel.send({content: '<@!' + interaction.user.id + '> Due to an existing entry with this UID, this login attempt was not saved, please use ' + '</' + hex.find(cmd => cmd.name === 'logout').name + ':' + hex.find(cmd => cmd.name === 'logout').id + '>' + ' first before adding the same UID back!'})
                                return null;
                            } else {
                                hoYoList[interaction.user.id].push({
                                    uid: euid,
                                    cookie: ecookie
                                });
                                jsonSave('./data/hoYo.json', hoYoList);
                            }
                        }

                        interaction.channel.send({
                            content: '<@!' + interaction.user.id + '>',
                            embeds: [new MessageEmbed()
                                .setTitle(x?.reward?.name + ' x' + parseInt(x?.reward?.cnt))
                                .setColor(getUserSettings(interaction.user.id).color)
                                .setDescription(x?.status + '\n\nYou have claimed `' + x?.info?.total_sign_day + '` rewards this month!')
                                .setThumbnail(x?.reward?.icon).setFooter({text: 'UID: ' + hoyoUser?.uid})
                            ]
                        })
                    }, 10000)
                }

            } else {
                await interaction.reply({content: 'Your cookie is invalid! Please watch this video fully to understand how to obtain you proper HoYoLab Cookie: https://youtu.be/AI5bw1uhFPw'})
            }
        }

        if (!(interaction instanceof CommandInteraction) && !(interaction instanceof UserContextMenuInteraction)) return null;
        if (client.config.TEST_GUILD && interaction.guildId !== client.config.TEST_GUILD) return null;
        try {
            const cmd = client.commands.get(interaction.commandName);
            if (cmd?.filter(interaction)) {
                await interaction.deferReply();
                ++client.usedCommands;

                cmd.execute(interaction)
                    .catch(e => {
                        console.error(e.stack);
                        interaction.editReply({
                            embeds: [{
                                title: translate(':warning: There was an error', interaction.locale),
                                color: 0xE0B024,
                                description: e.toLocaleString(interaction.locale)?.substr(0, 2048)
                                    ?? translate('Unknown error', interaction.locale),
                                fields: client.config.TEST_GUILD ? [{
                                    name: 'Stack',
                                    value: e.stack.toString().substr(0, 2048)
                                }] : [],
                                footer: {text: 'Please retry using the command! - ' + interaction.locale}
                            }]
                        });
                    });
            } else {
                await interaction.deferReply();
                interaction.editReply({
                    embeds: [{
                        title: translate(':warning: There was an error', interaction.locale),
                        color: 0xE0B024,
                        description: translate('The command has been disabled for public use. Once the the command has been fixed it will be re-enabled for public usage.', interaction.locale)
                    }]
                });
            }
        } catch (ignored) {
        }
    }
);

client.on('debug', debug => {
    return null;
    if (debug.toString().toLowerCase().includes('heartbeat')) return null;
    console.log(debug);
});

process.on('uncaughtException', e => console.log(e));

client.login(client.config.DISCORD_TOKEN);