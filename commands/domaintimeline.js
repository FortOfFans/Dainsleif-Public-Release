const { MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const { getUserSettings, translate, jsonParse } = require('../util');

const name = translate('domaintimeline');
const description = translate('Shows which domains are available on a specific day.');
const filter = () => true;
const options = [];

async function execute(interaction){
    const row = new MessageActionRow();
    for (const day of ['Monday/Thursday', 'Tuesday/Friday', 'Wednesday/Saturday', 'Sunday']){
        const btn = new MessageButton()
            .setStyle('PRIMARY')
            .setLabel(translate(day, interaction.locale))
            .setCustomId(day[0]);
        row.addComponents(btn);
    }

    const bMsg = await interaction.editReply({ content: translate('Please choose a day', interaction.locale),
        components: [row]});
    const filter = press => press.user.id === interaction.user.id;
    const time = 10 * 60 * 1000;

    const btnPress = await bMsg.awaitMessageComponent({ filter, time }).catch(() => {});
    await btnPress.deferUpdate();
    const day = btnPress.customId;

    const dayName = {
        M: translate('Monday/Thursday', interaction.locale),
        T: translate('Tuesday/Friday', interaction.locale),
        W: translate('Wednesday/Saturday', interaction.locale),
        S: translate('Sunday', interaction.locale)
    }

    const data = jsonParse('./data/domainData.json', {});

    const embed = new MessageEmbed()
        .setColor(getUserSettings(interaction.user.id).color)
        .setTitle(translate('{0} Domains', interaction.locale).replace('{0}', dayName[day]));

    for (const region of Object.keys(data)){
        for (const domainType of [...Object.keys(data[region]), '']){
            if (!domainType) embed.addField('** **', '** **', true);
            else embed.addField(translate(region + ' ' + domainType, interaction.locale),
                data[region][domainType].emojis[day] + ' ' + data[region][domainType][day], true);
        }
    }

    return interaction.editReply({ content: null, embeds: [embed], components: [] });
}

module.exports = { name, description, options, filter, execute };