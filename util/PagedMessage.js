const { MessageActionRow, MessageButton } = require('discord.js');
const { translate } = require('./index');

const emojis = {
    '|<<': 'left_end:955680166464610344',
    '<<': 'left_left:905510972515577866',
    '<': 'left:904053522931257424',
    '>': 'right:904053560986185758',
    '>>': 'right_right:905510972108705833',
    '>>|': 'right_end:955680166489780224'
}

class PagedMessage {
    interaction;
    page = 0;
    pages = [];

    actionRow = new MessageActionRow();
    buttons = [];
    collector;
    message;

    constructor(interaction, pages, startPage = 0, time = 10 * 60 * 1000) {
        pages = pages.map(pg => {
            if (!pg.components) pg.components = [];
            return pg;
        });

        this.interaction = interaction;
        this.page = startPage;
        this.pages = pages;
        this.time = time;

        const amounts = {
            '|<<': -1 * pages.length,
            '<<': -5,
            '<': -1,
            '>': 1,
            '>>': 5,
            '>>|': pages.length
        }

        this.buttons = ['<', '>'];
        if (pages.length <= 1) {
            this.buttons = [];
            delete this.actionRow;
        }
        if (pages.length >= 5) this.buttons = ['<<', '<', '>', '>>'];
        if (pages.length >= 10) this.buttons = ['<<', '<', '>', '>>', '>>|'];

        for (const text of this.buttons){
            const button = new MessageButton()
                .setCustomId(text)
                .setEmoji(emojis[text])
                .setStyle(('<<'.includes(text) && this.page === 0) || ('>>'.includes(text) && this.page === pages.length - 1) ? 2 : 1)
                .setDisabled(('<<'.includes(text) && this.page === 0) || ('>>'.includes(text) && this.page === pages.length - 1));
            this.actionRow.addComponents(button);
        }

        this.setPage(startPage)
            .then(() => {
                const filter = i => interaction.user.id === i.user.id && this.buttons.includes(i.customId);
                this.collector = this.message?.createMessageComponentCollector?.({ filter, time });

                this.collector?.on('collect', async i => {
                    await i.deferUpdate().catch(() => {});
                    const amt = amounts[i.customId];
                    await this.setPage(this.page + amt);
                });

                this.collector?.on('end', () => this.end);

                this.onInitFinish();
            });
    }

    onInitFinish(){}

    validatePage(){
        if (this.page < 0) this.page = 0;
        if (this.page > this.pages.length - 1) this.page = this.pages.length - 1;

        for (const btn of this.actionRow?.components ?? []){
            if (!btn.customId) continue;

            if (btn.customId.includes('<') && this.page <= 0) btn.setStyle(2).setDisabled(true);
            else if (btn.customId.includes('>') && this.page >= this.pages.length - 1) btn.setStyle(2).setDisabled(true);
            else btn.setStyle(1).setDisabled(false);
        }

        return this;
    }

    async end(edit = true){
        this.collector?.stop();
        this.validatePage();
        if (edit) this.message = await this?.message?.edit(this?.pages[this?.page])?.catch(() => {});
        return null;
    }

    async setPage(page){
        this.page = page;
        return this.update();
    }

    async update(){
        this.validatePage();

        let pages = this.pages;
        if (this.actionRow) pages = this.pages.map(pg => Object({
            ...pg,
            components: [
                ...pg.components,
                this.actionRow
            ]
        }));

        this.message = await this.interaction
            .editReply(pages[this.page])
            .catch(e => e);
            // .catch(() => this.interaction.editReply({
            //     embeds: [{
            //         title: translate(':warning: There was an error', this.interaction.locale),
            //         color: 0xE0B024,
            //         description: translate('Attempted to change pages but the bot profile does not have ' +
            //             'access to this channel. Please have a server admin adjust the channel permissions for the bot!', this.interaction.locale)
            //     }]
            // }));
        return this;
    }
}

module.exports = PagedMessage;