import * as alt from 'alt-client';
import * as native from 'natives';
import { Events_Misc } from '../../shared/enums/events';
import { toggleInteractionMode, toggleInteractionText, triggerInteraction } from '../systems/interaction';
import { VehicleController } from '../systems/vehicle';
import { focusChat, focusLeaderBoard, setHelpState } from '../views/hud/hud';

export const KEY_BINDS = {
    DEBUG_KEY: 112, // F1
    LEADERBOARD: 113, // F12
    CHAT: 84, // T
    VEHICLE_FUNCS: 70, // F
    VEHICLE_LOCK: 88, // X
    INTERACT: 69, // E
    INTERACTION_MODE: 18 // Left Alt
};

const DELAY_BETWEEN_LONG_PRESSES = 800;
const DELAY_BETWEEN_PRESSES = 500;
const KEY_UP_BINDS = {
    // F1
    [KEY_BINDS.DEBUG_KEY]: { singlePress: handleDebugMessages },
    // F2
    [KEY_BINDS.LEADERBOARD]: { singlePress: focusLeaderBoard },
    // X
    [KEY_BINDS.VEHICLE_LOCK]: {
        singlePress: () => VehicleController.triggerVehicleFunction('pressedLockKey')
    },
    // F
    [KEY_BINDS.VEHICLE_FUNCS]: {
        singlePress: () => VehicleController.triggerVehicleFunction('pressedVehicleFunction'),
        longPress: () => VehicleController.triggerVehicleFunction('pressedVehicleFunctionAlt')
    },
    [KEY_BINDS.CHAT]: { singlePress: focusChat }, // T
    [KEY_BINDS.INTERACT]: { singlePress: triggerInteraction }, // E
    [KEY_BINDS.INTERACTION_MODE]: { singlePress: toggleInteractionMode, longPress: toggleInteractionText } // Left ALT
};

let keyPressTimes = {};
let nextKeyPress = Date.now() + DELAY_BETWEEN_PRESSES;

alt.onServer(Events_Misc.StartTicks, handleStart);

function handleStart() {
    alt.on('keyup', handleKeyUp);
    alt.on('keydown', handleKeyDown);
}

function handleKeyDown(key: number) {
    keyPressTimes[key] = Date.now();

    if (!KEY_UP_BINDS[key]) {
        return;
    }

    if (!KEY_UP_BINDS[key].longPress) {
        return;
    }

    setHelpState(true);
    alt.setTimeout(() => {
        if (!keyPressTimes[key]) {
            return;
        }

        setHelpState(false);
        keyPressTimes[key] = null;
        KEY_UP_BINDS[key].longPress();
    }, DELAY_BETWEEN_LONG_PRESSES);
}

function handleKeyUp(key: number) {
    if (!KEY_UP_BINDS[key]) {
        return;
    }

    setHelpState(false);

    if (Date.now() < nextKeyPress) {
        return;
    }

    nextKeyPress = Date.now() + DELAY_BETWEEN_PRESSES;

    if (keyPressTimes[key] === null) {
        return;
    }

    // Long Press
    if (
        keyPressTimes[key] &&
        keyPressTimes[key] + DELAY_BETWEEN_LONG_PRESSES < Date.now() &&
        KEY_UP_BINDS[key].longPress
    ) {
        keyPressTimes[key] = null;
        KEY_UP_BINDS[key].longPress();
        return;
    }

    keyPressTimes[key] = null;
    // Single Press
    KEY_UP_BINDS[key].singlePress();
}

function handleDebugMessages() {
    alt.log(`POSITION:`);
    const pos = { ...alt.Player.local.pos };
    alt.log(JSON.stringify(pos));

    alt.log(`ROTATION:`);
    const rot = { ...alt.Player.local.rot };
    alt.log(JSON.stringify(rot));

    alt.log(`HEADING:`);
    const heading = native.getEntityHeading(alt.Player.local.scriptID);
    alt.log(heading);

    alt.emit('debug:Time');
}
