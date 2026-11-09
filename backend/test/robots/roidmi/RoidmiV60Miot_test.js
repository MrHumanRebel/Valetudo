const assert = require("node:assert/strict");
const {test} = require("node:test");
const Miot = require("../../../lib/robots/roidmi/RoidmiV60Miot");

test("builds documented MIoT V60 battery and status requests", () => {
    assert.deepEqual(Miot.buildPropertyRequests(["battery_level", "state"]), [
        {did: "battery_level", siid: 3, piid: 1},
        {did: "state", siid: 2, piid: 1}
    ]);
    assert.throws(() => Miot.buildPropertyRequests(["unknown"]), /Unknown/);
});

test("builds correct start stop home MIoT action payloads", () => {
    assert.deepEqual(Miot.buildActionRequest("start"), {did: "call-2-1", siid: 2, aiid: 1, in: []});
    assert.deepEqual(Miot.buildActionRequest("stop"), {did: "call-2-2", siid: 2, aiid: 2, in: []});
    assert.deepEqual(Miot.buildActionRequest("home"), {did: "call-3-1", siid: 3, aiid: 1, in: []});
    assert.throws(() => Miot.buildActionRequest("reset"), /Unsupported/);
});

test("parses successful MIoT properties, preserves individual errors", () => {
    const result = Miot.parsePropertyResponse([
        {did: "battery_level", siid: 3, piid: 1, code: 0, value: 58},
        {did: "state", siid: 2, piid: 1, code: 0, value: 6},
        {did: "charging_state", siid: 3, piid: 2, code: -30015}
    ]);
    assert.deepEqual(result.values, {battery_level: 58, state: 6});
    assert.deepEqual(result.failures, {charging_state: -30015});
});

test("matches properties by siid/piid when did is absent", () => {
    const result = Miot.parsePropertyResponse([{siid: 3, piid: 1, code: 0, value: 90}]);
    assert.equal(result.values.battery_level, 90);
});

test("never turns permission errors or empty responses into successful reads", () => {
    assert.throws(() => Miot.parsePropertyResponse([{did: "state", code: -30015}]), /no readable/);
    assert.throws(() => Miot.parsePropertyResponse({code: 0}), /non-array/);
    assert.throws(() => Miot.parsePropertyResponse([]), /no readable/);
});

test("requires an explicit MIoT success code for actions", () => {
    assert.doesNotThrow(() => Miot.assertActionSuccess({code: 0}));
    assert.doesNotThrow(() => Miot.assertActionSuccess([{code: 0}]));
    assert.throws(() => Miot.assertActionSuccess({code: -30015}), /not acknowledged/);
    assert.throws(() => Miot.assertActionSuccess(["ok"]), /not acknowledged/);
    assert.throws(() => Miot.assertActionSuccess([]), /not acknowledged/);
});
