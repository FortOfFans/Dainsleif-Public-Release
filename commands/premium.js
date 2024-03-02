const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { getUserSettings, translate } = require('../util');

const name = translate('premium');
const description = translate('Gives links to purchase premium and support the bot.');
const filter = () => true;
const options = [];

async function execute(interaction){
    const embed = new MessageEmbed()
        .setTitle(interaction.client.user.username)
        .setColor(interaction.client.config.COLOR ?? getUserSettings(interaction.user.id).color)
        .setThumbnail(interaction.client.user.avatarURL())
        .setDescription(translate('Wish to get premium and support the bot?', interaction.locale))
        .addField(translate('What does Premium offer?', interaction.locale),
            [
                'Allows you to view characters in the `/profile` command after they have been removed from the user\'s in-game profile.',
                'You will be able to link up to 4 UIDs with your Discord account using the `/link` command.',
                'Helps to support the bot and keep it running with the resources it needs.'
            ].map(ln => '• ' + translate(ln, interaction.locale)).join('\n')
        )
        .addField(translate('How do I get Premium?', interaction.locale), translate('Simply send 5€ using ' +
            'one of the methods below and you will be granted lifetime premium once we have received your payment.'));

    const btns = new MessageActionRow();
    const ppBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel(translate('Paypal', interaction.locale))
        .setEmoji(':PayPal:1001346285636436009')
        .setURL('https://paypal.me/z4bakedpotato');
    const kofiBtn = new MessageButton()
        .setStyle('LINK')
        .setLabel(translate('Ko-fi', interaction.locale))
        .setEmoji(':Kofi:995697923348254811')
        .setURL('https://ko-fi.com/s/f5577100b8');

    btns.addComponents(ppBtn, kofiBtn);

    return interaction.editReply({ embeds: [embed], components: [btns] });
}

module.exports = { name, description, options, filter, execute };