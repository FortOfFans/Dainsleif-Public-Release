const { jsonParse, jsonSave, translate } = require('../util');
const { MessageEmbed } = require('discord.js');

const name = translate('resin');
const description = translate('Displays your resin schedule.');
const filter = () => true;
const options = [
    {
        type: 4, //int
        name: translate('resin'),
        description: translate('Your current resin amount.'),
        required: false
    },
    {
        type: 3, //str
        name: translate('reminders'),
        description: translate('The reminder(s) to set for resin.'),
        required: false
    }
];

async function execute(interaction){
    const inputs = jsonParse('./data/resin.json', {});
    const current = interaction.options.getInteger('resin');
    const resinReminders = interaction.options.getString('reminders')?.split(/[^\d]+/) ?? [];

    if (isNaN(current) && !inputs[interaction.user.id]) throw translate('You must specify resin amounts in this ' +
        'format: \n\n > /resin ``resin`` (amount)\n\n``keep in mind your resin amount can\'t be 0``', interaction.locale);

    const now = Math.floor(Date.now() / 1000);
    let start = now;

    if (!isNaN(current)) start = now - 8 * 60 * current;
    else start = inputs[interaction.user.id];

    inputs[interaction.user.id] = start;
    jsonSave('./data/resin.json', inputs);

    const times = [
        start + 8 * 60 * 20, //20 resin
        start + 8 * 60 * 30, //30 resin
        start + 8 * 60 * 40, //40 resin
        start + 8 * 60 * 60, //60 resin
        start + 8 * 60 * 90, //90 resin
        start + 8 * 60 * 120,//120 resin
        start + 8 * 60 * 160 //160 resin
    ];

    const currentResin = Math.floor((now - start) / (8 * 60));
    const embed = new MessageEmbed()
        .setTitle(translate('Your Resin Schedule', interaction.locale))
        .setColor(0x32e0ff)
        .setDescription('' +
            translate('**Current Resin:** <:last_quarter_moon_with_face:1126792927792873532> {0} / 160', interaction.locale)
                .replace('{0}', currentResin >= 160 ? 160 : currentResin) + '\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 20: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 30: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 40: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 60: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 90: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 120: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n' +
            '<:last_quarter_moon_with_face:1126792927792873532> 160: <t:' + times[0] + ':R> (<t:' + times.shift() + ':T>)\n')
        .setThumbnail('https://cdn.discordapp.com/emojis/1126792927792873532.png?size=96');

    await interaction.editReply({ embeds: [embed] });
    if (!resinReminders.length) return null;

    const reminders = jsonParse('./data/reminders.json', []);
    const amounts = resinReminders.filter(a => parseInt(a) > Math.floor((start - now) / 8 * 60));

    if (!amounts.length) return null;

    for (const amount of amounts) reminders.push({
        message: translate('Your resin amount has reached {0}.', interaction.locale)
            .replace('{0}', '<:last_quarter_moon_with_face:1126792927792873532> '
                + amount.toLocaleString(interaction.locale)) + '\n'
            + translate('Note: Due to resin recharge times, this may be ± 8 minutes.', interaction.locale),
        timestamp: start + 8 * 60 * amount,
        user: interaction.user.id
    });

    jsonSave('./data/reminders.json', reminders);
    embed.setFooter({ text: translate('Reminder was set at {0} resin.', interaction.locale).replace('{0}', currentResin) });
    return interaction.editReply({
        content: translate('Scheduled the mentioned reminder(s)', interaction.locale),
        embeds: [embed]
    });
}

module.exports = { name, description, options, filter, execute };