const { jsonParse, translate, untranslate, getUserSettings, jsonSave, ambrApi} = require('../util');
const { MessageActionRow, MessageEmbed, MessageSelectMenu, MessageButton} = require('discord.js');
const PagedMessage = require('../util/PagedMessage');
const axios = require('axios');
const fs = require('fs');
const Character = require("../util/struct/Character");

const name = translate('account');
const description = translate('Displays a user\'s character showcase.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('uid'),
        description: translate('The UID of the player to search for.'),
        required: false
    },
    {
        type: 6, //str
        name: translate('user'),
        description: translate('The artifact set to search for.'),
        required: false
    }
];

class ProfileMessage extends PagedMessage {
    characterMap = {};
    pagedMessage;
    timeLeft = 10 * 60 * 1000;

    constructor(interaction, embeds, characterMap) {
        const selectRow = new MessageActionRow();
        const selectMenu = new MessageSelectMenu()
            .setPlaceholder(translate('Select a Character', interaction.locale))
            .setCustomId('charselect');

        setInterval(() => this.timeLeft -= 1000, 1000);

        const emojiMap = jsonParse('./data/emojis/characterEmojis.json', {});

        for (const character in characterMap){
            const label = character;
            const value = character;
            const emoji = emojiMap[untranslate(character, interaction.locale)];

            if (selectMenu.options.length < 20) selectMenu.addOptions({ label, value, emoji });
        }

        selectRow.addComponents(selectMenu);

        const btnRow = new MessageActionRow();
        const statsBtn = new MessageButton()
            .setLabel(translate('Stats', interaction.locale))
            .setStyle('SUCCESS')
            .setCustomId('stats');
        const artBtn = new MessageButton()
            .setLabel(translate('Artifacts', interaction.locale))
            .setStyle('PRIMARY')
            .setCustomId('art');
        btnRow.addComponents(statsBtn, artBtn);

        const pages = embeds.map(embed => Object({ embeds: [embed], components: [btnRow, selectRow] }));
        pages[0].components.shift();
        if (!selectRow.components[0].options.length) {
            pages[0].components.shift();

            const row = new MessageActionRow();
            const enkaBtn = new MessageButton()
                .setStyle('LINK')
                .setURL(pages[0].embeds[0].author.url)
                .setEmoji('980216980575518740');
            row.addComponents(enkaBtn);
            pages[0].components = [row];
        }

        super(interaction, pages);
        this.characterMap = characterMap;
    }

    onInitFinish() {
        this.end().then(() => {
            const filter = i => this.interaction.user.id === i.user.id;
            this.collector = this.message?.createMessageComponentCollector({ filter, time: this.time });

            this.collector?.on('collect', async i => {
                await i.deferUpdate().catch(() => {});

                if (i.componentType === 'BUTTON' && ['stats', 'art'].includes(i.customId))
                    return this.setPage(this.characterMap[this.selected][i.customId]);

                if (i.customId !== 'charselect') return null;

                this.selected = i.values[0];
                return this.setPage(this.characterMap[this.selected].stats);
            });

            this.collector?.on('end', () => {
                this.pages = this.pages.map(pg => {
                    pg.components = [];
                    return pg;
                });
                return this.end();
            });

            this.update();
        });
    }

    async update(){
        this.validatePage();

        if (this.characterMap){
            this.pagedMessage?.end(false);

            const emojiMap = jsonParse('./data/emojis/characterEmojis.json', {});

            const pageSize = 20;
            const pages = [];
            for (let i = 0; i < Object.keys(this.characterMap).length; i += pageSize){
                const avatars = Object.keys(this.characterMap).slice(i, i + pageSize);
                const row = new MessageActionRow();
                const menu = new MessageSelectMenu()
                    .setPlaceholder(translate('Select a Character', this.interaction.locale))
                    .setCustomId('charselect');

                for (const character of avatars){
                    const label = character;
                    const value = character;
                    const emoji = emojiMap[untranslate(character, this.interaction.locale)];

                    menu.addOptions({ label, value, emoji });
                }

                row.addComponents(menu);

                const btnRow = new MessageActionRow();
                const statsBtn = new MessageButton()
                    .setLabel(translate('Stats', this.interaction.locale))
                    .setStyle('SUCCESS')
                    .setCustomId('stats');
                const artBtn = new MessageButton()
                    .setLabel(translate('Artifacts', this.interaction.locale))
                    .setStyle('PRIMARY')
                    .setCustomId('art');
                btnRow.addComponents(statsBtn, artBtn);

                const rows = this.page ? [btnRow, row] : [row];
                pages.push({ embeds: this.pages[this.page].embeds, components: rows });
            }

            this.pagedMessage = new PagedMessage(this.interaction, pages, this.pagedMessage?.page ?? 0, this.timeLeft);
            if (this.page === 0){
                const enkaBtn = new MessageButton()
                    .setStyle('LINK')
                    .setURL(this.pages[0].embeds[0].author.url)
                    .setEmoji('980216980575518740');

                if (!this.pagedMessage.actionRow) this.pagedMessage.actionRow = new MessageActionRow();
                this.pagedMessage.actionRow.addComponents(enkaBtn);
                this.pagedMessage.update();
            }
        } else {
            this.message = await this.interaction
                .editReply(this.pages[this.page])
                .catch(e => console.log(e));
        }

        return this;
    }
}

