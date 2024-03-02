const {MessageEmbed, MessageButton, MessageActionRow,} = require('discord.js');
const {getUserSettings, jsonParse, jsonSave, translate, ambrApi} = require('../util');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');
const axios = require('axios')

const name = 'schedule';
const description = translate('Check your Genshin Schedule here!');
const filter = () => true;
const options = [
    {
        type: 6, //str
        name: translate('user'),
        description: translate('The user\'s schedule to look at.'),
        required: false
    },
    {
        type: 4, //str
        name: translate('account'),
        description: translate('The account entry.'),
        required: false
    }];

async function execute(interaction) {
    const {data} = await axios.get('https://discord.com/api/v8/applications/' + interaction.client.user.id + '/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})

    const {items} = await ambrApi('/avatar', interaction.locale);

    let user
    if (interaction.options.getUser('user')) user = interaction.options.getUser('user').id

    let user2 = interaction.user.id

    let acc
    if (interaction.options.getInteger('account')) acc = interaction.options.getInteger('account')


    const hoYo = jsonParse('./data/hoYo.json', {})

    if (!hoYo[user2] && !user) {
        return interaction.editReply({
            embeds: [new MessageEmbed().setDescription('You are not in the database! Use '
                + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '> to link your hoYoLab Account with the bot!')]
        })
    }

    if (user && !hoYo[user]) {
        return interaction.editReply({
            embeds: [new MessageEmbed().setDescription('<@' + user + '> is not in the database!' + ' <@' + user + '> should use '
                + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '> to link your hoYoLab Account with the bot!')]
        })
    }

    const emojiMap = jsonParse('./data/emojis/characterIdEmojis.json', {});
    if (hoYo[user]) {
        const hoyoUser = new GenshinImpact({
            uid: hoYo?.[user]?.[(acc || 0)]?.uid,
            cookie: hoYo?.[user]?.[(acc || 0)]?.cookie
        })

        const x = await hoyoUser.getDailyResources()

        const row = new MessageActionRow()
        const btn = new MessageButton()
            .setCustomId('80')
            .setLabel('80')
            .setEmoji('1126792927792873532')
            .setStyle('SECONDARY');
        const btn2 = new MessageButton()
            .setCustomId('remind')
            .setLabel('160')
            .setEmoji('1126792927792873532')
            .setStyle('SECONDARY');
        row.addComponents(btn, btn2);

        const embed = new MessageEmbed()
            .setTitle((interaction.options.getUser('user').username + ' \'s' ?? 'Your') + ' Genshin Schedule')
            .setColor(getUserSettings(user).color)
            .setThumbnail('https://cdn.discordapp.com/avatars/' + (interaction.options.getUser('user').id) + '/' + interaction.options.getUser('user').avatar + '.png')
            .setDescription(translate('**Current Resin:** ', interaction.locale) + ('<:CharacterResin:1126792927792873532> {0} / 160').replace('{0}', x?.current_resin)
                + '\n<:CharacterResin:1126792927792873532> 80: ' + '<t:' + (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time) - (8 * 60 * 80)) + ':R>'
                + '\n' + '<:CharacterResin:1126792927792873532> ' + x?.max_resin + ': ' + '<t:' + (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)) + ':R>'
                + '\n' + '<:UI_ItemIcon_204:1082258089908113479> ' + translate('**Current Realm Currency:** {0} / {0}', interaction.locale)
                    .replace('{0}', x?.current_home_coin).replace('{0}', x?.max_home_coin)
                + '\n' + '<:UI_ItemIcon_220021:1082290408874328144> ' + translate('**Current Parametric Transformer:** ', interaction.locale) + translate('{0}d {0}h', interaction.locale).replace('{0}', x?.transformer?.recovery_time?.Day).replace('{0}', x?.transformer?.recovery_time?.Hour))

        let ec = 1
        for (const [a, b] of Object.entries(x?.expeditions)) {

            const rt = '<t:' + (Math.round(Date.now() / 1000) + parseInt(b?.remained_time)) + ':R>'

            embed.addField('Expedition: Nr.' + ec, translate('returns:', interaction.locale) + ' ' + rt, false)
            ec += 1
        }

        embed.addField('Remove Reminders?', 'Use ' + '</' + data.find(cmd => cmd.name === 'reminders').name + ':' + data.find(cmd => cmd.name === 'reminders').id + '>' + ' with the appropriate entry number to remove it.', false)


        if (x?.expeditions?.find(e => e.status === 'Ongoing')) {
            const exp = x?.expeditions.sort((a, b) => parseInt(a.remained_time) - parseInt(b.remained_time));
            const groups = [];
            let last = parseInt(exp[0].remained_time);
            let group = [];
            for (const e of exp) {
                if (parseInt(e.remained_time) <= last + 60 * 10) group.push(e);
                else {
                    groups.push(group);
                    group = [];
                }
                last = parseInt(e.remained_time);
            }
            groups.push(group);

            let t1;
            if (Object.entries(groups?.[0]?.[0])) t1 = parseInt(Object.entries(groups?.[0]?.[0])?.[2]?.[1]);

            let t2;
            if (Object.entries(groups?.[1]?.[0])) t2 = parseInt(Object.entries(groups?.[1]?.[0])?.[2]?.[1]);

            if ((t1) || (t1 !== 0)) {
                const exbtn = new MessageButton()
                    .setCustomId('exp1')
                    .setLabel('Early Expeditions')
                    .setEmoji('1090518367305211935')
                    .setStyle('SECONDARY');
                row.addComponents(exbtn);
            }
            if ((t2) || (t2 !== 0)) {
                const ex2btn = new MessageButton()
                    .setCustomId('exp2')
                    .setLabel('Late Expeditions')
                    .setEmoji('1090518367305211935')
                    .setStyle('SECONDARY');
                row.addComponents(ex2btn);
            }


            await interaction.editReply(
                {
                    embeds:
                        [embed],
                    components: [row]
                })

            const filter = i => ['80', 'remind', 'exp1', 'exp2'].includes(i.customId) && user === i.user.id;

            const collector = interaction.channel.createMessageComponentCollector({filter, time: 300000})

            collector.on('collect', async i => {
                await i.deferUpdate().catch(() => {
                });
                const reminders = jsonParse('./data/reminders.json', []);

                switch (i.customId) {
                    case '80':
                        reminders.push({
                            message: translate('Your resin amount has reached {0}.', interaction.locale)
                                .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                    + (parseInt(x?.max_resin) - 80).toString()),
                            timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)) - (80 * (8 * 60)),
                            user: user2
                        });
                        break;
                    case 'remind':
                        reminders.push({
                            message: translate('Your resin amount has reached {0}.', interaction.locale)
                                .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                    + x?.max_resin),
                            timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)),
                            user: user2
                        });
                        break;
                    case 'exp1':
                        reminders.push({
                            message: translate('Your expedition returns in 10 minutes.', interaction.locale),
                            timestamp: (Math.round(Date.now() / 1000) + t1 - 10 * 60),
                            user: user2
                        });
                        break;
                    case 'exp2':
                        reminders.push({
                            message: translate('Your expedition returns in 10 minutes.', interaction.locale),
                            timestamp: (Math.round(Date.now() / 1000) + t2 - 10 * 60),
                            user: user2
                        })
                        break;
                }

                jsonSave('./data/reminders.json', reminders);


                if (i.customId === '80') row.components[0].setDisabled(true)
                if (i.customId === 'remind') row.components[1].setDisabled(true)
                if (i.customId === 'exp1') row.components[2].setDisabled(true)
                if (i.customId === 'exp2' && t1 === 0) row.components[2].setDisabled(true)
                if (i.customId === 'exp2' && t1 !== 0) row.components[3].setDisabled(true)
                await interaction.editReply({components: [row]})
            })

        }
    else {
            await interaction.editReply(
                {
                    embeds:
                        [embed],
                    components: [row]
                })

            const filter = i => i.customId === 'remind' && user === i.user.id;

            const collector = interaction.channel.createMessageComponentCollector({filter, time: 300000})

            collector.on('collect', async i => {
                await i.deferUpdate().catch(() => {
                });

                if (i.customId !== ['80', 'remind']) {return null;}
                else {
                    const reminders = jsonParse('./data/reminders.json', []);
                    switch (i.customId) {
                        case '80':
                            reminders.push({
                                message: translate('Your resin amount has reached {0}.', interaction.locale)
                                    .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                        + (parseInt(x?.max_resin) - 80).toString()),
                                timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)) - (80 * (8 * 60)),
                                user: user
                            });
                            break;
                        case 'remind':
                            reminders.push({
                                message: translate('Your resin amount has reached {0}.', interaction.locale)
                                    .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                        + x?.max_resin) + '\n',
                                timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)),
                                user: user
                            });
                            break;
                    }

                    jsonSave('./data/reminders.json', reminders);

                    row.components[0].setDisabled(true)
                    await interaction.editReply({components: [row]})

                }});
        }
    } else if (hoYo[user2]) {
        const hoYo = jsonParse('./data/hoYo.json', {})
        const hoyoUser = new GenshinImpact({
            uid: hoYo?.[(user ?? user2)]?.[(acc || 0)]?.uid,
            cookie: hoYo?.[(user ?? user2)]?.[(acc || 0)]?.cookie
        })

        const x = await hoyoUser.getDailyResources()

        const row = new MessageActionRow()
        const btn = new MessageButton()
            .setCustomId('80')
            .setLabel('80')
            .setEmoji('1126792927792873532')
            .setStyle('SECONDARY');
        const btn2 = new MessageButton()
            .setCustomId('remind')
            .setLabel('160')
            .setEmoji('1126792927792873532')
            .setStyle('SECONDARY');
        row.addComponents(btn, btn2);

        const embed = new MessageEmbed()
            .setTitle('Your Genshin Schedule')
            .setColor(getUserSettings(user2).color)
            .setDescription(translate('**Current Resin:** ', interaction.locale) + ('<:CharacterResin:1126792927792873532> {0} / 160').replace('{0}', x?.current_resin)
                + '\n<:CharacterResin:1126792927792873532> 80: ' + '<t:' + (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time) - (8 * 60 * 80)) + ':R>'
                + '\n' + '<:CharacterResin:1126792927792873532> ' + x?.max_resin + ': ' + '<t:' + (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)) + ':R>'
                + '\n' + '<:UI_ItemIcon_204:1082258089908113479> ' + translate('**Current Realm Currency:** {0} / {0}', interaction.locale)
                    .replace('{0}', x?.current_home_coin).replace('{0}', x?.max_home_coin)
                + '\n' + '<:UI_ItemIcon_220021:1082290408874328144> ' + translate('**Current Parametric Transformer:** ', interaction.locale)
                + translate('{0}d {0}h', interaction.locale).replace('{0}', x?.transformer?.recovery_time?.Day).replace('{0}', x?.transformer?.recovery_time?.Hour))

        let ec = 1
        for (const [a, b] of Object.entries(x?.expeditions)) {

            const rt = '<t:' + (Math.round(Date.now() / 1000) + parseInt(b?.remained_time)) + ':R>'

            embed.addField('Expedition: Nr.' + ec, translate('returns:', interaction.locale) + ' ' + rt, false)
            ec += 1
        }
        embed.addField('Remove Reminders?', 'Use ' + '</' + data.find(cmd => cmd.name === 'reminders').name + ':' + data.find(cmd => cmd.name === 'reminders').id + '>' + ' with the appropriate entry number to remove it.', false)

        if (x?.expeditions?.find(e => e.status === 'Ongoing')) {
            const exp = x?.expeditions.sort((a, b) => parseInt(a.remained_time) - parseInt(b.remained_time));
            const groups = [];
            let last = parseInt(exp[0].remained_time);
            let group = [];
            for (const e of exp) {
                if (!(parseInt(e.remained_time) <= last + 60 * 10)) {
                    groups.push(group);
                    group = [];
                }
                group.push(e);
                last = parseInt(e.remained_time);
            }
            groups.push(group);

            let t1;
            if (Object.entries(groups?.[0]?.[0])) t1 = parseInt(Object.entries(groups?.[0]?.[0])?.[2]?.[1]);

            let t2;
            if (Object.entries(groups?.[1]?.[0])) t2 = parseInt(Object.entries(groups?.[1]?.[0])?.[2]?.[1]);

            if ((t1) || (t1 !== 0)) {
                const exbtn = new MessageButton()
                    .setCustomId('exp1')
                    .setLabel('Early Expeditions')
                    .setEmoji('1090518367305211935')
                    .setStyle('SECONDARY');
                row.addComponents(exbtn);
            }
            if ((t2) || (t2 !== 0)) {
                const ex2btn = new MessageButton()
                    .setCustomId('exp2')
                    .setLabel('Late Expeditions')
                    .setEmoji('1090518367305211935')
                    .setStyle('SECONDARY');
                row.addComponents(ex2btn);
            }

            await interaction.editReply(
                {
                    embeds:
                        [embed],
                    components: [row]
                })

            const filter = i => ['80', 'remind', 'exp1', 'exp2'].includes(i.customId) && user2 === i.user.id;

            const collector = interaction.channel.createMessageComponentCollector({filter, time: 300000})

            collector.on('collect', async i => {
                await i.deferUpdate().catch(() => {
                });
                const reminders = jsonParse('./data/reminders.json', []);
                switch (i.customId) {
                    case '80':
                        reminders.push({
                            message: translate('Your resin amount has reached {0}.', interaction.locale)
                                .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                    + (parseInt(x?.max_resin) - 80).toString()),
                            timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)) - (80 * (8 * 60)),
                            user: user2
                        });
                        break;
                    case 'remind':
                        reminders.push({
                            message: translate('Your resin amount has reached {0}.', interaction.locale)
                                .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                    + x?.max_resin),
                            timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)),
                            user: user2
                        });
                        break;
                    case 'exp1':
                        reminders.push({
                            message: translate('Your expedition returns in 10 minutes.', interaction.locale),
                            timestamp: (Math.round(Date.now() / 1000) + t1 - 10 * 60),
                            user: user2
                        });
                        break;
                    case 'exp2':
                        reminders.push({
                            message: translate('Your expedition returns in 10 minutes.', interaction.locale),
                            timestamp: (Math.round(Date.now() / 1000) + t2 - 10 * 60),
                            user: user2
                        })
                        break;
                }
                jsonSave('./data/reminders.json', reminders);


                if (i.customId === '80') row.components[0].setDisabled(true)
                if (i.customId === 'remind') row.components[1].setDisabled(true)
                if (i.customId === 'exp1') row.components[2].setDisabled(true)
                if (i.customId === 'exp2' && t1 === 0) row.components[2].setDisabled(true)
                if (i.customId === 'exp2' && t1 !== 0) row.components[3].setDisabled(true)
                await interaction.editReply({components: [row]})
            })

        } else {
            await interaction.editReply(
                {
                    embeds:
                        [embed],
                    components: [row]
                })

            const filter = i => i.customId === 'remind' && user2 === i.user.id;

            const collector = interaction.channel.createMessageComponentCollector({filter, time: 300000})

            collector.on('collect', async i => {
                await i.deferUpdate().catch(() => {
                });

                if (i.customId !== ['80', 'remind']) {return null;}
                else {
                    const reminders = jsonParse('./data/reminders.json', []);
                    switch (i.customId) {
                        case '80':
                            reminders.push({
                                message: translate('Your resin amount has reached {0}.', interaction.locale)
                                    .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                        + (parseInt(x?.max_resin) - 80).toString()),
                                timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)) - (80 * (8 * 60)),
                                user: user
                            });
                            break;
                        case 'remind':
                            reminders.push({
                                message: translate('Your resin amount has reached {0}.', interaction.locale)
                                    .replace('{0}', '<:CharacterResin:1126792927792873532> '
                                        + x?.max_resin) + '\n',
                                timestamp: (Math.round(Date.now() / 1000) + parseInt(x?.resin_recovery_time)),
                                user: user
                            });
                            break;
                    }

                    jsonSave('./data/reminders.json', reminders);

                    row.components[0].setDisabled(true)
                    await interaction.editReply({components: [row]})

                } });
        }
    } else {
        await interaction.editReply(
            {
                embeds:
                    [new MessageEmbed()
                        .setDescription('You and the mentioned user are not linked to the bot yet, use: ' + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '> to link your hoYoLab Account with the bot!')]
            })
    }
}

module.exports = {name, description, options, filter, execute};