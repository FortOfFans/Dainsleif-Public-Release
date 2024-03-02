const { jsonParse, translate } = require('../util');
const PagedMessage = require('../util/PagedMessage');

const name = translate('remindertimeline');
const description = translate('Shows a timeline of your reminders.');
const filter = () => true;
const options = [];

async function execute(interaction){
    let reminders = jsonParse('./data/reminders.json', []);
    const userRmds = reminders.filter(r => r.user === interaction.user.id).sort((a, b) => a.timestamp - b.timestamp);

    const pages = [];
    if (!userRmds.length) throw translate('You do not have any reminders set.', interaction.locale);

    for (let i = 0; i < userRmds.length; i += 20){
        const reminders = userRmds.slice(i, i + 20)
            .map(({ timestamp, message, repeat, internalUse }, j) => '`' + (i + j + 1) + '.` '
                + (internalUse ? message.embeds[0].footer.text : message) + ' <t:' + timestamp + ':R> '
                + (repeat ? translate('*(Repeats)*', interaction.locale) : ''))
            .join('\n')
            .substr(0, 2000); //just a safeguard
        pages.push({ content: reminders, components: [] });
    }

    return new PagedMessage(interaction, pages);
}

module.exports = { name, description, options, filter, execute };