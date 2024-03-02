const {MessageEmbed} = require('discord.js');
const {getUserSettings, jsonParse, translate} = require('../util');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');
const axios = require('axios');

const name = 'checkin';
const description = 'Manual HoYoLab Daily login'
const filter = () => true;
const options = [];

async function execute(interaction) {
    // interaction.editReply('Daily Check-ins are no longer supported! More info: https://youtu.be/MwGcZL91xpU')

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
        const x = await hoyoUser.claimDaily()
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

    const x = await hoyoUser.claimDaily()

    const gs = rewards?.data?.awards?.[x?.info?.total_sign_day -1]
    if (getUserSettings(interaction.user.id).notification === true) {
        interaction.editReply({
            embeds: [new MessageEmbed()
                .setTitle(gs?.name + ' x' + parseInt(gs?.cnt))
                .setColor(getUserSettings(interaction.user.id).color)
                .setDescription(x?.status + '\n\nYou have claimed `' + x?.info?.total_sign_day + '` rewards this month!')
                .setThumbnail(gs?.icon)
                .addField('Next Autologin time', '<t:' + hoYo[interaction.user.id][0]?.timestamp + ':R>' + ' - <t:' + hoYo[interaction.user.id][0]?.timestamp + ':f>',false)
                .setFooter({text: Object.values(hoYo[interaction.user.id])[0]?.uid})]
        })
    }

}

module.exports = {name, description, options, filter, execute};