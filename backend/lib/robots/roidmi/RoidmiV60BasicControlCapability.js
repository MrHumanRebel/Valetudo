const BasicControlCapability = require("../../core/capabilities/BasicControlCapability");

/**
 * Roidmi EVE Plus basic MIoT actions, only over the authenticated local socket.
 * Pausing is deliberately not emulated using 'stop' as its semantics are unknown.
 *
 * @extends BasicControlCapability<import("./RoidmiV60ValetudoRobot")>
 */
class RoidmiV60BasicControlCapability extends BasicControlCapability {
    async start() {
        await this.robot.sendMiotAction("start");
    }

    async stop() {
        await this.robot.sendMiotAction("stop");
    }

    async home() {
        await this.robot.sendMiotAction("home");
    }

    async pause() {
        throw new Error("Roidmi V60 pause action is not established; no command was sent");
    }
}

module.exports = RoidmiV60BasicControlCapability;
