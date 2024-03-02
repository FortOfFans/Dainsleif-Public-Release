const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const {getUserSettings, jsonParse, translate} = require('../util');
const fs = require('fs');

const name = translate('info');
const description = translate('Displays information about the bot.');
const filter = () => true;
const options = [];

async function execute(interaction) {
    const str = str => translate(str, interaction.locale);
    const guilds = (await interaction.client.shard?.fetchClientValues?.('guilds.cache.size')?.reduce?.((p, c) => p + c, 0)) ?? -1;
    const guildMembers = (await interaction.client.shard?.broadcastEval?.(client => client.guilds.cache.reduce((t, g) => t + g.memberCount, 0))) ?? -1;
    const users = (await interaction.client.shard?.fetchClientValues?.('users.cache.size')?.reduce?.((p, c) => p + c, 0)) ?? -1;


    let rest = Math.floor((Date.now() - interaction.client.readyTimestamp) / 1000);

    const d = Math.floor(rest / (60 * 60 * 24));
    rest -= d * (60 * 60 * 24);

    const h = Math.floor(rest / (60 * 60));
    rest -= h * (60 * 60);

    const m = Math.floor(rest / 60);
    rest -= m * 60;

    const s = rest;

    const days = d.toLocaleString(interaction.locale);
    const hours = h.toLocaleString(interaction.locale);
    const minutes = m.toLocaleString(interaction.locale);
    const seconds = s.toLocaleString(interaction.locale);

    const uptime = d ? str('{0}d {0}h {0}m {0}s').replace('{0}', days).replace('{0}', hours).replace('{0}', minutes).replace('{0}', seconds)
        : h ? str('{0}h {0}m {0}s').replace('{0}', hours).replace('{0}', minutes).replace('{0}', seconds)
            : m ? str('{0}m {0}s').replace('{0}', minutes).replace('{0}', seconds)
                : str('{0}s').replace('{0}', seconds);


    const dirPath = './data/users'
    let i = 0
    for (const file of fs.readdirSync(dirPath)) {
        if (fs.readFileSync(dirPath + '/' + file).toString().includes('"premium": true')) i++
    }

    const pr = Object.keys(jsonParse('./data/linked.json', {})).length

    const hoYo = jsonParse('./data/hoYo.json', {})
    const embed = new MessageEmbed()
        .setTitle(str('Information about {0}').replace('{0}', interaction.client.user.username))
        .setColor(getUserSettings(interaction.user.id).color)
        .addField(str('Servers'), '<:server:1083335723748442162> ' + interaction.client.guilds.cache.size.toLocaleString(interaction.locale), true)
        .addField(str('Linked Users'), '📎 ' + (pr).toLocaleString(interaction.locale), true)
        .addField(str('Premium Users'), '<:Kofi:995697923348254811> ' + i.toLocaleString(interaction.locale), true)
        .addField(str('Cached Users'), '📂 ' + interaction.client.users.cache.size.toLocaleString(interaction.locale), true)
        .addField(str('Uptime'),'⏱️' + uptime, true)
        .addField(str('Commands Used'), '📝 ' + interaction.client.usedCommands.toLocaleString(interaction.locale), true)
        .addField(str('HoYoLab claims'), '<:hoyo:1083331208701804584> ' +Object.entries(hoYo).length.toString() + ' ' + str('Accounts'));

    const btns = new MessageActionRow();
    const inviteBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel(translate('Invite Me', interaction.locale))
        .setEmoji('📨')
        .setURL('https://discord.com/api/oauth2/authorize?client_id=' + interaction.client.user.id + '&permissions=201713728&scope=bot%20applications.commands');
    const serverBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel(translate('Support Server', interaction.locale))
        .setURL('https://discord.gg/XR7jtxEb3e');
    const ppBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel(translate('Paypal', interaction.locale))
        .setURL('https://paypal.me/z4bakedpotato');
    const kofiBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel(translate('Ko-fi', interaction.locale))
        .setURL('https://ko-fi.com/s/f5577100b8');

    btns.addComponents(inviteBtn, serverBtn,ppBtn,kofiBtn);

    return interaction.editReply({embeds: [embed], components: [btns]});
}

module.exports = {name, description, options, filter, execute};