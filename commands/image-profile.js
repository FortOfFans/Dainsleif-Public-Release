const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton, MessageAttachment} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, jsonSave, translate, untranslate, ambrApi, ambrLocale, readFile, readFileImg} = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");
const Character = require('../util/struct/Character');
const axios = require('axios');
const C = require('canvas');
const {createCanvas, registerFont, loadImage, CanvasRenderingContext2D} = require('canvas');

const name = translate('profilecard');
const description = translate('Creates a build card image with a user\'s characters');
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

async function ccard(id, uhu, p, q, gg) {

    const nli = jsonParse('./data/leaderboards/names.json', {})
    const ar = jsonParse('./data/leaderboards/ar.json', {})
    const wl = jsonParse('./data/leaderboards/wl.json', {})

    let givenUid
    if (gg.options.getString('uid')) givenUid = gg.options.getString('uid');

    const linkedUids = jsonParse('./data/linked.json', {})[gg.user.id];
    const linkedUids2 = jsonParse('./data/linked.json', {})

    let user
    if (gg.options.getUser('user')) user = gg.options.getUser('user').id

    let uid
    if (givenUid) uid = linkedUids?.[parseInt(givenUid ?? '1') - 1];
    if (user) uid = parseInt(linkedUids2[user]?.[0])
    if (!givenUid && !user) uid = jsonParse('./data/linked.json', {})[gg.user.id]?.[0]

    const bg = {Fire: 'Pyro', Ice: 'Cryo', Grass: 'Dendro', Electric: 'Electro', Water: 'Hydro', Rock: 'Geo', Wind: 'Anemo'}
    const arti = id.equipList
    const locs = jsonParse('./data/loc.json', {})
    const c = C.createCanvas(1145, 1080);
    const {element: ifo, icon} = await ambrApi('/avatar/' + uhu, 'en-GB');
    const ctx = c.getContext('2d');
    const stats = Object.entries(id.fightPropMap).filter(([id, amt]) => amt).filter(([s]) => !['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(s)).map(([a, b]) => a)
    const stats2 = Object.entries(id.fightPropMap).filter(([id, amt]) => amt).filter(([s]) => !['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(s)).map(([a, b]) => b)
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

    // for ( const str of  Object.values(await ambrApi('/manualWeapon', gg.locale))) translate(str)
    const fN = {
        FIGHT_PROP_BASE_HP: translate('Base HP', gg.locale),
        FIGHT_PROP_HP: translate('HP', gg.locale),
        FIGHT_PROP_HP_PERCENT: translate('HP', gg.locale),
        FIGHT_PROP_BASE_ATTACK: translate('Base ATK', gg.locale),
        FIGHT_PROP_ATTACK: translate('ATK', gg.locale),
        FIGHT_PROP_ATTACK_PERCENT: translate('ATK', gg.locale),
        FIGHT_PROP_BASE_DEFENSE: translate('Base DEF', gg.locale),
        FIGHT_PROP_DEFENSE: translate('DEF', gg.locale),
        FIGHT_PROP_DEFENSE_PERCENT: translate('DEF', gg.locale),
        FIGHT_PROP_BASE_SPEED: translate('Movement SPD', gg.locale),
        FIGHT_PROP_SPEED_PERCENT: translate('Movement SPD', gg.locale),
        FIGHT_PROP_CRITICAL: translate('CRIT Rate', gg.locale),
        FIGHT_PROP_CRITICAL_HURT: translate('CRIT DMG', gg.locale),
        FIGHT_PROP_ELEMENT_MASTERY: translate('Elemental Mastery', gg.locale),
        FIGHT_PROP_CHARGE_EFFICIENCY: translate('Energy Recharge', gg.locale),
        FIGHT_PROP_ADD_HURT: translate('DMG Bonus', gg.locale),
        FIGHT_PROP_HEAL_ADD: translate('Healing Bonus', gg.locale),
        FIGHT_PROP_HEALED_ADD: translate('Incoming Healing Bonus', gg.locale),
        FIGHT_PROP_MAX_FIRE_ENERGY: translate('Pyro DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_ELEC_ENERGY: translate('Electro DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_WATER_ENERGY: translate('Hydro DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_GRASS_ENERGY: translate('Dendro DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_WIND_ENERGY: translate('Anemo DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_ICE_ENERGY: translate('Cryo DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_ROCK_ENERGY: translate('Geo DMG Bonus', gg.locale),
        FIGHT_PROP_FIRE_ADD_HURT: translate('Pyro DMG Bonus', gg.locale),
        FIGHT_PROP_WATER_ADD_HURT: translate('Hydro DMG Bonus', gg.locale),
        FIGHT_PROP_GRASS_ADD_HURT: translate('Dendro DMG Bonus', gg.locale),
        FIGHT_PROP_ELEC_ADD_HURT: translate('Electro DMG Bonus', gg.locale),
        FIGHT_PROP_ICE_ADD_HURT: translate('Cryo DMG Bonus', gg.locale),
        FIGHT_PROP_WIND_ADD_HURT: translate('Anemo DMG Bonus', gg.locale),
        FIGHT_PROP_PHYSICAL_ADD_HURT: translate('Physical DMG Bonus', gg.locale),
        FIGHT_PROP_ROCK_ADD_HURT: translate('Geo DMG Bonus', gg.locale),
        FIGHT_PROP_MAX_HP: translate('Max HP', gg.locale),
        FIGHT_PROP_CUR_ATTACK: translate('ATK', gg.locale),
        FIGHT_PROP_CUR_DEFENSE: translate('DEF', gg.locale),
        FIGHT_PROP_SHIELD_COST_MINUS_RATIO: translate('Shield Strength', gg.locale),
        FIGHT_PROP_ATTACK_PERCENT_A: translate('ATK Percentage', gg.locale),
        FIGHT_PROP_DEFENSE_PERCENT_A: translate('DEF Percentage', gg.locale),
        FIGHT_PROP_HP_PERCENT_A: translate('HP Percentage', gg.locale),
    }

    const charCel = jsonParse('./data/charSkill.json', {})
    const hel = id.avatarId + ([10000005, 10000007].includes(id.avatarId) ? '-' + id.skillDepotId : '')
    const background = await C.loadImage('./data/conste/' + bg[(Object.entries(charCel).filter(([a, b]) => a.includes(hel)).map(([a, b]) => b)[0]?.Element ?? ifo)] + '.png')
    ctx.drawImage(background, 0, 0, c.width, c.height)
    registerFont('./data/fonts/zh-cn2.ttf', {
        family: 'SDK_SC_Web Heavy'
    });

    let x = 0
    let y = 0
    let t = 0
    let z = 0

    for (let i = 0; i < arti.length - 1; i++) {

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(0 + p, 0 + q + y, 1064, 83, 10)
        ctx.fillStyle = "rgba(0,0,0, .50)"
        ctx.fill();
        // ctx.clip();

        ctx.globalAlpha = 1
        await loadImage('https://api.ambr.top/assets/UI/reliquary/' + arti[i]?.flat.icon + '.png')
            .then((img) => {
                ctx.drawImage(img, 0 + p, 0 + q + y, 80, 80)
            })

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(50 + p, 55 + q + y, 35, 20, 2)
        ctx.fillStyle = "rgba(0,0,0, .50)"
        ctx.fill();

        ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.fillStyle = 'rgba(225,225,225,1)';
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText('+' + (arti[i]?.reliquary.level - 1), 65 + p, 75 + q + y, 741)

        const piece = arti[i]
        let l = y
        for (let o = 0; o < piece.flat.rankLevel; o++) {
            await loadImage(fs.readFileSync('./GenshinStar.png'))
                .then((img) => {
                    ctx.drawImage(img, 260 + p, 83 / 2 - (10 * piece.flat.rankLevel / 2) - 5 + q + l, 10, 10)
                })
            l += 13
        }

        ctx.font = '25px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.fillStyle = 'rgba(225,225,225,1)';
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        //Artifact: Main Stats
        ctx.globalAlpha = 1
        await loadImage((fs.readFileSync('./data/staticon/' + arti[i]?.flat.reliquaryMainstat.mainPropId + '.png')))
            .then((img) => {
                ctx.drawImage(img, 90 + p, 18 + q + y, 45, 45)
            })
        if (/CRITICAL|PERCENT|ADD_HURT|CHARGE|HEAL_ADD/.test(arti[i]?.flat.reliquaryMainstat.mainPropId)) {
            ctx.fillText('+' + arti[i]?.flat.reliquaryMainstat.statValue + '%', 140 + p, 41.5 + q + y, 741)
        } else {
            ctx.fillText('+' + arti[i]?.flat.reliquaryMainstat.statValue, 140 + p, 41.5 + q + y, 741)
        }


        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(0 + p, 0 + q + y, 65, 25, 5)
        ctx.fillStyle = "rgba(0,0,0, .35)"
        ctx.fill();

        const CR = Object.entries(arti[i]?.flat.reliquarySubstats).find(([a, b]) => b.appendPropId === 'FIGHT_PROP_CRITICAL')?.[1]
        const CDMG = Object.entries(arti[i]?.flat.reliquarySubstats).find(([a, b]) => b.appendPropId === 'FIGHT_PROP_CRITICAL_HURT')?.[1]


        await loadImage((fs.readFileSync('./data/staticon/FIGHT_PROP_CRITICAL_VALUE.png')))
            .then((img) => {
                ctx.drawImage(img, 2.5 + p, 2.5 + q + y, 20, 20)
            })
        ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(225,225,225,1)';
        ctx.fillText(Math.round((CR?.statValue * 2 || 0) * 10 + (CDMG?.statValue || 0) * 10) / 10, 25 + p, 12.5 + q + y, 38)

        ctx.font = '25px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        //Artifact: Sub Stats
        let j = 0
        for (const sub2 of arti[i]?.flat.reliquarySubstats) {
            if (/CRITICAL|PERCENT|ADD_HURT|CHARGE/.test(sub2.appendPropId)) {
                ctx.fillText('+' + sub2.statValue + '%', 360 + p + j, 41.5 + q + y, 741)
            } else {
                ctx.fillText('+' + sub2.statValue, 360 + p + j, 41.5 + q + y, 741)
            }
            j += 190
        }

        let t = 0
        for (const sub of arti[i]?.flat.reliquarySubstats) {
            try {

                ctx.globalAlpha = 1
                await loadImage((fs.readFileSync('./data/staticon/' + sub.appendPropId + '.png')))
                    .then((img) => {
                        ctx.drawImage(img, 306 + p + t, 20.75 + q + y, 45, 45)
                    })
            } catch (error) {
                console.error(error);
            }
            t += 190
            z += 1
        }


        x += 300
        y += 100;
    }

    const cE = jsonParse('./data/emojis/charEmote.json', {})
    const background3 = await C.loadImage('./data/conste/Profile Boarder.png')
    ctx.drawImage(background3, 0, 0, c.width, c.height)

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '20px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'

    const charConst = jsonParse('./data/charSkill.json', {})

    let y3 = 0
    for (let i = 0; i < 6; i++) {
        await loadImage('https://enka.network/ui/' + (Object.entries(charCel).filter(([a, b]) => a.includes(hel)).map(([a, b]) => b)[0]?.Consts[i] ?? charConst[id.avatarId]?.Consts[i]) + '.png')
            .then((img) => {
                ctx.drawImage(img, 410 + p, 70 + y3, 60, 60)
            })
        y3 += 70
    }

    ctx.shadowColor = "rgba(0, 0, 0, .8)";
    ctx.shadowBlur = 10;

    let y4 = 0
    if (id.talentIdList) {
        for (let i = 0; i < 6 - id.talentIdList.length; i++) {
            ctx.shadowBlur = 0
            ctx.lineWidth = 13;
            ctx.strokeStyle = 'rgba(236, 229, 216, 0)';
            ctx.fillStyle = "rgba(0, 0, 0, .25)"

            ctx.beginPath();
            ctx.arc(480, 453 + y4, 30, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.shadowBlur = 10;
            await loadImage((fs.readFileSync('./data/profilegen/UI_IconSmall_Lock.png')))
                .then((img) => {
                    ctx.drawImage(img, 425 + p, 435 + y4, 30, 30)
                })
            y4 += -70
        }
    } else {
        for (let i = 0; i < 6; i++) {
            ctx.lineWidth = 13;
            ctx.strokeStyle = 'rgba(236, 229, 216, 0)';
            ctx.fillStyle = "rgba(0, 0, 0, .25)"

            ctx.beginPath();
            ctx.arc(480, 453 + y4, 30, 0, Math.PI * 2, true);
            ctx.fill();
            await loadImage((fs.readFileSync('./data/profilegen/UI_IconSmall_Lock.png')))
                .then((img) => {
                    ctx.drawImage(img, 425 + p, 435 + y4, 30, 30)
                })
            y4 += -70
        }
    }
    ctx.shadowBlur = 0;

    let y5 = 0
    for (let i = 0; i < 6; i++) {
        const eN = {
            Electric: 'Electro',
            Fire: 'Pyro',
            Grass: 'Dendro',
            Ice: 'Cryo',
            Rock: 'Geo',
            Water: 'Hydro',
            Wind: 'Anemo'
        }
        ctx.shadowBlur = 0;

        await loadImage(fs.readFileSync('./data/rings/Skill_Ring_' + eN[(Object.entries(charCel).filter(([a, b]) => a.includes(hel)).map(([a, b]) => b)[0]?.Element ?? ifo)] + '.png'))
            .then((img) => {
                ctx.drawImage(img, 405 + p, 61.5 + y5, 70, 77)
            })
        y5 += 70
    }

    ctx.fillStyle = "rgba(225, 225, 255, 1)"
    await loadImage(fs.readFileSync('./data/staticon/Friendship.png'))
        .then((img) => {
            ctx.drawImage(img, 0, 0, img.width, img.height, 180, 155, 24, 24)
        })
    ctx.textAlign = 'left';
    ctx.fillText(parseInt(id.fetterInfo?.expLevel), 210, 155)

    await loadImage(fs.readFileSync('./data/staticon/CEXP.png'))
        .then((img) => {
            ctx.drawImage(img, 0, 0, img.width, img.height, 340, 155, 24, 24)
        })
    ctx.fillText(id.propMap?.['4001']?.ival, 370, 155)

    const lw = ctx.measureText(id.propMap?.['4001']?.ival).width
    const lw2 = ctx.measureText('/').width

    ctx.fillText('/', 370 + lw, 155)
    ctx.fillStyle = "rgba(182, 182, 182, .75)"
    ctx.fillText(Math.ceil(id.propMap?.['4001']?.ival / 10) * 10, 370 + lw + lw2 + 3, 155)

    let gicon = jsonParse('./data/emojis/sticker.json', {})

    let zicon = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id.avatarId] + '.png'

    let micon = 'https://api.ambr.top/assets/UI/' + icon + '.png'

    if (gicon[id?.avatarId]) {
        await loadImage(gicon[id.avatarId])
            .then((img) => {
                ctx.drawImage(img, 170, 180, 240, 240)
            })
    } else if (cE[id?.avatarId]) {
        await loadImage(zicon)
            .then((img) => {
                ctx.drawImage(img, 170, 180, 240, 240)
            })
    } else {
        await loadImage(micon)
            .then((img) => {
                ctx.drawImage(img, 170, 180, 240, 240)
            })
    }


    await loadImage((fs.readFileSync('./data/ascension/logo3.png')))
        .then((img) => {
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height)
        })

    // Full Stats
    {
        let y2 = 0

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(695, 65 + y2, 385, 30, 5)
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        ctx.fill();
        ctx.fillStyle = "rgba(225, 225, 225, 1)"
        await loadImage((fs.readFileSync('./data/staticon/' + (G[Object.entries(id.fightPropMap).filter(([a, b]) => ['2000'].includes(a)).map(([a, b]) => a)]).replace('_MAX', '') + '.png')))
            .then((img) => {
                ctx.drawImage(img, 660 + p, 67 + y2, 25, 25)
            })
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(Object.entries(id.fightPropMap).filter(([a, b]) => ['2000'].includes(a)).map(([a, b]) => b)), 1030 + p, 67 + y2)
        ctx.textAlign = 'left';
        ctx.fillText(fN[G[Object.entries(id.fightPropMap).filter(([a, b]) => ['2000'].includes(a)).map(([a, b]) => a)]], 700 + p, 67 + y2)
        y2 += 40

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(695, 65 + y2, 385, 30, 5)
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        ctx.fill();
        ctx.fillStyle = "rgba(225, 225, 225, 1)"
        await loadImage((fs.readFileSync('./data/staticon/' + (G[Object.entries(id.fightPropMap).filter(([a, b]) => ['2001'].includes(a)).map(([a, b]) => a)]).replace('_CUR', '') + '.png')))
            .then((img) => {
                ctx.drawImage(img, 660 + p, 67 + y2, 25, 25)
            })
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(Object.entries(id.fightPropMap).filter(([a, b]) => ['2001'].includes(a)).map(([a, b]) => b)), 1030 + p, 67 + y2)
        ctx.textAlign = 'left';
        ctx.fillText(fN[G[Object.entries(id.fightPropMap).filter(([a, b]) => ['2001'].includes(a)).map(([a, b]) => a)]], 700 + p, 67 + y2)
        y2 += 40

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(695, 65 + y2, 385, 30, 5)
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        ctx.fill();
        ctx.fillStyle = "rgba(225, 225, 225, 1)"
        await loadImage((fs.readFileSync('./data/staticon/' + (G[Object.entries(id.fightPropMap).filter(([a, b]) => ['2002'].includes(a)).map(([a, b]) => a)]).replace('_CUR', '') + '.png')))
            .then((img) => {
                ctx.drawImage(img, 660 + p, 67 + y2, 25, 25)
            })
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(Object.entries(id.fightPropMap).filter(([a, b]) => ['2002'].includes(a)).map(([a, b]) => b)), 1030 + p, 67 + y2)
        ctx.textAlign = 'left';
        ctx.fillText(fN[G[Object.entries(id.fightPropMap).filter(([a, b]) => ['2002'].includes(a)).map(([a, b]) => a)]], 700 + p, 67 + y2)
        y2 += 40

        for (let i = 0; i < stats.length - 1; i++) {
            if (stats2[i] < 0) continue
            if (['11', '22.5', '30', '40', '41', '42', '43', '44', '45', '46', '50', '51', '52', '53', '54', '55', '56', '70', '71', '72', '73', '74', '75', '76', '81', '1000', '1001', '1002', '1003', '1004', '1005', '1006', '1010', '2000', '2001', '2002', '2003', '3025', '3026', '3027', '3028', '3029', '3030', '3031', '3032', '3033', '3034', '3035', '3036', '3037', '3038', '3039', '3040', '3041', '3042', '3043', '3044', '3045', '3046'].includes(stats[i])) continue;
            if (fs.readFileSync('./data/staticon/' + (G[stats[i]]).replace('_BASE', '').replace('_MAX', '') + '.png') !== null) {
                ctx.strokeStyle = "rbg(255, 0, 0)";
                ctx.beginPath();
                ctx.roundRect(695, 65 + y2, 385, 30, 5)
                ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
                ctx.fill();
                ctx.fillStyle = "rgba(225, 225, 225, 1)"
                await loadImage((fs.readFileSync('./data/staticon/' + (G[stats[i]]).replace('_BASE', '').replace('_MAX', '') + '.png')))
                    .then((img) => {
                        ctx.drawImage(img, 660 + p, 67 + y2, 25, 25)
                        ctx.textAlign = 'left';
                        ctx.fillText(fN[G[stats[i]]], 700 + p, 67 + y2)
                        ctx.textAlign = 'right';
                        if (/CRITICAL|PERCENT|ADD_HURT|CHARGE|HEAL_ADD|SHIELD_COST_MINUS_RATIO/.test(G[stats[i]])) {
                            ctx.fillText(Math.round(stats2[i] * 1000) / 10 + '%', 1030 + p, 67 + y2)
                        } else {
                            ctx.fillText(Math.round(stats2[i]), 1030 + p, 67 + y2)
                        }
                    })
                y2 += 40
            } else {
            }
        }
        const dmgBonus = ['30', '40', '41', '42', '43', '44', '45', '46'].map(n => stats2[stats.indexOf(n)]).sort((a, b) => b - a)[0];
        const dmgBonus2 = ['30', '40', '41', '42', '43', '44', '45', '46'].map(n => stats[stats2.indexOf(dmgBonus)]).sort((a, b) => b - a)[0];
        if (dmgBonus > 0) {
            ctx.strokeStyle = "rbg(255, 0, 0)";
            ctx.beginPath();
            ctx.roundRect(695, 65 + y2, 385, 30, 5)
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
            ctx.fill();
            ctx.fillStyle = "rgba(225, 225, 225, 1)"
            await loadImage((fs.readFileSync('./data/staticon/' + (G[dmgBonus2]).replace('_MAX', '') + '.png')))
                .then((img) => {
                    ctx.drawImage(img, 660 + p, 67 + y2, 25, 25)
                })
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(dmgBonus * 1000) / 10 + '%', 1030 + p, 67 + y2)
            ctx.textAlign = 'left';
            ctx.fillText(fN[G[dmgBonus2]], 700 + p, 67 + y2)
            y2 += 40
        }

        if (Object.entries(id.fightPropMap).filter(([a, b]) => ['20'].includes(a)).map(([a, b]) => b) > 0) {
            ctx.strokeStyle = "rbg(255, 0, 0)";
            ctx.beginPath();
            ctx.roundRect(695, 65 + y2, 385, 30, 5)
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
            ctx.fill();
            ctx.fillStyle = "rgba(225, 225, 225, 1)"
            await loadImage((fs.readFileSync('./data/staticon/FIGHT_PROP_CRITICAL_VALUE.png')))
                .then((img) => {
                    ctx.drawImage(img, 660 + p, 67 + y2, 25, 25)
                })
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(Object.entries(id.fightPropMap).filter(([a, b]) => ['22.5'].includes(a)).map(([a, b]) => b)), 1030 + p, 67 + y2)
            ctx.textAlign = 'left';
            ctx.fillText('Total CRIT Value', 700 + p, 67 + y2)
        } else {
        }
    }


    let csn;
    if (id.proudSkillExtraLevelMap) csn = Object.entries(id.proudSkillExtraLevelMap).filter(([a, b]) => b).map(([a, b]) => a)

    let csID;
    if (csn) csID = Object.entries(charConst[id.avatarId + ([10000005, 10000007].includes(id.avatarId) ? '-' + id.skillDepotId : '')]?.ProudMap ?? {}).find(([a, b]) => b === parseInt(csn))

    let csID2;
    if (csn) csID2 = Object.entries(charConst[id.avatarId + ([10000005, 10000007].includes(id.avatarId) ? '-' + id.skillDepotId : '')]?.ProudMap ?? {}).find(([a, b]) => b === parseInt(csn[1]))

    // Talent-levels
    let y6 = 0
    for (let i = 0; i < 3; i++) {
        ctx.shadowBlur = 0
        ctx.lineWidth = 13;
        ctx.strokeStyle = 'rgba(236, 229, 216, 0)';
        ctx.fillStyle = "rgba(0, 0, 0, .25)"

        ctx.beginPath();
        ctx.arc(107.5, 177.5 + y6, 40, 0, Math.PI * 2, true);
        ctx.fill();

        await loadImage('https://enka.network/ui/' + (Object.entries(charCel).filter(([a, b]) => a.includes(hel)).map(([a, b]) => b)[0]?.Skills?.[charCel?.[hel]?.SkillOrder[i] ?? Object.keys(id.skillLevelMap)[i]] ?? charConst[id.avatarId]?.Skills?.[Object.keys(id.skillLevelMap)[i]]) + '.png')
            .then((img) => {
                ctx.drawImage(img, 37.5 + p, 150 + y6, 60, 60)
            })

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(92.5, 205 + y6, 30, 20, 5)

        if (/10331/.test(charCel?.[hel]?.SkillOrder[i])) {
            if (parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => a === charCel?.[hel]?.SkillOrder[i].toString()).map(([a, b]) => b)) >= 10) {
                await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_104319.png')
                    .then((img) => {
                        ctx.drawImage(img, 57, 162 + y6, 25, 25)
                    })
            }
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            ctx.fillStyle = 'rgba(225,225,225,1)';
            ctx.fillText(parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => a === charCel?.[hel]?.SkillOrder[i].toString()).map(([a, b]) => b)) + 1, 107, 225 + y6)
            ctx.fillStyle = "rgba(56, 255, 255, .35)"
        } else if (charCel?.[hel]?.SkillOrder[i] === parseInt(csID?.[0])) {
            if (parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => a === charCel?.[hel]?.SkillOrder[i].toString()).map(([a, b]) => b)) >= 10) {
                await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_104319.png')
                    .then((img) => {
                        ctx.drawImage(img, 57, 162 + y6, 25, 25)
                    })
            }
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            ctx.fillStyle = 'rgba(225,225,225,1)';
            ctx.fillText(parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => a === charCel?.[hel]?.SkillOrder[i].toString()).map(([a, b]) => b)) + 3, 107, 225 + y6)
            ctx.fillStyle = "rgba(56, 255, 255, .35)"
        } else if (charCel?.[hel]?.SkillOrder[i] === parseInt(csID2?.[0])) {
            if (Object.keys(id.skillLevelMap)[i] === '10013') continue
            if (parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => a === charCel?.[hel]?.SkillOrder[i].toString()).map(([a, b]) => b)) >= 10) {
                await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_104319.png')
                    .then((img) => {
                        ctx.drawImage(img, 57, 162 + y6, 25, 25)
                    })
            }
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            ctx.fillStyle = 'rgba(225,225,225,1)';
            ctx.fillText(parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => a === charCel?.[hel]?.SkillOrder[i].toString()).map(([a, b]) => b)) + 3, 107, 225 + y6)
            ctx.fillStyle = "rgba(56, 255, 255, .35)"
        } else {
            if (parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => parseInt(a) === charCel?.[hel]?.SkillOrder[i]).map(([a, b]) => b)) >= 10) {
                await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_104319.png')
                    .then((img) => {
                        ctx.drawImage(img, 57, 162 + y6, 25, 25)
                    })
            }
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            ctx.fillStyle = 'rgba(225,225,225,1)';
            ctx.fillText(parseInt(Object.entries(id.skillLevelMap).filter(([a, b]) => parseInt(a) === charCel?.[hel]?.SkillOrder[i]).map(([a, b]) => b)), 107, 225 + y6)
            ctx.fillStyle = "rgba(225, 255, 255, .35)"
        }

        ctx.fill();
        ctx.beginPath();
        y6 += 120
    }

    let y8 = 0
    for (const [key, value] of Object.entries(id.equipList[id.equipList.length - 1].flat?.weaponStats)) {
        ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#ffffff'
        if (/CRITICAL|PERCENT|ADD_HURT|CHARGE|HEAL_ADD|SHIELD_COST_MINUS_RATIO/.test(value?.appendPropId)) {
            ctx.fillText(value?.statValue + '%', 545 + y8, 220)
        } else {
            ctx.fillText(value?.statValue, 545 + y8, 220)
        }
        await loadImage((fs.readFileSync('./data/staticon/' + (value?.appendPropId).replace('_BASE', '') + '.png')))
            .then((img) => {
                ctx.drawImage(img, 522 + y8, 218, 20, 20)
            })
        y8 += 75

    }

    ctx.font = '40px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(nli?.[(givenUid ?? uid)].replace(/ㅤ/gi, '  ').replace(/୧/g, ' ').replace("\\p{Zs}+", " ").replace("\\h+", " ").replace("(?U)\\s+", " ").replace(/\s/g, ' '), 80, 110)

    ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(translate('AR {0} · WL {0}', gg.locale)
        .replace('{0}', ar?.[(givenUid ?? uid)])
        .replace('{0}', wl?.[(givenUid ?? uid)]) + ' ' + translate('· UID: {1}', gg.locale).replace('{1}', (givenUid ?? uid)), 80, 130)
    const bg2 = {
        5: 'SSR',
        4: 'SR',
        3: 'R',
        2: 'N',
        1: 'U'
    }

    await loadImage('https://enka.network/ui/' + id.equipList[id.equipList.length - 1].flat?.icon + '.png')
        .then((img) => {
            ctx.drawImage(img, 535, 70, 135, 135)
        })
    if (id.equipList[id.equipList.length - 1].flat?.rankLevel) {

        await loadImage(fs.readFileSync('./data/profilegen/' + bg2[id.equipList[id.equipList.length - 1].flat?.rankLevel] + '_light.png'))
            .then((img) => {
                ctx.drawImage(img, 495, 193, img.width * .55, img.height * .55)
            })
    } else {
        await loadImage(fs.readFileSync('./data/profilegen/U_light.png'))
            .then((img) => {
                ctx.drawImage(img, 495, 193, img.width * .55, img.height * .55)
            })
    }
    if (id.equipList[id.equipList.length - 1].weapon.affixMap) {
        await loadImage(fs.readFileSync('./data/profilegen/R' + (parseInt(Object.values(id.equipList[id.equipList.length - 1].weapon.affixMap)) + 1) + '.png'))
            .then((img) => {
                ctx.drawImage(img, 530, 100, img.width * .8, img.height * .8)
            })
    } else {
    }


    ctx.font = '15px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Lv. ' + id.equipList[id.equipList.length - 1].weapon?.level, 530, 77)

    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    ctx.font = '15px BurbankBigCondensed-Black, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(225, 225, 225, .8)'
    ctx.fillText(d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear(), 1075, 1010)

    await loadImage(fs.readFileSync('./data/profilegen/EnkaLogo.png'))
        .then((img) => {
            ctx.drawImage(img, 150, 400, img.width * .7, img.height * .7)
        })

    const buffer2 = c.toBuffer('image/jpeg', {quality: 1})
    return buffer2
}

