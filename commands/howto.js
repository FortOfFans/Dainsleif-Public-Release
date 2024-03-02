const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const {getUserSettings, jsonParse, translate} = require('../util');
const fs = require('fs');

const name = 'howto';
const description = 'How to Set up the daily login!';
const filter = () => true;
const options = [];

async function execute(interaction) {
    const hoYo = jsonParse('./data/hoYo.json', {})

    const embed = new MessageEmbed()
        .setTitle('Information about Daily Logins')
        .setColor(getUserSettings(interaction.user.id).color)
        .setDescription('Click the botton to find out how to set up the daily login')
        .addField('Logged in Accounts:', '<:hoyo:1083331208701804584> ' + Object.entries(hoYo).length.toString() + ' Logged in Accounts');;

    const btns = new MessageActionRow();
    const inviteBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel('Tutorial Video')
        .setEmoji('1128540144975228948')
        .setURL('https://youtu.be/AI5bw1uhFPw');
    const script = new MessageButton()
        .setStyle('LINK')
        .setLabel('Cookie Script')
        .setEmoji('🍪')
        .setURL('https://raw.githubusercontent.com/FortOfFans/Dainsleif-TOS/main/script.txt');
    const script2 = new MessageButton()
        .setStyle('LINK')
        .setLabel('Alternative Script')
        .setEmoji('🍪')
        .setURL('https://github.com/FortOfFans/Dainsleif-TOS/blob/main/script.txt');

    btns.addComponents(inviteBtn, script, script2);

    return interaction.editReply({embeds: [embed], components: [btns]});
}

module.exports = {name, description, options, filter, execute};