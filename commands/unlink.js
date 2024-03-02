const { MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const { jsonParse, jsonSave, translate, getUserSettings} = require('../util');

const name = translate('unlink');
const description = translate('Removes a linked UID from your Discord Account.');
const filter = () => true;
const options = [];

async function execute(interaction){
    const linked = jsonParse('./data/linked.json', {});
    if (!linked[interaction.user.id]) throw translate('You do not have any linked UIDs.', interaction.locale);

    const uids = linked[interaction.user.id];
    let unlink = uids.length > 1 ? undefined : 0;

    if (unlink === undefined){
        const row = new MessageActionRow();
        const unlinkEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please choose an account to unlink.', interaction.locale));

        for (const uid of uids){
            const btn = new MessageButton()
                .setStyle('DANGER')
                .setLabel(uid.toString())
                .setCustomId(uids.indexOf(uid).toString());
            row.addComponents(btn);
        }

        const bMsg = await interaction.editReply({ embeds: [unlinkEmbed], components: [row] });
        const filter = i => i.user.id === interaction.user.id;
        const time = 10 * 60 * 1000;
        const max = 1;
        const btnPress = await bMsg.awaitMessageComponent({ filter, time, max });

        await btnPress.deferUpdate();
        unlink = parseInt(btnPress.customId);
    } else {
        const row = new MessageActionRow();
        const confirmEmbed = new MessageEmbed()
            .setColor(0xFF5555)
            .setDescription(translate('Are you sure you want to unlink **{0}** from your Discord Account?',
                interaction.locale).replace('{0}', uids[unlink]));

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

        const bMsg = await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
        const filter = i => i.user.id === interaction.user.id;
        const time = 10 * 60 * 1000;
        const max = 1;
        const btnPress = await bMsg.awaitMessageComponent({ filter, time, max });

        await btnPress.deferUpdate();
        if (btnPress.customId === 'deny') return interaction.editReply({ content: translate('Cancelled ' +
                'unlinking.', interaction.locale), embeds: [], components: [] });
    }

    linked[interaction.user.id] = uids.filter((_, i) => i !== unlink);
    jsonSave('./data/linked.json', linked);

    const embed = new MessageEmbed()
        .setColor(0x55FF55)
        .setDescription('✅ ' + translate('Successfully unlinked **{0}** from your Discord account.', interaction.locale).replace('{0}', uids[unlink]));

    return interaction.editReply({ embeds: [embed], components: [] });
}

module.exports = { name, description, options, filter, execute };