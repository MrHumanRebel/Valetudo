const assert = require("node:assert/strict");
const {test} = require("node:test");
const Capability = require("../../../lib/robots/roidmi/RoidmiV60BasicControlCapability");

test("basic control dispatches only documented actions", async () => {
    const calls = [];
    const capability = new Capability({robot: {
        sendMiotAction: async name => {calls.push(name);}
    }});
    await capability.start();
    await capability.stop();
    await capability.home();
    assert.deepEqual(calls, ["start", "stop", "home"]);
    await assert.rejects(() => capability.pause(), /pause action is not established/);
    assert.deepEqual(calls, ["start", "stop", "home"]);
});

test("does not pretend a failed action succeeded", async () => {
    const capability = new Capability({robot: {
        sendMiotAction: async () => {throw new Error("authentication failed");}
    }});
    await assert.rejects(() => capability.start(), /authentication failed/);
});
