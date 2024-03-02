const { MessageEmbed } = require('discord.js');
const { getUserSettings, translate } = require('../util');

const name = 'ping';
const description = 'Calculates the response to Discord API.';
const filter = () => true;
const options = [];

async function execute(interaction){
    const reply = await interaction.fetchReply();

    const userMs = interaction.createdTimestamp;
    const botMs = reply.createdTimestamp;

    const wsPing = interaction.client.ws.ping;

    const embed = new MessageEmbed()
        .setColor(getUserSettings(interaction.user.id).color)
        .setDescription(
            translate('Discord API Latency is **{0}ms**.', interaction.locale)
                .replace('{0}', (botMs - userMs).toLocaleString(interaction.locale)) + '\n' +
            translate('Discord Gateway Latency is **{0}ms**.', interaction.locale)
                .replace('{0}', wsPing.toLocaleString(interaction.locale))
        );
    return interaction.editReply({ embeds: [embed] });
}

module.exports = { name, description, options, filter, execute };