class ProfileMessage extends PagedMessage {
    characterMap = {};
    pagedMessage;
    timeLeft = 10 * 60 * 1000;

    constructor(interaction, enkaUrl, characterMap) {
        const selectRow = new MessageActionRow();
        const selectMenu = new MessageSelectMenu()
            .setPlaceholder(translate('Select a Character', interaction.locale))
            .setCustomId('charselect');

        const emojiMap = jsonParse('./data/emojis/characterEmojis.json', {});

        for (const character in characterMap) {
            const label = character;
            const value = character;
            const emoji = emojiMap[untranslate(character, interaction.locale)];

            if (selectMenu.options.length < 20) selectMenu.addOptions({label, value, emoji});
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

        const pages = [{content: '** **'}].map((page) => Object({
            ...page,
            embeds: [],
            components: [btnRow, selectRow]
        }));
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
        setInterval(() => this.timeLeft -= 1000, 1000);
        this.characterMap = characterMap;
        this.enkaUrl = enkaUrl;
    }

    onInitFinish() {
        this.end().then(() => {
            const filter = i => this.interaction.user.id === i.user.id;
            this.collector = this.message?.createMessageComponentCollector({filter, time: this.time});

            this.collector?.on('collect', async i => {
                await i.deferUpdate().catch(() => {
                });

                if (i.componentType === 'BUTTON' && ['stats', 'art'].includes(i.customId))
                    return this.setPage(this.characterMap[this.selected][i.customId]);

                if (i.customId !== 'charselect') return null;

                this.selected = i.values[0];
                const buffer2 = await ccard(this.characterMap[this.selected].data, this.characterMap[this.selected].data.avatarId, 40.5, 500, this.interaction)
                await this.interaction.editReply({
                    files: [{name: 'card.jpg', attachment: buffer2}]
                })
            });

            this.collector?.on('end', () => {
                this.pages = this.pages.map(pg => {
                    pg.components = [];
                    return pg;
                });
                return this.end();
            });
            this.update();
        })
    }

    async update() {
        this.validatePage();
        if (this.characterMap) {
            this.pagedMessage?.end(false);

            const emojiMap = jsonParse('./data/emojis/characterEmojis.json', {});

            const pageSize = 20;
            const pages = [];
            if (this.page > 0) await this.message?.removeAttachments();
            for (let i = 0; i < Object.keys(this.characterMap).length; i += pageSize) {
                const avatars = Object.keys(this.characterMap).slice(i, i + pageSize);
                const row = new MessageActionRow();
                const menu = new MessageSelectMenu()
                    .setPlaceholder(translate('Select a Character', this.interaction.locale))
                    .setCustomId('charselect');

                for (const character of avatars) {
                    const label = character;
                    const value = character;
                    const emoji = emojiMap[untranslate(character, this.interaction.locale)];

                    menu.addOptions({label, value, emoji});
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
                pages.push({embeds: this.pages[this.page].embeds, components: rows});
            }

            this.pagedMessage = new PagedMessage(this.interaction, pages, this.pagedMessage?.page ?? 0, this.timeLeft);
            if (this.page === 0) {
                const enkaBtn = new MessageButton()
                    .setStyle('LINK')
                    .setURL(this.enkaUrl)
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

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var cars = text.split("\n");

    for (var ii = 0; ii < cars.length; ii++) {

        var line = "";
        var words = cars[ii].split(" ");

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > maxWidth) {
                context.fillText(line, x, y);
                line = words[n] + " ";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }

        context.fillText(line, x, y);
        y += lineHeight;
    }
}

const baseUrl = 'https://enka.network/api/uid/';
const subUrl = 'https://enka.network/u/';

async function execute(interaction) {
    await interaction.editReply({
        content: 'Profileoverview is being generated! <a:loading:1127784704628764773>',
        embeds: [],
        components: []
    })

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

    const {data: hex} = await axios.get('https://discord.com/api/v8/applications/' + interaction.client.user.id + '/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})

    if (['na', 'eu', 'asia', 'sar'].map(str => translate(str, interaction.locale)).includes(givenUid)) {
        const location = untranslate(givenUid, interaction.locale);

        if (location === 'na') uid = linkedUids.find(id => id.startsWith('6'));
        if (location === 'eu') uid = linkedUids.find(id => id.startsWith('7'));
        if (location === 'asia') uid = linkedUids.find(id => id.startsWith('8'));
        if (location === 'sar') uid = linkedUids.find(id => id.startsWith('9'));

    } else if (user && !uid) return await interaction.editReply(translate('Mentioned user has not linked their UID to the bot.', interaction.locale) + ' Use </' + hex.find(cmd => cmd.name === 'link').name + ':' + hex.find(cmd => cmd.name === 'link').id + '> to get linked!')
    else if (!givenUid && !uid) return await interaction.editReply(translate('No UID provided.', interaction.locale))
    else if (/^[125-9]\d{8}$/.test(givenUid)) uid = givenUid;

    if (!/^[125-9]\d{8}$/.test(uid)) return await interaction.editReply(translate('Invalid UID.', interaction.locale));

    const achievementLdb = jsonParse('./data/leaderboards/achievements.json', {});
    const nameList = jsonParse('./data/leaderboards/names.json', {});
    const arList = jsonParse('./data/leaderboards/ar.json', {});
    const wlList = jsonParse('./data/leaderboards/wl.json', {});
    const fList = jsonParse('./data/leaderboards/fl.json', {});
    const cList = jsonParse('./data/leaderboards/cl.json', {});
    const sList = jsonParse('./data/leaderboards/sl.json', {});
    const nList = jsonParse('./data/leaderboards/nl.json', {});
    const data = (await axios.get(baseUrl + uid)
        .catch(r => {
                if (![400, 404, 424, 500, 429, 503, 522, 526].includes(r.response.status)) return interaction.editReply(translate('Failed to find a user with that UID.', interaction.locale));
            }
        ))?.data ?? {
        avatarInfoList: Object.values(jsonParse('./data/profiles/' + uid + '.json', {})),
        playerInfo: {
            finishAchievementNum: achievementLdb[uid] ?? -1,
            nickname: nameList[uid] ?? '???',
            signature: nList[uid] + '\n\n***__Enka.Network is currently down. Cached info is shown.__***' ?? translate('***__Enka.Network is currently down. Cached info is shown.__***', interaction.locale),
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
    const authorData = {
        name: translate("{0}'s Profile card", interaction.locale).replace('{0}', data.playerInfo.nickname),
        url: subUrl + uid
    };
    const serialisations = jsonParse('./data/loc.json', {});
    const emojis = [
        '<:FIGHT_PROP_ATTACK_PERCENT:971462863338213396>',
        '<:FIGHT_PROP_DEFENSE_PERCENT:971462863250153502>',
        '<:FIGHT_PROP_PHYSICAL_ADD_HURT:971462863371788330>',
        '<:FIGHT_PROP_ADD_HURT:971462863371788330>',
        '<:FIGHT_PROP_HP:971462863359180900>',
        '<:FIGHT_PROP_CRITICAL_HURT:971462863254327357>',
        '<:FIGHT_PROP_CRITICAL_VALUE:1090151893449314355>',
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

    function getSerialised(id, amt) {
        if (id.toString().startsWith('FIGHT_PROP')) {
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


    //Canvas generation
    const attachment2 = new MessageAttachment(await loadImage(fs.readFileSync('./data/profilegen/R0.png')))

    if (!data.avatarInfoList) return await interaction.editReply({
            embeds: [{
                description: 'Profile either has disabled the showcase of character details or has no characters listed at all, please re-enable "Show Character Details"/ add characters to the Character Showcase, if you are the owner!',
                image: {
                    url: 'attachment://howto.gif'
                }
            }],
            files: ['./data/profilegen/howto.gif']
        }
    );

    const c = C.createCanvas(1300, 1350);
    const ctx = c.getContext('2d');
    const background = await C.loadImage('./data/ascension/bg.png')

    var grd = ctx.createLinearGradient(0, 0, c.width, 0);
    grd.addColorStop(0, "#f0ebe3");
    grd.addColorStop(1, "#ece5d8");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, c.width, c.height);
    registerFont('./data/fonts/zh-cn2.ttf', {
        family: 'SDK_SC_Web Heavy'
    });

    const bg = {
        5: 'SSR',
        4: 'SR'
    }

    async function cover(id, level, x, y, icon, iten, element, rarity, cons) {
        const cE = jsonParse('./data/emojis/charEmote.json', {})
        ctx.globalAlpha = 1;
        const img1 = await loadImage((fs.readFileSync('./data/profilegen/' + bg[rarity] + '.png')))
        ctx.shadowColor = "rgba(0,0,0,.35)";
        ctx.shadowBlur = 10;
        ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
        let img2 = await loadImage(cE[id] ? 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id] + '.png' : 'https://api.ambr.top/assets/UI/' + icon + '.png')
        if (id === 10000005) img2 = await loadImage('https://raw.githubusercontent.com/FortOfFans/GI/main/sticker/Aether.png')
        if (id === 10000007) img2 = await loadImage('https://raw.githubusercontent.com/FortOfFans/GI/main/sticker/Lumine.png')
        if (id === 10000032) img2 = await loadImage('https://raw.githubusercontent.com/FortOfFans/GI/main/sticker/Bennett.png')
        if (id === 10000034) img2 = await loadImage('https://raw.githubusercontent.com/FortOfFans/GI/main/sticker/Noelle.png')
        if (id === 10000062) img2 = await loadImage('https://raw.githubusercontent.com/FortOfFans/GI/main/sticker/Aloy.png')
        ctx.shadowBlur = 0;
        ctx.drawImage(img2, 0, 0, img2.width, img2.height, 0 + x, 0 + y, 240, 240);
        const img3 = await loadImage((fs.readFileSync('./data/profilegen/Nameplate.png')))
        ctx.drawImage(img3, 0, 0, img3.width, img3.height, 0 + x, 185 + y, img3.width, img3.height);
        const img4 = await loadImage('https://api.ambr.top/assets/UI/UI_Buff_Element_' + element + '.png')
        ctx.drawImage(img4, 0, 0, img4.width, img4.height, 5 + x, 5 + y, img4.width * .7, img4.height * .7)

        ctx.strokeStyle = "rbg(255, 0, 0)";
        ctx.beginPath();
        ctx.roundRect(195 + x, 10 + y, 40, 40, 5)
        ctx.fillStyle = "rgba(0,0,0, .35)"
        ctx.fill();
        ctx.beginPath();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        if ((iten.length) > 17) {
            ctx.font = '14px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        } else if (iten.length > 12) {
            ctx.font = '16px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        } else {
            ctx.font = '20px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        }

        ctx.fillStyle = '#77583b';
        ctx.fillText('Lv. ' + level + ' - ' + iten, 121 + x, 275 + y)
        ctx.font = '30px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.fillStyle = 'rgba(225,225,225,1)';
        ctx.fillText(cons ?? 0, 216 + x, 50 + y)

    }

    await loadImage('https://api.ambr.top/assets/UI/namecard/' + nameCard.replace('UI_NameCardIcon_', 'UI_NameCardPic_') + '_P.png')
        .then((img) => {
            ctx.drawImage(img, 0, 0, img.width * 1.75, img.height * 1.75)
        })
    ctx.fillStyle = 'rgba(0, 0, 0, .20)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 550, c.width, c.height);

    {
        ctx.font = '70px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        const hg = ctx.measureText(data.playerInfo.nickname).width
        ctx.font = '70px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(data.playerInfo.nickname.replace(/ㅤ/gi, '  ').replace(/୧/g, ' ').replace("\\p{Zs}+", " ").replace("\\h+", " ").replace("(?U)\\s+", " ").replace(/\s/g, ' '), 430, 150)

        ctx.font = '40px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        ctx.shadowColor = "rgba(0,0,0,.35)";
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff'
        wrapText(ctx, (data.playerInfo.signature || translate('No signature', interaction.locale)), 430, 220, 710, 42)
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'middle'
        ho = -65
        ctx.fillText(data.playerInfo.finishAchievementNum, 485 + ho, 470)
        ctx.fillText(data.playerInfo.towerFloorIndex + '-' + data.playerInfo.towerLevelIndex, 952 + ho, 470)
        ctx.textBaseline = 'bottom'
    }

    await loadImage(fs.readFileSync('./data/profilegen/Logo.png'))
        .then((img) => {
            ctx.drawImage(img, 0, 0, img.width, img.height)
        })
    await loadImage(fs.readFileSync('./data/profilegen/EnkaLogo.png'))
        .then((img) => {
            ctx.drawImage(img, 980, 25, img.width * .7, img.height * .7)
        })
    await loadImage(fs.readFileSync('./data/profilegen/UI_Icon_Achievement.png'))
        .then((img) => {
            ctx.drawImage(img, 376 + ho, 417, img.width * 1.5, img.height * 1.5)
        })
    await loadImage(fs.readFileSync('./data/profilegen/UI_Icon_Activity_TowerReset.png'))
        .then((img) => {
            ctx.drawImage(img, 838 + ho, 417, img.width * 1.5, img.height * 1.5)
        })

    let x = 0
    let y = 0

    if (data.playerInfo.showAvatarInfoList) {
        for (let i = 0; i < data.playerInfo.showAvatarInfoList.length; i++) {

            const sid = data.playerInfo.showAvatarInfoList[i]?.avatarId
            const cl = data.playerInfo.showAvatarInfoList[i]?.level
            const constellation = data.avatarInfoList[i]?.talentIdList?.length ?? '0'
            const mhmh = jsonParse('./data/charSkill.json', {})
            const sd = data.avatarInfoList[i]?.skillDepotId
            const {
                name: iten,
                icon,
                rank,
                element: ifo
            } = await ambrApi('/avatar/' + sid, interaction.locale.replace('ja', 'en-GB'));
            const hel = sid.toString() + '-' + sd.toString()
            await cover(sid, cl, 80 + x, 600 + y, icon, iten, (Object.entries(mhmh).filter(([a, b]) => a.includes(hel)).map(([a, b]) => b)[0]?.Element ?? ifo), rank, constellation)
            x += 300
            if (i === 3) {
                y += 350;
                x = 0
            }
        }
    } else {
        return await interaction.editReply('Profile has no characters listed')
    }


    const hsl = '#' + getUserSettings(user ?? interaction.user.id).color.toString(16);
    ctx.lineWidth = 13;
    ctx.strokeStyle = 'rgba(236, 229, 216, 1)';
    ctx.fillStyle = (hsl || "rgba(221, 143, 93, 1)")

    ctx.arc(175, 175, 125, 0, Math.PI * 2, true);
    ctx.clip();

    const lolz = data?.playerInfo?.profilePicture?.avatarId
    const lolz2 = data?.playerInfo?.profilePicture?.id
    let ppm = await axios.get('https://gitlab.com/Dimbreath/AnimeGameData/-/raw/main/ExcelBinOutput/ProfilePictureExcelConfigData.json')
    let ppid = Object.values(ppm?.data).find(i => i?.id === lolz2)
    let chas = await ambrApi('/avatar/' + lolz, interaction.locale.replace('ja', 'en-GB'));
    // const {icon: ico} = await ambrApi('/avatar/' + lolz, interaction.locale.replace('ja', 'en-GB'));
    await loadImage('https://api.ambr.top/assets/UI/' + (lolz ? chas?.icon : ppid?.iconPath?.replace(/_Circle/gi, '')) + '.png')
        .then((img) => {
            ctx.drawImage(img, 50, 50, img.width, img.height);
            ctx.fill();
            ctx.stroke();
        }, true);

    ctx.lineWidth = 13;
    ctx.strokeStyle = 'rgba(236, 229, 216, 1)';
    ctx.fillStyle = "rgba(0,0,0,0)"

    ctx.arc(175, 175, 125, 0, Math.PI * 2, true);
    ctx.clip();

    await loadImage('https://api.ambr.top/assets/UI/' + (lolz ? chas?.icon : ppid?.iconPath?.replace(/_Circle/gi, '')) + '.png')
        .then((img) => {
            ctx.drawImage(img, 50, 50, img.width, img.height);
            ctx.fill();
            ctx.stroke();
        }, true);


    const buffer = c.toBuffer('image/jpeg', {quality: 1})

    await interaction.editReply({
            content: translate("{0}'s Profile card", interaction.locale.replace('ja', 'en-GB')).replace('{0}', data.playerInfo.nickname),
            files: [{name: 'card.jpg', attachment: buffer}],
            components: []
        }
    );


    const attachment = await new MessageAttachment(c.toBuffer(), 'card.jpg')


    const introPage = new MessageEmbed()
        .setAuthor(authorData)
        .setColor(getUserSettings(interaction.user.id).color)
        .setFooter({
            text: translate('AR {0} · WL {0}', interaction.locale)
                    .replace('{0}', data.playerInfo.level)
                    .replace('{0}', data.playerInfo.worldLevel) + ' ' +
                translate('· UID: {1}', interaction.locale).replace('{1}', uid)
        })
    pages.push(introPage);

    introPage.setImage('attachment://card.jpg')


    const c3Avatars = fs.readFileSync('./data/c3avatars.txt').toString().split('\r\n');
    const charList = jsonParse('./data/characters.json', []);

    const characterMap = {};
    let j = 0;
    const newCache = jsonParse('./data/profiles/' + uid + '.json', {});
    if (!data.avatarInfoList) introPage.addField(translate('Warning', interaction.locale), translate('Profile ' +
        'either has no characters listed or has Character Details hidden. [How to add characters](https://youtu.be/eZbudcY2F3w?t=14)', interaction.locale), true);

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


    for (const char of data.avatarInfoList ?? []) {
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
        const name = getSerialised(charInfo.nameTextMapHash);

        const level = char.propMap['4001'].val;
        const iconURL = 'https://res.cloudinary.com/genshin/image/upload/e_trim:80/v1/sprites/' + charInfo.sideIconName + '.png';
        embed.setAuthor({name, iconURL, url: subUrl + uid});
        embed.setDescription(authorData.name);
        embed.setImage('attachment://cards.png')
        embed.setFooter({
            text: levelText
                .replace('{0}', level)
                .replace('{0}', char.fetterInfo.expLevel) + translate('· UID: {1}', interaction.locale).replace('{1}', uid)
        });
        characterMap[name] = {
            stats2: ++j,
            art: ++j,
            data: char
        };

        const stats2 = char.fightPropMap;
        stats2[22.5] = character.artifacts
                .reduce((t, a) => t + (a?.substats?.CRITICAL * 2 || 0) + (a?.substats?.CRITICAL_HURT || 0), 0)
            + (character.artifacts[4]?.mainStat?.startsWith('CRITICAL') ?
                char.equipList.find(a => a.itemId.toString()[3] === '3').flat.reliquaryMainstat.statValue *
                (1 + (character.artifacts[4]?.mainStat === 'CRITICAL')) : 0);
        character.stats.CRITICAL_VALUE = stats2[22.5];
        pages.push(embed);
    }

    jsonSave('./data/profiles/' + uid + '.json', newCache);
    jsonSave('./data/leaderboards/artifacts/' + uid + '.json', artifactList);
    jsonSave('./data/leaderboards/builds/' + uid + '.json', buildsList);

    return new ProfileMessage(interaction, subUrl + uid, characterMap)
}

module.exports = {name, description, options, filter, execute};