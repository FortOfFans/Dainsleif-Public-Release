const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const {jsonParse, jsonSave, translate} = require('../util');

const name = 'logout';
const description = translate('Logout from hoYolab Daily Login & redeem codes for you!');
const filter = () => true;

async function execute(interaction) {
    const hoYo = jsonParse('./data/hoYo.json', {})

    if (!hoYo[interaction.user.id]) throw translate('You are not in the database!', interaction.locale)

    const row = new MessageActionRow();
    const confirmEmbed = new MessageEmbed()
        .setColor(0xFF5555)
        .setDescription(translate('Are you sure you want to stop claiming {0} hoYoLab daily Login rewards for **{0}**?',
            interaction.locale).replace('{0}', '<:hoyo:1083331208701804584>').replace('{0}', hoYo[interaction.user.id]?.[0]?.uid));

    const btn = new MessageButton()
        .setStyle('SUCCESS')
        .setLabel(translate('Confirm', interaction.locale))
        .setEmoji('✅')
        .setCustomId('confirm');
    const btn2 = new MessageButton()
        .setStyle('SECONDARY')
        .setLabel(translate('Cancel', interaction.locale))
        .setEmoji('❌')
        .setCustomId('deny');
    row.addComponents(btn, btn2);

    const bMsg = await interaction.editReply({
        content: 'Daily Check-ins are no longer supported! More info: https://youtu.be/MwGcZL91xpU',
        embeds: [confirmEmbed],
        components: [row]
    });
    const filter = i => i.user.id === interaction.user.id;
    const time = 10 * 60 * 1000;
    const max = 1;
    const btnPress = await bMsg.awaitMessageComponent({filter, time, max});

    await btnPress.deferUpdate();
    if (btnPress.customId === 'deny') return interaction.editReply({
        content: translate('Cancelled ' +
            'unlinking.', interaction.locale), embeds: [], components: []
    });

    delete hoYo[interaction.user.id]
    jsonSave('./data/hoYo.json', hoYo)
    const embed = new MessageEmbed()
        .setColor(0x55FF55)
        .setDescription('✅ ' + translate('Successfully unenrolled from {0} auto daily claiming.', interaction.locale).replace('{0}', '<:hoyo:1083331208701804584>'));

    return interaction.editReply({
        content: 'Daily Check-ins are no longer supported! More info: https://youtu.be/MwGcZL91xpU',
        embeds: [embed],
        components: []
    });
}

module.exports = {name, description, filter, execute};