/*
 * Roidmi EVE Plus (roidmi.vacuum.v60) MIoT contract.
 *
 * Identifiers are from python-miio's RoidmiVacuumMiot mapping.
 * This module contains NO authentication bypass or robot-specific firmware access.
 */
const PROPERTIES = Object.freeze({
    battery_level: Object.freeze({siid: 3, piid: 1}),
    charging_state: Object.freeze({siid: 3, piid: 2}),
    state: Object.freeze({siid: 2, piid: 1}),
    error_code: Object.freeze({siid: 2, piid: 2}),
    fanspeed_mode: Object.freeze({siid: 2, piid: 4}),
    sweep_type: Object.freeze({siid: 2, piid: 8}),
    mop_present: Object.freeze({siid: 8, piid: 1}),
    water_level: Object.freeze({siid: 8, piid: 11}),
});

const ACTIONS = Object.freeze({
    start: Object.freeze({siid: 2, aiid: 1}),
    stop: Object.freeze({siid: 2, aiid: 2}),
    home: Object.freeze({siid: 3, aiid: 1}),
});

const STATE = Object.freeze({
    DORMANT: 1,
    IDLE: 2,
    PAUSED: 3,
    SWEEPING: 4,
    GO_CHARGING: 5,
    CHARGING: 6,
    ERROR: 7,
    RFCTRL: 8,
    FULL_CHARGE: 9,
    SHUTDOWN: 10,
    FIND_CHARGER_PAUSE: 11,
});

function buildPropertyRequests(names) {
    return names.map(name => {
        const property = PROPERTIES[name];
        if (!property) {
            throw new Error("Unknown Roidmi V60 property: " + name);
        }
        return {did: name, siid: property.siid, piid: property.piid};
    });
}

function parsePropertyResponse(response) {
    if (!Array.isArray(response)) {
        throw new Error("Roidmi V60 MIoT get_properties returned a non-array result");
    }

    const values = {};
    const failures = {};
    for (const item of response) {
        if (!item || typeof item !== "object") {
            continue;
        }

        const name = PROPERTIES[item.did] ? item.did :
            Object.keys(PROPERTIES).find(key => {
                const prop = PROPERTIES[key];
                return prop.siid === item.siid && prop.piid === item.piid;
            });

        if (!name) {
            continue;
        }
        if (item.code === 0 && Object.prototype.hasOwnProperty.call(item, "value")) {
            values[name] = item.value;
        } else {
            failures[name] = item.code;
        }
    }

    if (Object.keys(values).length === 0) {
        throw new Error("Roidmi V60 returned no readable MIoT values (auth/permission/firmware may prevent reads)");
    }
    return {values, failures};
}

function buildActionRequest(name) {
    const action = ACTIONS[name];
    if (!action) {
        throw new Error("Unsupported Roidmi V60 action: " + name);
    }
    return {
        did: `call-${action.siid}-${action.aiid}`,
        siid: action.siid,
        aiid: action.aiid,
        in: []
    };
}

function assertActionSuccess(response) {
    const entries = Array.isArray(response) ? response : [response];
    if (entries.length === 0 || !entries.every(entry => entry && entry.code === 0)) {
        throw new Error("Roidmi V60 action was not acknowledged with MIoT code 0");
    }
}

module.exports = {PROPERTIES, ACTIONS, STATE, buildPropertyRequests, parsePropertyResponse, buildActionRequest, assertActionSuccess};
