const MACRONAME = "Power_Word_Stun.0.2.js"
/*****************************************************************************************
 * You speak a word of power that can overwhelm the mind of one creature you can see 
 * within range, leaving it dumbfounded. If the target has 150 hit points or fewer, it 
 * is stunned. Otherwise, the spell has no effect. (Note: No Save)
 * 
 * The stunned target must make a Constitution saving throw at the end of each of its 
 * turns. On a successful save, this stunning effect ends.
 * 
 * 02/11/22 0.1 Creation of Macro
 * 08/02/22 0.2 Add convenientDescription
 *****************************************************************************************/
const MACRO = MACRONAME.split(".")[0]     // Trim of the version number and extension
jez.log(`============== Starting === ${MACRONAME} =================`);
for (let i = 0; i < args.length; i++) jez.log(`  args[${i}]`, args[i]);
const LAST_ARG = args[args.length - 1];
let aToken;         // Acting token, token for creature that invoked the macro
if (LAST_ARG.tokenId) aToken = canvas.tokens.get(LAST_ARG.tokenId);
else aToken = game.actors.get(LAST_ARG.tokenId);
let aItem;          // Active Item information, item invoking this macro
if (args[0]?.item) aItem = args[0]?.item;
else aItem = LAST_ARG.efData?.flags?.dae?.itemData;
let msg = "";
const COND = "Stunned"
const SAVE_DC = aToken.actor.data.data.attributes.spelldc;
const SAVE_TYPE = "con"
//----------------------------------------------------------------------------------
// Run the main procedures, choosing based on how the macro was invoked
//
if (args[0]?.tag === "OnUse") await doOnUse();          // Midi ItemMacro On Use
jez.log(`============== Finishing === ${MACRONAME} =================`);
/***************************************************************************************************
 *    END_OF_MAIN_MACRO_BODY
 *                                END_OF_MAIN_MACRO_BODY
 *                                                             END_OF_MAIN_MACRO_BODY
 ***************************************************************************************************
 * Check the setup of things.  Setting the global errorMsg and returning true for ok!
 ***************************************************************************************************/
function preCheck() {
    if (args[0].targets.length !== 1) {     // If not exactly one target, return
        msg = `Must target exactly one target.  ${args[0].targets.length} were targeted.`
        postResults(msg);
        return (false);
    }
    return (true)
}
/***************************************************************************************************
 * Post results to the chat card
 ***************************************************************************************************/
function postResults(msg) {
    jez.log(msg);
    let chatMsg = game.messages.get(args[args.length - 1].itemCardId);
    jez.addMessage(chatMsg, { color: jez.randomDarkColor(), fSize: 14, msg: msg, tag: "saves" });
}
/***************************************************************************************************
 * Perform the code that runs when this macro is invoked as an ItemMacro "OnUse"
 ***************************************************************************************************/
async function doOnUse() {
    if (!preCheck()) return (false)
    let tToken = canvas.tokens.get(args[0]?.targets[0]?.id); // First Targeted Token, if any
    jez.runRuneVFX(tToken, jez.getSpellSchool(aItem))
    let curHP = tToken.actor.data.data.attributes.hp.value
    if (curHP <= 150) {
        //----------------------------------------------------------------------------------------------
        // ${tToken.name} has ${curHP} HP so it is affected by the stun`)
        //
        const CE_DESC = `Dumbfounded (stunned), DC${SAVE_DC} end of turns to end.`
        let overTimeVal=`turn=end,label=${COND},saveDC=${SAVE_DC},saveAbility=${SAVE_TYPE},saveRemove=true,saveMagic=true`
        let effectData = [ {
            label: COND,
            icon: aItem.img,
            origin: args[0].uuid,
            disabled: false,
            flags: { 
                dae: { itemData: aItem }, 
                convenientDescription: CE_DESC
            },            
            changes: [  { key: `macro.CE`, mode: jez.CUSTOM, value: COND, priority: 20 },
                        { key: `flags.midi-qol.OverTime`, mode: jez.OVERRIDE, value:overTimeVal , priority: 20 } ]
        } ];
        MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tToken.actor.uuid, effects: effectData });
        msg = `${tToken.name} is stunned until a successful ${SAVE_DC}DC ${SAVE_TYPE.toUpperCase()} saving throw 
        at the end of its turn.`
    } else {
        msg = `${tToken.name} shakes off the effects of ${aItem.name}.`
    }
    postResults(msg)
    return (true);
}

