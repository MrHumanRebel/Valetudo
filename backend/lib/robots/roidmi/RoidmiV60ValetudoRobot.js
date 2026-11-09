const Logger = require("../../Logger");
const stateAttrs = require("../../entities/state/attributes");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoidmiV60BasicControlCapability = require("./RoidmiV60BasicControlCapability");
const Miot = require("./RoidmiV60Miot");

const STATUS_MAP = Object.freeze({
    [Miot.STATE.DORMANT]: stateAttrs.StatusStateAttribute.VALUE.IDLE,
    [Miot.STATE.IDLE]: stateAttrs.StatusStateAttribute.VALUE.IDLE,
    [Miot.STATE.PAUSED]: stateAttrs.StatusStateAttribute.VALUE.PAUSED,
    [Miot.STATE.SWEEPING]: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
    [Miot.STATE.GO_CHARGING]: stateAttrs.StatusStateAttribute.VALUE.RETURNING,
    [Miot.STATE.CHARGING]: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
    [Miot.STATE.ERROR]: stateAttrs.StatusStateAttribute.VALUE.ERROR,
    [Miot.STATE.RFCTRL]: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL,
    [Miot.STATE.FULL_CHARGE]: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
    [Miot.STATE.FIND_CHARGER_PAUSE]: stateAttrs.StatusStateAttribute.VALUE.PAUSED
});

class RoidmiV60ValetudoRobot extends MiioValetudoRobot {
    constructor(options) {
        super(options);

        // These actions are documented by python-miio but NOT yet hardware-validated
        // using this Valetudo adapter. Failed authentication must surface as an error.
        this.registerCapability(new RoidmiV60BasicControlCapability({robot: this}));
    }

    getManufacturer() {
        return "Roidmi";
    }

    getModelName() {
        return "EVE Plus (v60, experimental)";
    }

    /**
     * No known safe model-specific device.conf path and no EVE Plus root method.
     * Never autodetect or pretend that this implementation can be installed.
     */
    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        return false;
    }

    /**
     * The upstream MiioValetudoRobot knows how to connect to a miIO socket, but
     * Roidmi-specific robot file paths have not been established yet.
     * Embedded deployment therefore requires a separate verified installation.
     */
    setEmbeddedParameters() {
        this.deviceConfPath = "/dev/null";
        this.tokenFilePath = "/dev/null";
    }

    // Avoid the parent startup() method because it logs both secret keys.
    startup() {
        Logger.info("Roidmi EVE Plus experimental MIoT driver; local authentication and embedded access required");
    }

    async sendMiotAction(name) {
        const response = await this.sendCommand("action", Miot.buildActionRequest(name), {
            interface: "local",
            timeout: 5000
        });
        Miot.assertActionSuccess(response);
    }

    async pollState() {
        const response = await this.sendCommand(
            "get_properties",
            Miot.buildPropertyRequests(["state", "battery_level", "charging_state", "error_code"]),
            {interface: "local", timeout: 5000}
        );

        const {values} = Miot.parsePropertyResponse(response);
        this.parseAndUpdateState(values);
        return this.state;
    }

    parseAndUpdateState(data) {
        let updated = false;
        if (Number.isInteger(data.state) && STATUS_MAP[data.state]) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.StatusStateAttribute({
                value: STATUS_MAP[data.state]
            }));
            updated = true;
        }

        if (Number.isInteger(data.battery_level) &&
            data.battery_level >= 0 && data.battery_level <= 100) {
            let flag = stateAttrs.BatteryStateAttribute.FLAG.NONE;

            if (data.state === Miot.STATE.FULL_CHARGE) {
                flag = stateAttrs.BatteryStateAttribute.FLAG.CHARGED;
            } else if (data.charging_state === 1 || data.state === Miot.STATE.CHARGING) {
                flag = stateAttrs.BatteryStateAttribute.FLAG.CHARGING;
            } else if (data.charging_state === 2) {
                flag = stateAttrs.BatteryStateAttribute.FLAG.DISCHARGING;
            }

            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                level: data.battery_level,
                flag: flag
            }));
            updated = true;
        }

        if (updated) {
            this.emitStateAttributesUpdated();
        }
    }

    // No V60 map extraction/format is confirmed. Do not fabricate a map or
    // let the generic map scheduler repeatedly call unsupported methods.
    pollMap() {
        // intentionally unavailable until map protocol has been reversed
    }

    async parseMap() {
        return null;
    }
}

module.exports = RoidmiV60ValetudoRobot;
