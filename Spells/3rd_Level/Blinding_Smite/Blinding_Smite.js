const MACRONAME = "Blinding_Smite.0.3"
jez.log(MACRONAME)
/*****************************************************************************************
 * Implment Branding Smite!
 * 
 * 01/25/22 0.1 Creation of Macro
 * 01/26/22 0.2 Add VFX
 * 08/01/22 0.3 Fix to accomodate change in Midi (flags.midi-qol.itemDetails needs OVERIDE)
 *****************************************************************************************/
const MACRO = MACRONAME.split(".")[0]     // Trim of the version number and extension
jez.log("")
jez.log(`============== Starting === ${MACRONAME} =================`);
for (let i = 0; i < args.length; i++) jez.log(`  args[${i}]`, args[i]);
const LAST_ARG = args[args.length - 1];
let aActor;         // Acting actor, creature that invoked the macro
let aToken;         // Acting token, token for creature that invoked the macro
let aItem;          // Active Item information, item invoking this macro
if (LAST_ARG.tokenId) aActor = canvas.tokens.get(LAST_ARG.tokenId).actor; else aActor = game.actors.get(LAST_ARG.actorId);
if (LAST_ARG.tokenId) aToken = canvas.tokens.get(LAST_ARG.tokenId); else aToken = game.actors.get(LAST_ARG.tokenId);
if (args[0]?.item) aItem = args[0]?.item; else aItem = LAST_ARG.efData?.flags?.dae?.itemData;
const CUSTOM = 0, MULTIPLY = 1, ADD = 2, DOWNGRADE = 3, UPGRADE = 4, OVERRIDE = 5;
jez.log("------- Global Values Set -------",
    `Active Token (aToken) ${aToken?.name}`, aToken,
    `Active Actor (aActor) ${aActor?.name}`, aActor,
    `Active Item (aItem) ${aItem?.name}`, aItem)
let msg = "";
let errorMsg = "";
const GAME_RND = game.combat ? game.combat.round : 0;
const SAVE_DC = aToken.actor.data.data.attributes.spelldc;
const SAVE_TYPE = "con";
const COND_APPLIED = "Blinded"
const COND_ICON = aItem.img
const DAM_TYPE = "radiant";
const SPELL_LVL = LAST_ARG?.spellLevel ? LAST_ARG.spellLevel : 2
jez.log("CONSTANTS Set", "GAME_RND", GAME_RND, "SAVE_DC", SAVE_DC, "SAVE_TYPE", SAVE_TYPE,
    "COND_ICON", COND_ICON, "DAM_TYPE", DAM_TYPE, "SPELL_LVL", SPELL_LVL)
// VFX Settings -------------------------------------------------------------------
const VFX_NAME = `${MACRO}-${aToken.id}`
const VFX_TARGET = "modules/jb2a_patreon/Library/2nd_Level/Divine_Smite/DivineSmite_01_Regular_YellowWhite_Target_400x400.webm"
const VFX_CASTER = "modules/jb2a_patreon/Library/2nd_Level/Divine_Smite/DivineSmite_01_Regular_YellowWhite_Caster_400x400.webm"
const VFX_OPACITY = 1.0;
const VFX_SCALE = 0.70;
//----------------------------------------------------------------------------------
// Run the main procedures, choosing based on how the macro was invoked
//
let returnFunc = null
if (args[0]?.tag === "OnUse") await doOnUse();          // Midi ItemMacro On Use
if (args[0]?.tag === "DamageBonus") {
    let returnFunc = await doBonusDamage();    // DAE Damage Bonus
    return(returnFunc)
}

jez.log(`============== Finishing === ${MACRONAME} =================`);
jez.log("")
return;

/***************************************************************************************************
 *    END_OF_MAIN_MACRO_BODY
 *                                END_OF_MAIN_MACRO_BODY
 *                                                             END_OF_MAIN_MACRO_BODY
 ***************************************************************************************************/

/***************************************************************************************************
 * Perform the code that runs when this macro is invoked as an ItemMacro "OnUse"
 ***************************************************************************************************/
async function doOnUse() {
    const FUNCNAME = "doOnUse()";
    jez.log(`-------------- Starting --- ${MACRONAME} ${FUNCNAME} -----------------`);
    //------------------------------------------------------------------------------------------------
    // Launch VFX on caster
    // 
    new Sequence()
        .effect()
        .file(VFX_CASTER)
        .attachTo(aToken)
        .scale(VFX_SCALE)
        .opacity(VFX_OPACITY)
        .belowTokens(false)
        .name(VFX_NAME)          // Give the effect a uniqueish name
        .play()
    //-------------------------------------------------------------------------------------------------
    // Define and apply the effect
    // 
    const CE_DESC = `Next weapon hit does extra damage and forces a DC${SAVE_DC} CON save or Blinded.`
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: jez.CUSTOM, value: `ItemMacro.${aItem.name}`, priority: 20 },
            { key: "flags.midi-qol.itemDetails", mode: jez.OVERRIDE, value: `${LAST_ARG.uuid}`, priority: 20 },
        ],
        origin: LAST_ARG.uuid,
        disabled: false,
        duration: { rounds: 1, seconds: 6, startRound: GAME_RND, startTime: game.time.worldTime },
        flags: { 
            dae: { itemData: aItem, specialDuration: ["DamageDealt"] },
            convenientDescription: CE_DESC
        },
        icon: aItem.img,
        label: aItem.name
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: aToken.actor.uuid, effects: effectData });
    msg = `${aToken.name}'s weapon flashes briefly in anticiapation of landing a blinding smite.`
    await jez.addMessage(game.messages.get(args[args.length - 1].itemCardId),
                   {color:"darkblue",fSize:14,msg:msg,tag:"saves"})
    jez.log(`-------------- Finished --- ${MACRONAME} ${FUNCNAME} -----------------`);
    return (true);
}

