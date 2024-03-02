const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { getUserSettings, translate } = require('../util');

const name = translate('invite');
const description = translate('Gives links for the bot.');
const filter = () => true;
const options = [];

async function execute(interaction){
    const embed = new MessageEmbed()
        .setTitle(interaction.client.user.username)
        .setColor(interaction.client.config.COLOR ?? getUserSettings(interaction.user.id).color)
        .setThumbnail(interaction.client.user.avatarURL())
        .setDescription(translate('Here are some links to invite me or join my support server.', interaction.locale));

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

    btns.addComponents(inviteBtn, serverBtn);

    return interaction.editReply({ embeds: [embed], components: [btns] });
}

module.exports = { name, description, options, filter, execute };