let cooldown = 0;
const baseUrl = 'https://enka.network/api/uid/';
const subUrl = 'https://enka.network/u/';
async function execute(interaction){

    let givenUid
    if (interaction.options.getString('uid')) givenUid = interaction.options.getString('uid');

    const linkedUids = jsonParse('./data/linked.json', {})[interaction.user.id];
    const linkedUids2 = jsonParse('./data/linked.json', {})

    let user
    if (interaction.options.getUser('user')) user = interaction.options.getUser('user').id

    let uid
    if (givenUid) uid = linkedUids?.[parseInt(givenUid ?? '1') - 1];
    if (user) uid = parseInt(linkedUids2[user]?.[0])
    if (!givenUid && !user) uid = jsonParse('./data/linked.json', {})[interaction.user.id]?.[0]

    if (['na', 'eu', 'asia', 'sar'].map(str => translate(str, interaction.locale)).includes(givenUid)) {
        const location = untranslate(givenUid, interaction.locale);

        if (location === 'na') uid = linkedUids.find(id => id.startsWith('6'));
        if (location === 'eu') uid = linkedUids.find(id => id.startsWith('7'));
        if (location === 'asia') uid = linkedUids.find(id => id.startsWith('8'));
        if (location === 'sar') uid = linkedUids.find(id => id.startsWith('9'));

    }
    else if (user && !uid) return await interaction.editReply(translate('Mentioned user has not linked their UID to the bot.', interaction.locale))
    else if (!givenUid && !uid) return await interaction.editReply(translate('No UID provided.', interaction.locale))
    else if (/^[125-9]\d{8}$/.test(givenUid)) uid = givenUid;

    if (!/^[125-9]\d{8}$/.test(uid)) return await interaction.editReply( translate('Invalid UID.', interaction.locale));

    const achievementLdb = jsonParse('./data/leaderboards/achievements.json', {});
    const nameList = jsonParse('./data/leaderboards/names.json', {});
    const arList = jsonParse('./data/leaderboards/ar.json', {});
    const wlList = jsonParse('./data/leaderboards/wl.json', {});
    const fList = jsonParse('./data/leaderboards/fl.json', {});
    const cList = jsonParse('./data/leaderboards/cl.json', {});
    const sList = jsonParse('./data/leaderboards/sl.json', {});
    const nList = jsonParse('./data/leaderboards/nl.json', {});
    const data = (await axios.get(baseUrl + uid )
        .catch(r => {
            if (![424, 500, 503, 522, 526].includes(r.response.status)) throw translate('Failed to find a user with that UID.', interaction.locale);
            }
        ))?.data ?? {
        avatarInfoList: Object.values(jsonParse('./data/profiles/' + uid + '.json', {})),
        playerInfo: {
            finishAchievementNum: achievementLdb[uid] ?? -1,
            nickname: nameList[uid] ?? '???',
            signature: nList[uid] +'\n\n***__Enka.Network is currently down. Cached info is shown.__***' ?? translate('***__Enka.Network is currently down. Cached info is shown.__***', interaction.locale),
            towerLevelIndex: cList[uid] ?? -1,
            towerFloorIndex: fList[uid] ?? -1,
            level: arList[uid] ?? -1,
            worldLevel: wlList[uid] ?? -1,
            nameCardId: nList[uid] ?? 'UI_NameCardPic_Bp17_P',
        }
    };


    const userPremium = getUserSettings(interaction.user.id).premium;
    const cache = userPremium ? jsonParse('./data/profiles/' + uid + '.json', {}) : {};
    for (const avatarData of Object.values(cache))
        if (!data.avatarInfoList?.find(a => a.avatarId === avatarData.avatarId)) data.avatarInfoList?.push(avatarData);

    const pages = [];
    const authorData = { name: data.playerInfo.nickname, url: subUrl + uid };
    const serialisations = jsonParse('./data/loc.json', {});
    const emojis = [
        '<:FIGHT_PROP_ATTACK_PERCENT:971462863338213396>',
        '<:FIGHT_PROP_DEFENSE_PERCENT:971462863250153502>',
        '<:FIGHT_PROP_PHYSICAL_ADD_HURT:971462863371788330>',
        '<:FIGHT_PROP_ADD_HURT:971462863371788330>',
        '<:FIGHT_PROP_HP:971462863359180900>',
        '<:FIGHT_PROP_CRITICAL_HURT:971462863254327357>',
        '<:FIGHT_PROP_CRITICAL_VALUE:1128673279490666568>',
        '<:FIGHT_PROP_ELEMENT_MASTERY:971462862948151358>',
        '<:FIGHT_PROP_DEFENSE:971462863300477008>',
        '<:FIGHT_PROP_BASE_ATTACK:971462863346597958>',
        '<:FIGHT_PROP_HEAL_ADD:971462863283699772>',
        '<:FIGHT_PROP_HEALED_ADD:971462863334023248>',
        '<:FIGHT_PROP_CHARGE_EFFICIENCY:971462863229190154>',
        '<:FIGHT_PROP_HP_PERCENT:971462863334035466>',
        '<:FIGHT_PROP_SHIELD_COST_MINUS_RAT:971462863363375104>',
        '<:FIGHT_PROP_CRITICAL:971462862935584829>',
        '<:Friendship:962494642333552640>',
        '<:Const:962494642400677968>',
        '<:FIGHT_PROP_ATTACK:971462863346597958>',
        '<:FIGHT_PROP_GRASS_ADD_HURT:893323600566820904>',
        '<:FIGHT_PROP_ELEC_ADD_HURT:893323600034168863>',
        '<:FIGHT_PROP_ICE_ADD_HURT:893323600503898122>',
        '<:FIGHT_PROP_WATER_ADD_HURT:893323600071913493>',
        '<:FIGHT_PROP_FIRE_ADD_HURT:893323600663289886>',
        '<:FIGHT_PROP_ROCK_ADD_HURT:893323600227106847>',
        '<:FIGHT_PROP_WIND_ADD_HURT:893323600524894218>',
        '<:FIGHT_PROP_SHIELD_COST_MINUS_RATIO:971462863363375104>'
    ];

    const friendlyNames = {
        BASE_ATTACK: translate('Base ATK', interaction.locale),
        ELEMENT_MASTERY: translate('EM', interaction.locale),
        CRITICAL: translate('CRIT Rate', interaction.locale),
        CRITICAL_HURT: translate('CRIT DMG', interaction.locale),
        CRITICAL_VALUE: translate('CRIT Value', interaction.locale),
        ATTACK: translate('ATK', interaction.locale),
        ATTACK_PERCENT: translate('ATK', interaction.locale),
        CHARGE_EFFICIENCY: translate('ER', interaction.locale),
        DEFENSE: translate('DEF', interaction.locale),
        FIRE_ADD_HURT: translate('Pyro DMG', interaction.locale),
        WATER_ADD_HURT: translate('Hydro DMG', interaction.locale),
        PHYSICAL_ADD_HURT: translate('Physical DMG', interaction.locale),
        ELEC_ADD_HURT: translate('Electro DMG', interaction.locale),
        ICE_ADD_HURT: translate('Cryo DMG', interaction.locale),
        WIND_ADD_HURT: translate('Anemo DMG', interaction.locale),
        ROCK_ADD_HURT: translate('Geo DMG', interaction.locale),
        GRASS_ADD_HURT: translate('Dendro DMG', interaction.locale),
        HP_PERCENT: translate('HP', interaction.locale),
        HEAL_ADD: translate('Healing Bonus', interaction.locale),
        HEALED_ADD: translate('Incoming HB', interaction.locale),
        DEFENSE_PERCENT: translate('DEF', interaction.locale),
        SHIELD_COST_MINUS_RATIO: translate('Shield Strength', interaction.locale),
        ADD_HURT: translate('Raw DMG Bonus', interaction.locale)
    }

    function getSerialised(id, amt){
        if (id.toString().startsWith('FIGHT_PROP')){
            const short = id.replace('FIGHT_PROP_', '');
            const flat = ['BASE_ATTACK', 'ELEMENT_MASTERY', 'HP', 'DEFENSE', 'ATTACK', 'CRITICAL_VALUE'];

            const friendly = emojis.find(e => e.split(':')[1] === id) + ' ' + (friendlyNames[short] ?? short)
                + ' +' + amt.toLocaleString(interaction.locale);
            if (!flat.includes(short)) return friendly + '%';
            else return friendly;
        }

        const locales = {
            'en-GB': 'en',
            'en-US': 'en',
            'es-ES': 'es',
            'pt-BR': 'pt'
        }
        const locale = locales[interaction.locale] ?? (serialisations[interaction.locale] ? interaction.locale : 'en');
        const found = serialisations[locale][id];

        return found ?? id.toString();
    }

    const charMap = jsonParse('./data/characters.json', []);
    const codeName = charMap.find(char => char.id === data.playerInfo.profilePicture?.avatarId)?.iconName;
    const {items: nex} = await ambrApi('/namecard', interaction.locale);
    const lz = Object.entries(nex)?.find(([a, b]) => b.id === data.playerInfo.nameCardId)
    const nameCard = Object.values(lz)?.[1]?.['icon'];

    achievementLdb[uid] = data.playerInfo.finishAchievementNum;
    jsonSave('./data/leaderboards/achievements.json', achievementLdb);

    nameList[uid] = data.playerInfo.nickname;
    jsonSave('./data/leaderboards/names.json', nameList);

    arList[uid] = data.playerInfo.level;
    jsonSave('./data/leaderboards/ar.json', arList);

    wlList[uid] = data.playerInfo.worldLevel;
    jsonSave('./data/leaderboards/wl.json', wlList);

    fList[uid] = data.playerInfo.towerFloorIndex;
    jsonSave('./data/leaderboards/fl.json', fList);

    cList[uid] = data.playerInfo.towerLevelIndex;
    jsonSave('./data/leaderboards/cl.json', cList);

    sList[uid] = data.playerInfo.signature;
    jsonSave('./data/leaderboards/sl.json', sList);

    nList[uid] = data.playerInfo.nameCardId;
    jsonSave('./data/leaderboards/nl.json', nList);

    const introPage = new MessageEmbed()
        .setAuthor(authorData)
        .setColor(getUserSettings(interaction.user.id).color)
        .setDescription(data.playerInfo.signature || translate('No signature', interaction.locale))
        .setThumbnail('https://res.cloudinary.com/genshin/image/upload/e_trim:80/v1/sprites/' + codeName + '.png')
        .setImage('https://api.ambr.top/assets/UI/namecard/' + nameCard.replace('UI_NameCardIcon_','UI_NameCardPic_') + '_P.png')
        .addField(translate('Spiral Abyss', interaction.locale), translate('Floor {0} Chamber {0}', interaction.locale)
            .replace('{0}', data.playerInfo.towerFloorIndex)
            .replace('{0}', data.playerInfo.towerLevelIndex), true)
        .addField(translate('Achievements Completed', interaction.locale), data.playerInfo.finishAchievementNum.toString(), true)
        .setFooter({ text: translate('AR {0} · WL {0}', interaction.locale)
                .replace('{0}', data.playerInfo.level)
                .replace('{0}', data.playerInfo.worldLevel) + ' ' +
                translate('· UID: {1}', interaction.locale).replace('{1}', uid) })
    pages.push(introPage);

    const c3Avatars = fs.readFileSync('./data/c3avatars.txt').toString().split('\r\n');
    const charList = jsonParse('./data/characters.json', []);

    const characterMap = {};
    let j = 0;

    const newCache = jsonParse('./data/profiles/' + uid + '.json', {});
    if (!data.avatarInfoList) introPage.addField(translate('Warning', interaction.locale), translate('Profile ' +
        'either has no characters listed or has Character Details hidden. [How to add characters](https://youtu.be/eZbudcY2F3w?t=14)', interaction.locale), false);

    const levelText = translate('Lv. {0} · Friendship Level {0}', interaction.locale);
    const weaponText = translate('Lv. {0} {0}', interaction.locale);
    const statsText = translate('Stats', interaction.locale);
    const consText = translate('Constellation', interaction.locale);
    const talentsText = translate('Talents', interaction.locale);
    const charArtText = translate('{0}\'s Artifacts');
    const charStatText = translate('{0}\'s Stats');
    const setBonusText = translate('Set Bonuses', interaction.locale);
    const noSetBonusText = translate('No Set Bonuses', interaction.locale);
    const twoPcText = translate('2pc {0}', interaction.locale);
    const fourPcText = translate('4pc {0}', interaction.locale);
    const flowerText = translate('Flower', interaction.locale);
    const plumeText = translate('Plume', interaction.locale);
    const sandsText = translate('Sands', interaction.locale);
    const gobletText = translate('Goblet', interaction.locale);
    const circletText = translate('Circlet', interaction.locale);

    const artifactList = jsonParse('./data/leaderboards/artifacts/' + uid + '.json', []);
    const buildsList = jsonParse('./data/leaderboards/builds/' + uid + '.json', {});

    const artifactEmojis = jsonParse('./data/emojis/artifactEmojis.json', { 'Emotes': [] });

    for (const char of data.avatarInfoList ?? []){
        const charInfo = charList.find(c => c.id === char.avatarId) ?? {
            nameTextMapHash: char.avatarId,
            element: 'Unknown'
        };
        newCache[char.avatarId] = char;
        let embed = new MessageEmbed().setColor(0xCFD0D2);

        const character = new Character(char, uid);
        for (const artifact of character.artifacts) artifactList.push(artifact);
        buildsList[char.avatarId] = character;

        //Character
        const {name:iten, icon} = await ambrApi('/avatar/' + char.avatarId, interaction.locale.replace('ja', 'en-GB'));
        const name = iten;
        const level = char.propMap['4001'].val;
        const iconURL = 'https://res.cloudinary.com/genshin/image/upload/e_trim:80/v1/sprites/UI_AvatarIcon_Side_' + icon.split('_').pop() + '.png'
        embed.setAuthor({ name, iconURL,  url: subUrl + uid });
        embed.setDescription(authorData.name + ' · ' + introPage.footer.text);
        embed.setFooter({ text: levelText
                .replace('{0}', level)
                .replace('{0}', char.fetterInfo.expLevel) });
        characterMap[name] = {
            stats: ++j,
            art: ++j
        }

        //Weapon
        const weapon = char.equipList.pop();
        const refinements = ['<:R1:1127673428288221234>', '<:R2:1127673431673024654>', '<:R3:1127673433317179513>', '<:R4:1127673435791818895>', '<:R5:1127673437993848942>'];
        embed.addField(weaponText
                .replace('{0}', weapon.weapon.level)
                .replace('{0}', getSerialised(weapon.flat.nameTextMapHash))
            + ' ' + refinements[(Object.values(weapon.weapon.affixMap ?? {})?.[0]) ?? 0],
            weapon.flat.weaponStats.map(s => getSerialised(s.appendPropId, s.statValue)).join('\n'));

        //Stats
        /*
        1 = Base HP
        2 = Added HP
        4 = Base ATK
        5 = Added ATK
        7 = Base DEF
        8 = Added DEF
        20 = CRIT Rate
        22 = CRIT DMG
        23 = Energy Recharge
        26 = Healing Bonus
        28 = Elemental Mastery
        30 = Physical DMG Bonus
        40 = Pyro DMG Bonus
        41 = Electro DMG Bonus
        42 = Hydro DMG Bonus
        43 = Dendro DMG Bonus
        44 = Anemo DMG Bonus
        45 = Geo DMG Bonus
        46 = Cryo DMG Bonus
        50 = Pyro RES
        51 = Electro RES
        52 = Hydro RES
        53 = Dendro RES
        54 = Anemo RES
        55 = Geo RES
        56 = Cryo RES
        70 = Pyro Vision
        71 = Electro Vision
        72 = Hydro Vision
        73 = Dendro Vision
        74 = Anemo Vision
        75 = Cryo Vision
        76 = Geo Vision
        2e3 = Max HP
        2001 = ATK
        2002 = DEF
         */
        let output = '';
        const stats = char.fightPropMap;
        stats[22.5] = character.artifacts
                .reduce((t, a) => t + (a?.substats?.CRITICAL * 2 || 0) + (a?.substats?.CRITICAL_HURT || 0), 0)
            + (character.artifacts[4]?.mainStat?.startsWith('CRITICAL') ?
                char.equipList.find(a => a.itemId.toString()[3] === '3').flat.reliquaryMainstat.statValue *
                (1 + (character.artifacts[4]?.mainStat === 'CRITICAL')) : 0);
        character.stats.CRITICAL_VALUE = stats[22.5];
        //HP, ATK, DEF
        for (const [max, base, statName, friendlyName] of [[2e3, 1, 'HP', 'Max HP'], [2001, 4, 'ATTACK', 'ATK'], [2002, 7, 'DEFENSE', 'DEF']]){
            const str = emojis.find(e => e.includes(statName)) + ' **' + translate(friendlyName, interaction.locale) + ':** '
                + Math.round(stats[max]).toLocaleString(interaction.locale) + ' ('
                + Math.round(stats[base]).toLocaleString(interaction.locale) + ' +'
                + Math.round((stats[max] - stats[base]) ?? 0).toLocaleString(interaction.locale) + ')';
            output += '\n' + str;
        }
        output += '\n\n';

        //Element
        /*
        70 = Pyro Vision
        71 = Electro Vision
        72 = Hydro Vision
        73 = Dendro Vision
        74 = Anemo Vision
        75 = Cryo Vision
        76 = Geo Vision
        */

        const colors = {
            70: 15818755,
            71: 14596863,
            72: 582911,
            73: 11660073,
            74: 11007437,
            75: 13631487,
            76: 15980901
        }

        for (let i = 70; i <= 76; i++){
            if (stats[i]) embed.setColor(colors[i]);
        }

        const G = {
            FIGHT_PROP_BASE_HP: 1,
            FIGHT_PROP_HP: 2,
            FIGHT_PROP_HP_PERCENT: 3,
            FIGHT_PROP_BASE_ATTACK: 4,
            FIGHT_PROP_ATTACK: 5,
            FIGHT_PROP_ATTACK_PERCENT: 6,
            FIGHT_PROP_BASE_DEFENSE: 7,
            FIGHT_PROP_DEFENSE: 8,
            FIGHT_PROP_DEFENSE_PERCENT: 9,
            FIGHT_PROP_BASE_SPEED: 10,
            FIGHT_PROP_SPEED_PERCENT: 11,
            FIGHT_PROP_HP_MP_PERCENT: 12,
            FIGHT_PROP_ATTACK_MP_PERCENT: 13,
            FIGHT_PROP_CRITICAL: 20,
            FIGHT_PROP_ANTI_CRITICAL: 21,
            FIGHT_PROP_CRITICAL_HURT: 22,
            FIGHT_PROP_CRITICAL_VALUE: 22.5,
            FIGHT_PROP_CHARGE_EFFICIENCY: 23,
            FIGHT_PROP_ADD_HURT: 24,
            FIGHT_PROP_SUB_HURT: 25,
            FIGHT_PROP_HEAL_ADD: 26,
            FIGHT_PROP_HEALED_ADD: 27,
            FIGHT_PROP_ELEMENT_MASTERY: 28,
            FIGHT_PROP_PHYSICAL_SUB_HURT: 29,
            FIGHT_PROP_PHYSICAL_ADD_HURT: 30,
            FIGHT_PROP_DEFENCE_IGNORE_RATIO: 31,
            FIGHT_PROP_DEFENCE_IGNORE_DELTA: 32,
            FIGHT_PROP_FIRE_ADD_HURT: 40,
            FIGHT_PROP_ELEC_ADD_HURT: 41,
            FIGHT_PROP_WATER_ADD_HURT: 42,
            FIGHT_PROP_GRASS_ADD_HURT: 43,
            FIGHT_PROP_WIND_ADD_HURT: 44,
            FIGHT_PROP_ROCK_ADD_HURT: 45,
            FIGHT_PROP_ICE_ADD_HURT: 46,
            FIGHT_PROP_HIT_HEAD_ADD_HURT: 47,
            FIGHT_PROP_FIRE_SUB_HURT: 50,
            FIGHT_PROP_ELEC_SUB_HURT: 51,
            FIGHT_PROP_WATER_SUB_HURT: 52,
            FIGHT_PROP_GRASS_SUB_HURT: 53,
            FIGHT_PROP_WIND_SUB_HURT: 54,
            FIGHT_PROP_ROCK_SUB_HURT: 55,
            FIGHT_PROP_ICE_SUB_HURT: 56,
            FIGHT_PROP_EFFECT_HIT: 60,
            FIGHT_PROP_EFFECT_RESIST: 61,
            FIGHT_PROP_FREEZE_RESIST: 62,
            FIGHT_PROP_TORPOR_RESIST: 63,
            FIGHT_PROP_DIZZY_RESIST: 64,
            FIGHT_PROP_FREEZE_SHORTEN: 65,
            FIGHT_PROP_TORPOR_SHORTEN: 66,
            FIGHT_PROP_DIZZY_SHORTEN: 67,
            FIGHT_PROP_MAX_FIRE_ENERGY: 70,
            FIGHT_PROP_MAX_ELEC_ENERGY: 71,
            FIGHT_PROP_MAX_WATER_ENERGY: 72,
            FIGHT_PROP_MAX_GRASS_ENERGY: 73,
            FIGHT_PROP_MAX_WIND_ENERGY: 74,
            FIGHT_PROP_MAX_ICE_ENERGY: 75,
            FIGHT_PROP_MAX_ROCK_ENERGY: 76,
            FIGHT_PROP_SKILL_CD_MINUS_RATIO: 80,
            FIGHT_PROP_SHIELD_COST_MINUS_RATIO: 81,
            FIGHT_PROP_CUR_FIRE_ENERGY: 1e3,
            FIGHT_PROP_CUR_ELEC_ENERGY: 1001,
            FIGHT_PROP_CUR_WATER_ENERGY: 1002,
            FIGHT_PROP_CUR_GRASS_ENERGY: 1003,
            FIGHT_PROP_CUR_WIND_ENERGY: 1004,
            FIGHT_PROP_CUR_ICE_ENERGY: 1005,
            FIGHT_PROP_CUR_ROCK_ENERGY: 1006,
            FIGHT_PROP_CUR_HP: 1010,
            FIGHT_PROP_MAX_HP: 2e3,
            FIGHT_PROP_CUR_ATTACK: 2001,
            FIGHT_PROP_CUR_DEFENSE: 2002,
            FIGHT_PROP_CUR_SPEED: 2003,
            FIGHT_PROP_NONEXTRA_ATTACK: 3e3,
            FIGHT_PROP_NONEXTRA_DEFENSE: 3001,
            FIGHT_PROP_NONEXTRA_CRITICAL: 3002,
            FIGHT_PROP_NONEXTRA_ANTI_CRITICAL: 3003,
            FIGHT_PROP_NONEXTRA_CRITICAL_HURT: 3004,
            FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY: 3005,
            FIGHT_PROP_NONEXTRA_ELEMENT_MASTERY: 3006,
            FIGHT_PROP_NONEXTRA_PHYSICAL_SUB_HURT: 3007,
            FIGHT_PROP_NONEXTRA_FIRE_ADD_HURT: 3008,
            FIGHT_PROP_NONEXTRA_ELEC_ADD_HURT: 3009,
            FIGHT_PROP_NONEXTRA_WATER_ADD_HURT: 3010,
            FIGHT_PROP_NONEXTRA_GRASS_ADD_HURT: 3011,
            FIGHT_PROP_NONEXTRA_WIND_ADD_HURT: 3012,
            FIGHT_PROP_NONEXTRA_ROCK_ADD_HURT: 3013,
            FIGHT_PROP_NONEXTRA_ICE_ADD_HURT: 3014,
            FIGHT_PROP_NONEXTRA_FIRE_SUB_HURT: 3015,
            FIGHT_PROP_NONEXTRA_ELEC_SUB_HURT: 3016,
            FIGHT_PROP_NONEXTRA_WATER_SUB_HURT: 3017,
            FIGHT_PROP_NONEXTRA_GRASS_SUB_HURT: 3018,
            FIGHT_PROP_NONEXTRA_WIND_SUB_HURT: 3019,
            FIGHT_PROP_NONEXTRA_ROCK_SUB_HURT: 3020,
            FIGHT_PROP_NONEXTRA_ICE_SUB_HURT: 3021,
            FIGHT_PROP_NONEXTRA_SKILL_CD_MINUS_RATIO: 3022,
            FIGHT_PROP_NONEXTRA_SHIELD_COST_MINUS_RATIO: 3023,
            FIGHT_PROP_NONEXTRA_PHYSICAL_ADD_HURT: 3024,
            1: "BASE_HP",
            2: "FIGHT_PROP_HP",
            3: "FIGHT_PROP_HP_PERCENT",
            4: "FIGHT_PROP_BASE_ATTACK",
            5: "FIGHT_PROP_ATTACK",
            6: "FIGHT_PROP_ATTACK_PERCENT",
            7: "FIGHT_PROP_BASE_DEFENSE",
            8: "FIGHT_PROP_DEFENSE",
            9: "FIGHT_PROP_DEFENSE_PERCENT",
            10: "FIGHT_PROP_BASE_SPEED",
            11: "FIGHT_PROP_SPEED_PERCENT",
            12: "FIGHT_PROP_HP_MP_PERCENT",
            13: "FIGHT_PROP_ATTACK_MP_PERCENT",
            20: "FIGHT_PROP_CRITICAL",
            21: "FIGHT_PROP_ANTI_CRITICAL",
            22: "FIGHT_PROP_CRITICAL_HURT",
            22.5: "FIGHT_PROP_CRITICAL_VALUE",
            23: "FIGHT_PROP_CHARGE_EFFICIENCY",
            24: "FIGHT_PROP_ADD_HURT",
            25: "FIGHT_PROP_SUB_HURT",
            26: "FIGHT_PROP_HEAL_ADD",
            27: "FIGHT_PROP_HEALED_ADD",
            28: "FIGHT_PROP_ELEMENT_MASTERY",
            29: "FIGHT_PROP_PHYSICAL_SUB_HURT",
            30: "FIGHT_PROP_PHYSICAL_ADD_HURT",
            31: "FIGHT_PROP_DEFENCE_IGNORE_RATIO",
            32: "FIGHT_PROP_DEFENCE_IGNORE_DELTA",
            40: "FIGHT_PROP_FIRE_ADD_HURT",
            41: "FIGHT_PROP_ELEC_ADD_HURT",
            42: "FIGHT_PROP_WATER_ADD_HURT",
            43: "FIGHT_PROP_GRASS_ADD_HURT",
            44: "FIGHT_PROP_WIND_ADD_HURT",
            45: "FIGHT_PROP_ROCK_ADD_HURT",
            46: "FIGHT_PROP_ICE_ADD_HURT",
            47: "FIGHT_PROP_HIT_HEAD_ADD_HURT",
            50: "FIGHT_PROP_FIRE_SUB_HURT",
            51: "FIGHT_PROP_ELEC_SUB_HURT",
            52: "FIGHT_PROP_WATER_SUB_HURT",
            53: "FIGHT_PROP_GRASS_SUB_HURT",
            54: "FIGHT_PROP_WIND_SUB_HURT",
            55: "FIGHT_PROP_ROCK_SUB_HURT",
            56: "FIGHT_PROP_ICE_SUB_HURT",
            60: "FIGHT_PROP_EFFECT_HIT",
            61: "FIGHT_PROP_EFFECT_RESIST",
            62: "FIGHT_PROP_FREEZE_RESIST",
            63: "FIGHT_PROP_TORPOR_RESIST",
            64: "FIGHT_PROP_DIZZY_RESIST",
            65: "FIGHT_PROP_FREEZE_SHORTEN",
            66: "FIGHT_PROP_TORPOR_SHORTEN",
            67: "FIGHT_PROP_DIZZY_SHORTEN",
            70: "FIGHT_PROP_MAX_FIRE_ENERGY",
            71: "FIGHT_PROP_MAX_ELEC_ENERGY",
            72: "FIGHT_PROP_MAX_WATER_ENERGY",
            73: "FIGHT_PROP_MAX_GRASS_ENERGY",
            74: "FIGHT_PROP_MAX_WIND_ENERGY",
            75: "FIGHT_PROP_MAX_ICE_ENERGY",
            76: "FIGHT_PROP_MAX_ROCK_ENERGY",
            80: "FIGHT_PROP_SKILL_CD_MINUS_RATIO",
            81: "FIGHT_PROP_SHIELD_COST_MINUS_RATIO",
            1e3: "FIGHT_PROP_CUR_FIRE_ENERGY",
            1001: "FIGHT_PROP_CUR_ELEC_ENERGY",
            1002: "FIGHT_PROP_CUR_WATER_ENERGY",
            1003: "FIGHT_PROP_CUR_GRASS_ENERGY",
            1004: "FIGHT_PROP_CUR_WIND_ENERGY",
            1005: "FIGHT_PROP_CUR_ICE_ENERGY",
            1006: "FIGHT_PROP_CUR_ROCK_ENERGY",
            1010: "FIGHT_PROP_CUR_HP",
            2e3: "FIGHT_PROP_MAX_HP",
            2001: "FIGHT_PROP_CUR_ATTACK",
            2002: "FIGHT_PROP_CUR_DEFENSE",
            2003: "FIGHT_PROP_CUR_SPEED",
            3e3: "FIGHT_PROP_NONEXTRA_ATTACK",
            3001: "FIGHT_PROP_NONEXTRA_DEFENSE",
            3002: "FIGHT_PROP_NONEXTRA_CRITICAL",
            3003: "FIGHT_PROP_NONEXTRA_ANTI_CRITICAL",
            3004: "FIGHT_PROP_NONEXTRA_CRITICAL_HURT",
            3005: "FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY",
            3006: "FIGHT_PROP_NONEXTRA_ELEMENT_MASTERY",
            3007: "FIGHT_PROP_NONEXTRA_PHYSICAL_SUB_HURT",
            3008: "FIGHT_PROP_NONEXTRA_FIRE_ADD_HURT",
            3009: "FIGHT_PROP_NONEXTRA_ELEC_ADD_HURT",
            3010: "FIGHT_PROP_NONEXTRA_WATER_ADD_HURT",
            3011: "FIGHT_PROP_NONEXTRA_GRASS_ADD_HURT",
            3012: "FIGHT_PROP_NONEXTRA_WIND_ADD_HURT",
            3013: "FIGHT_PROP_NONEXTRA_ROCK_ADD_HURT",
            3014: "FIGHT_PROP_NONEXTRA_ICE_ADD_HURT",
            3015: "FIGHT_PROP_NONEXTRA_FIRE_SUB_HURT",
            3016: "FIGHT_PROP_NONEXTRA_ELEC_SUB_HURT",
            3017: "FIGHT_PROP_NONEXTRA_WATER_SUB_HURT",
            3018: "FIGHT_PROP_NONEXTRA_GRASS_SUB_HURT",
            3019: "FIGHT_PROP_NONEXTRA_WIND_SUB_HURT",
            3020: "FIGHT_PROP_NONEXTRA_ROCK_SUB_HURT",
            3021: "FIGHT_PROP_NONEXTRA_ICE_SUB_HURT",
            3022: "FIGHT_PROP_NONEXTRA_SKILL_CD_MINUS_RATIO",
            3023: "FIGHT_PROP_NONEXTRA_SHIELD_COST_MINUS_RATIO",
            3024: "FIGHT_PROP_NONEXTRA_PHYSICAL_ADD_HURT"
        }

        for (const [id, value] of Object.entries(stats)){
            //const name = G[id];
            if (value === 0 || [1010, 1, 2, 2001, 4, 5, 2002, 7, 8, 70, 71, 72, 73, 74, 75, 76, 1e3, 2e3, 1001, 1002,
                1003, 1004, 1005, 1006, 3045, 3046].includes(parseInt(id))) continue;
            if ([12, 15, 18, 21, 24].includes(Math.round(value * 100)) && [11510, 11509, 15511, 13507, 14501].includes(weapon.itemId)) continue;

            let amt = getSerialised(G[id], Math.round(value * 1000) / 10).replace(' +', ': ');
            if (!amt.endsWith('%')) amt = getSerialised(G[id], Math.round(value)).replace('+', '');

            output += amt + '\n';
        }
        embed.addField(statsText, output.trim(), false);

        //Constellation
        const constellation = char.talentIdList?.length ?? 0;
        const fortuna = (charInfo.qualityType === 'QUALITY_ORANGE' ? '<:5StarObtained:1128673274361024523>' : '<:4StarObtained:1128673268463845467>').repeat(constellation);
        const nonfortuna = (charInfo.qualityType === 'QUALITY_ORANGE' ? '<:5StarUnobtained:1128673277473210479>' : '<:4StarUnobtained:1128673272133845173>').repeat(6 - constellation);
        embed.addField(consText, '[' + fortuna + nonfortuna + ']', true);

        //Talents
        //Ayaka & Mona Sprint
        if ([10000002, 10000041].includes(char.avatarId)) {
            delete char.skillLevelMap['10013'];
            delete char.skillLevelMap['10413'];
        }

        const talentLevels = Object.values(char.skillLevelMap);
        function emojify(number){
            return [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:',
                '🔟', '<:11:979622224812208149>', '<:12:979622225130946590>', '<:13:979622225122578452>'][number];
        }

        if (constellation >= 5){
            talentLevels[1] = emojify(talentLevels[1] + 3);
            talentLevels[talentLevels.length - 1] = emojify(talentLevels[talentLevels.length - 1] + 3);
        } else if (constellation >= 3){
            if (c3Avatars.includes(char.avatarId.toString())) talentLevels[talentLevels.length - 1] = emojify(talentLevels[talentLevels.length - 1] + 3);
            else talentLevels[1] = emojify(talentLevels[1] + 3);
        }
        //Childe Passive
        if (char.avatarId === 10000033) talentLevels[0] = emojify(talentLevels[0] + 1);
        character.talents = { na: talentLevels[0], e: talentLevels[1], q: talentLevels[2] };

        embed.addField(talentsText, talentLevels.join('/'), true);

        //Split into 2 pages
        const oldEmbed = embed;
        embed = new MessageEmbed(oldEmbed).setFields();
        embed.author.name = charArtText.replace('{0}', embed.author.name);
        oldEmbed.author.name = charStatText.replace('{0}', oldEmbed.author.name);
        pages.push(oldEmbed);

        //Artifacts
        const friendlyPieceName = {
            EQUIP_BRACER: flowerText,
            EQUIP_NECKLACE: plumeText,
            EQUIP_SHOES: sandsText,
            EQUIP_RING: gobletText,
            EQUIP_DRESS: circletText
        };
        const set = {};
        for (const i in char.equipList){
            const piece = char.equipList[i];
            const name = '__' + artifactEmojis.Emotes.find(e => e.includes(piece.flat.icon)) + ' ' +
                friendlyPieceName[piece.flat.equipType] + ' +' + (piece.reliquary.level - 1) + '__';
            const subs = piece.flat.reliquarySubstats?.map(substat => getSerialised(substat.appendPropId, substat.statValue)) ?? ['--'];
            subs.unshift('**' + getSerialised(piece.flat.reliquaryMainstat.mainPropId, piece.flat.reliquaryMainstat.statValue) + '**');
            const value = subs.join('\n');

            //const setId = piece.flat.setNameTextMapHash;
            const setId = piece.flat.icon.split('_')[2];
            if (!set[setId]) set[setId] = 0;
            set[setId]++;

            embed.addField(name, value, true);
        }
        let setBonuses = '';
        for (const [id, amt] of Object.entries(set)){
            if (amt === 1) continue;
            if (amt >= 4) setBonuses = twoPcText.replace('{0}', artifactEmojis.Emotes.find(e => e.includes(id + '_4'))) + '\n' +
                fourPcText.replace('{0}', artifactEmojis.Emotes.find(e => e.includes(id + '_3')));
            else setBonuses += twoPcText.replace('{0}', artifactEmojis.Emotes.find(e => e.includes(id + '_' + (setBonuses === '' ? '4' : '3')))) + '\n';
        }
        embed.addField(setBonusText,setBonuses || noSetBonusText, true);

        char.equipList.push(weapon);
        pages.push(embed);
    }
    jsonSave('./data/profiles/' + uid + '.json', newCache);
    jsonSave('./data/leaderboards/artifacts/' + uid + '.json', artifactList);
    jsonSave('./data/leaderboards/builds/' + uid + '.json', buildsList);

    return new ProfileMessage(interaction, pages, characterMap);
}

module.exports = { name, description, options, filter, execute };