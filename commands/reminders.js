const { MessageEmbed } = require('discord.js');
const { getUserSettings, translate, jsonParse, jsonSave} = require('../util');
const PagedEmbed = require('../util/PagedEmbed');

const name = translate('reminders');
const description = translate('View and manage your active reminders.');
const filter = () => true;
const options = [
    {
        type: 4, //int
        name: translate('remove'),
        description: translate('The reminder to remove. Will list all reminders if nothing is entered.'),
        required: false
    }
];

async function execute(interaction){
    let reminders = jsonParse('./data/reminders.json', []);
    const userRmds = reminders.filter(r => r.user === interaction.user.id && !r.internalUse).sort((a, b) => a.timestamp - b.timestamp);
    const rmdToDel = interaction.options.getInteger('remove');
    if (rmdToDel !== null){
        const isValid = userRmds.find(r => userRmds.indexOf(r) + 1 === rmdToDel && r.user === interaction.user.id);
        if (!isValid) throw translate('Failed to find the reminder to remove.', interaction.locale);

        const keep = userRmds.filter(r => userRmds.indexOf(r) + 1 !== rmdToDel && r.user === interaction.user.id)
        reminders = reminders.filter(r => r.user !== interaction.user.id || r.internalUse);
        reminders.push(...keep);
        jsonSave('./data/reminders.json', reminders);

        const embed = new MessageEmbed()
            .setColor(0x55FF55)
            .setDescription('✅ ' + translate('Your reminder has been removed.', interaction.locale))
        return interaction.editReply({ embeds: [embed] });
    }

    const pages = [];
    if (!userRmds.length) throw translate('You do not have any reminders set.', interaction.locale);

    for (let i = 0; i < userRmds.length; i += 5){
        const embed = new MessageEmbed()
            .setTitle(translate('Reminders', interaction.locale))
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setColor(getUserSettings(interaction.user.id).color)
            .setFooter({
                text: translate('Page {0} of {0}')
                    .replace('{0}', Math.floor(i / 5) + 1)
                    .replace('{0}', Math.ceil(userRmds.length / 5))
            });

        for (const rmd of userRmds.slice(i, i + 5)) embed.addField(
            translate('`{0}`. Reminder <t:{0}:R>', interaction.locale)
                .replace('{0}', userRmds.indexOf(rmd) + 1)
                .replace('{0}', rmd.timestamp),
            rmd.message, false);
        pages.push(embed);
    }

    return new PagedEmbed(interaction, pages);
}

module.exports = { name, description, options, filter, execute };