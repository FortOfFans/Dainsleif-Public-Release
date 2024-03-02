const {MessageEmbed} = require('discord.js');
const {getUserSettings, jsonParse, translate} = require('../util');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');
const axios = require('axios');

const name = 'redeemcode';
const description = 'Manual HoYoLab Daily login'
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('code'),
        description: translate('The code to redeem.'),
        required: true
    }
    ];

async function execute(interaction) {

    const {data: hex} = await axios.get('https://discord.com/api/v8/applications/' + interaction.client.user.id + '/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})

    const {data: rewards} = await axios.get('https://sg-hk4e-api.hoyolab.com/event/sol/home?lang=en-us&act_id=e202102251931481')
    const hoYo = jsonParse('./data/hoYo.json', {})

    if (!hoYo[interaction.user.id]) {
        return interaction.editReply('Please register for auto daily logins by using: ' + '</' + hex.find(cmd => cmd.name === 'dailies').name + ':' + hex.find(cmd => cmd.name === 'dailies').id + '>');
        return null;
    }
    if (!hoYo[interaction.user.id][0]?.cookie) {
        return interaction.editReply('Please register for auto daily logins by using: ' + '</' + hex.find(cmd => cmd.name === 'dailies').name + ':' + hex.find(cmd => cmd.name === 'dailies').id + '>');
        return null;
    }

    if (!hoYo[interaction.user.id][0]?.uid) {
        return interaction.editReply('Please register for auto daily logins by using: ' + '</' + hex.find(cmd => cmd.name === 'dailies').name + ':' + hex.find(cmd => cmd.name === 'dailies').id + '>');
        return null;
    }

    const user = Object.values(hoYo[interaction.user.id])
    const h = Object.entries(hoYo)
    const hoyoUser = new GenshinImpact({
        uid: user[0]?.uid,
        cookie: user[0]?.cookie
    })
    try {
        const x = await hoyoUser.redeem(interaction.options.getString('code'))
    }
    catch (e) {
        if (e.toString().includes('Cookie not valid')) {
            setTimeout(() => {
                interaction.deleteReply()
                interaction.channel.send({
                    content: '<@' + interaction.user.id + '>',
                    embeds: [new MessageEmbed()
                        .setColor(getUserSettings(interaction.user.id).color)
                        .setDescription('Your cookie is outdated please log out and log back into hoYoLab before grabbing the cookie!\n\nMore Info can be found watching this video: https://youtu.be/weTKpQfD7MI')]
                });
                return null
            }, 1500)
        }
        if (e.toString().includes('Not logged in')) {
            setTimeout(() => {
                interaction.deleteReply()
                interaction.channel.send({
                    content: '<@' + interaction.user.id + '>',
                    embeds: [new MessageEmbed()
                        .setColor(getUserSettings(interaction.user.id).color)
                        .setDescription('Your cookie is outdated please log out and log back into hoYoLab before grabbing the cookie!\n\nMore Info can be found watching this video: https://youtu.be/weTKpQfD7MI')]
                });
                return null
            }, 1500)
        }
        if (e.toString().includes('Cookie key ltuid or ltoken')) {
            setTimeout(() => {
                interaction.deleteReply()
                interaction.channel.send({
                    content: '<@' + interaction.user.id + '>',
                    embeds: [new MessageEmbed()
                        .setColor(getUserSettings(interaction.user.id).color)
                        .setDescription('Your cookie is outdated please log out and log back into hoYoLab before grabbing the cookie!\n\nMore Info can be found watching this video: https://youtu.be/weTKpQfD7MI')]
                });
                return null
            }, 1500)
        }

    }

    const x = await hoyoUser.redeem(interaction.options.getString('code'))


    const gs = rewards?.data?.awards?.[x?.info?.total_sign_day -1]
    if (getUserSettings(interaction.user.id).notification === true) {
        interaction.editReply({
            embeds: [new MessageEmbed()
                .setTitle('Code redeemed for:')
                .setThumbnail('https://static.wikia.nocookie.net/logopedia/images/3/33/HoYoLAB_icon_new.png/revision/latest?cb=20220530005712')
                .setColor(getUserSettings(interaction?.user?.id).color)
                .setDescription('`' + interaction.options.getString('code') + '`\n' + x?.message)
                .setFooter({text: 'UID: ' + hoyoUser?.uid})]
        })
    }

}

module.exports = {name, description, options, filter, execute};