/***************************************************************************************************
 * Perform the code that runs when this macro is invoked as an ItemMacro "doBonusDamage"
 ***************************************************************************************************/
 async function doBonusDamage() {
     const FUNCNAME = "doBonusDamage()";
     jez.log(`-------------- Starting --- ${MACRONAME} ${FUNCNAME} -----------------`);
     if (args[0].tag === "DamageBonus") {
         if (!["mwak"].includes(LAST_ARG.item.data.actionType)) return {};
        //  let conc = aToken.actor.effects.find(i => i.data.label === "Concentrating");
        //  jez.log("conc", conc);
         let tToken = canvas.tokens.get(LAST_ARG.hitTargets[0].id);
         jez.log("tToken",tToken)
         let itemUuid = getProperty(LAST_ARG.actor.flags, "midi-qol.itemDetails");
         let itemN = await fromUuid(itemUuid);
         jez.log("itemN =====>", itemN)
         let numDice = LAST_ARG.isCritical ? 6 : 3;
        //  await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: aToken.actor.uuid, effects: [conc.id] });
        //  await jez.wait(500);
         //-------------------------------------------------------------------------------------------------------------
         // Launch VFX on target
         // 
         new Sequence()
        .effect()
            .file(VFX_TARGET)
            .attachTo(tToken)
            .scale(VFX_SCALE)
            .opacity(VFX_OPACITY)  
            .belowTokens(false)
            .name(VFX_NAME)          // Give the effect a uniqueish name
        .play()
        //-------------------------------------------------------------------------------------------------------------
        // If already Blinded, remove previous condition
        //        
        let existingEffect = tToken.actor.effects.find(ef => ef.data.label === COND_APPLIED)
        if (existingEffect) {
            jez.log(`${tToken.name} was already ${COND_APPLIED} clearing that now.`,existingEffect)
            await existingEffect.delete();
        }
        //-------------------------------------------------------------------------------------------------------------
        // Apply Blinded condition
        //   
        const CE_DESC = `Blinded until DC${SAVE_DC} CON save at end of turn.`
        let effectData = [{
            label: COND_APPLIED,
            icon: itemN.img,
            origin: "",
            disabled: false,
            flags: { 
                dae: {stackable: false, macroRepeat: "none" },
                convenientDescription: CE_DESC
            },
            duration: { rounds: 10, seconds: 60, startRound: GAME_RND, startTime: game.time.worldTime },
            changes: [
                { key: `flags.midi-qol.grants.advantage.attack.all`, mode: ADD, value: 1, priority: 20 },
                { key: `flags.midi-qol.disadvantage.attack.all`, mode: ADD, value: 1, priority: 20 },
                { key: `flags.midi-qol.OverTime`, mode: OVERRIDE, 
                        value: `turn=end,label=${COND_APPLIED},saveDC=${SAVE_DC},saveAbility=${SAVE_TYPE},saveRemove=true`, 
                        priority: 20 }
            ]
        }];
        let blinded = tToken.actor.effects.find(i => i.data.label === COND_APPLIED);
        if (!blinded) applyEffect(tToken, effectData);
        //----------------------------------------------------------------------------------------------------------
        // Chill a bit and then pair the effects
        //
        await jez.wait(100);
        jez.pairEffects(aActor, "Concentrating", tToken.actor, "Blinded")
        //-------------------------------------------------------------------------------------------------------------
        // Dig through the chat history, to find the message that should have new message added...but don't use it?
        //
        let msgHistory = [];
        game.messages.reduce((list, message) => {
            if (message.data?.flags["midi-qol"]?.itemId === aItem._id && message.data.speaker.token === aToken.id) list.push(message.id);
            return list;
        }, msgHistory);
        //-------------------------------------------------------------------------------------------------------------
        // Return Extra Damage function
        //
        jez.log(`-------------- Finishing(Extra Damage))--- ${MACRONAME} ${FUNCNAME} -----------------`,
            "numDice", numDice, "DAM_TYPE", DAM_TYPE, "itemN.name", itemN.name);
        return { damageRoll: `${numDice}d8[${DAM_TYPE}]`, flavor: `(${itemN.name} (${CONFIG.DND5E.damageTypes[DAM_TYPE]}))` };
    }
    jez.log(`-------------- Finished(Bottom)--- ${MACRONAME} ${FUNCNAME} -----------------`);
    return (true);
}
async function applyEffect(target, effectData){
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: effectData });
}
// async function updateEffect(aToken, target, conc){
//     let frightened = target.actor.effects.find(i => i.data.label === COND_APPLIED);        
//     await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: aToken.actor.uuid, updates: [{ _id: conc.id, changes: [{ key: `flags.dae.deleteUuid`, mode: 5, value: frightened.uuid, priority: 20 }] }] });
// }