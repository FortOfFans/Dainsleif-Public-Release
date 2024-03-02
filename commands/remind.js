const { MessageEmbed } = require('discord.js');
const { getUserSettings, translate, jsonParse, jsonSave} = require('../util');

const name = translate('remind');
const description = translate('Sets a reminder that will be sent in DMs.');
const filter = () => true;
const options = [
    {
        type: 5, //bool
        name: translate('repeats'),
        description: translate('Whether the reminder will repeat at the specified interval or not.'),
        required: true
    },
    {
        type: 3, //str
        name: translate('time'),
        description: translate('The amount of time followed by a unit (mo, w, d, h, m, s).'),
        required: true
    },
    {
        type: 3, //str
        name: translate('message'),
        description: translate('The message that will be sent.'),
        required: true
    }
];

async function execute(interaction){
    const timeRegex = new RegExp(
        '(\\d+)\\s*('
        + ['mo', 'w', 'd', 'h', 'm', 's'].map(en => translate(en, interaction.locale)).join('|')
        + ')');
    const [, amt, unit] = timeRegex.exec(interaction.options.getString('time')) ?? [];
    if (!(amt && unit)) throw translate('Invalid time format. Must be a number followed by any of: `mo, w, d, h, ' +
        'm, s`.', interaction.locale);

    const multiplier = {
        [translate('mo', interaction.locale)]: 60 * 60 * 24 * 30,
        [translate('w', interaction.locale)]:  60 * 60 * 24 * 7,
        [translate('d', interaction.locale)]:  60 * 60 * 24,
        [translate('h', interaction.locale)]:  60 * 60,
        [translate('m', interaction.locale)]:  60,
        [translate('s', interaction.locale)]:  1
    };
    const now = Math.floor(Date.now() / 1000);
    const timestamp = now + +amt * multiplier[unit];
    const repeats = interaction.options.getBoolean('repeats');
    const repeat = repeats ? timestamp - now : 0;
    const message = interaction.options.getString('message');

    const names = {
        [translate('mo', interaction.locale)]: translate('Every month', interaction.locale),
        [translate('w', interaction.locale)]:  translate('Every week', interaction.locale),
        [translate('d', interaction.locale)]:  translate('Every day', interaction.locale),
        [translate('h', interaction.locale)]:  translate('Every hour', interaction.locale),
        [translate('m', interaction.locale)]:  translate('Every minute', interaction.locale),
        [translate('s', interaction.locale)]:  translate('Every second', interaction.locale)
    }
    const plurals = {
        [translate('mo', interaction.locale)]: translate('Every {0} months', interaction.locale),
        [translate('w', interaction.locale)]:  translate('Every {0} weeks', interaction.locale),
        [translate('d', interaction.locale)]:  translate('Every {0} days', interaction.locale),
        [translate('h', interaction.locale)]:  translate('Every {0} hours', interaction.locale),
        [translate('m', interaction.locale)]:  translate('Every {0} minutes', interaction.locale),
        [translate('s', interaction.locale)]:  translate('Every {0} seconds', interaction.locale)
    }
    const embed = new MessageEmbed()
        .setTitle(translate('Reminder Scheduled', interaction.locale))
        .setColor(getUserSettings(interaction.user.id).color)
        .addField(translate('Time', interaction.locale), '<t:' + timestamp + ':R>', true)
        .addField(
            translate('Repeats', interaction.locale),
            repeats ? (amt > 1 ? plurals[unit] : names[unit]).replace('{0}', amt) : translate('Never', interaction.locale),
            true)
        .addField(translate('User', interaction.locale), '<@' + interaction.user.id + '>', true)
        .addField(translate('Message', interaction.locale), message, false);

    const reminders = jsonParse('./data/reminders.json', []);
    reminders.push({ timestamp, repeat, message, user: interaction.user.id });
    jsonSave('./data/reminders.json', reminders);

    return interaction.editReply({ embeds: [embed] });
}

module.exports = { name, description, options, filter, execute };