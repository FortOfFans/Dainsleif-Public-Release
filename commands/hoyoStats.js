const {MessageEmbed, MessageButton, MessageActionRow,} = require('discord.js');
const {getUserSettings, jsonParse, jsonSave, translate, ambrApi} = require('../util');
const {GenshinImpact} = require('hoyoapi');
const axios = require('axios')

const name = 'hoyostats';
const description = translate('Look up hoYoLab stats here!');
const filter = () => true;
const options = [
    {
        type: 6, //str
        name: translate('user'),
        description: translate('The user\'s hoYoStats to look at.'),
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

    if (!hoYo[interaction.user.id] && !user) {
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

    const userl = Object.values(hoYo[interaction.user.id])
    const h = Object.entries(hoYo)
    const hoyoUser = new GenshinImpact({
        uid: userl[0]?.uid,
        cookie: userl[0]?.cookie
    })


    const x = await hoyoUser.records()

    const region = {
        os_euro: 'Europe',
        os_asia: 'Asia',
        os_usa: 'America',
        os_cht: 'China'
    }

    const embed = new MessageEmbed()
        .setTitle('AR ' + x?.role?.level.toString() + ' | ' + x?.role?.nickname.replace(/ㅤ/gi, ''))
        .setColor(getUserSettings(interaction.user.id).color)
        .setDescription(
            '**Days Active: **' + x?.stats?.active_day_number.toString() + '\n' +
            '**Region: **' + region[x?.role?.region] + '\n' +
            '** Achievements: **' + x?.stats?.achievement_number.toString() + '\n' +
            '** Characters: **' + x?.stats?.avatar_number.toString() + '\n')
        .addField(
            'Oculi', '<:UI_ItemIcon_107001:989400329894383666> ' + x?.stats?.anemoculus_number.toString() +
            '\n<:UI_ItemIcon_107003:989400331995729950> ' + x?.stats?.geoculus_number.toString() +
            '\n<:UI_ItemIcon_107014:989400336101941268> ' + x?.stats?.electroculus_number.toString() +
            '\n<:UI_ItemIcon_107017:1014163010677374976> ' + x?.stats?.dendroculus_number.toString(), true)
        .addField('Chests',
            '**Common: **' + x?.stats?.common_chest_number.toString() + '\n' +
            '**Exquisite: **' + x?.stats?.exquisite_chest_number.toString() + '\n' +
            '**Precious: **' + x?.stats?.precious_chest_number.toString() + '\n' +
            '**Luxurious: **' + x?.stats?.luxurious_chest_number.toString() + '\n' +
            '**Remarkable: **' + x?.stats?.magic_chest_number.toString(), true)

    await interaction.editReply({embeds: [embed]})

}

module.exports = {name, description, options, filter, execute};