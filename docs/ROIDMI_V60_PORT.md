# Roidmi EVE Plus (roidmi.vacuum.v60) experimental port

This is **not** a supported, installable Valetudo firmware release. This fork contains a
first vendor adapter, not a root exploit, cloud bypass, map extractor, or guaranteed
way to start a robot whose vendor cloud is unavailable.

## What is actually implemented

- `RoidmiV60ValetudoRobot` is registered as an **explicit** implementation; auto-detection is disabled.
- The local miIO transport is inherited from `MiioValetudoRobot`.
- The `get_properties` request reads state (2/1), battery (3/1), charging (3/2), error code (2/2).
- Start (2/1), stop (2/2), and dock (3/1) use the MIoT `action` RPC and require success `code: 0`.
- Pause is deliberately unsupported; it is **not** silently mapped to stop.
- Maps and room/zone controls are **not implemented**; no fake map is generated.
- The port does not log local or cloud secret values during startup.

The mappings and action definitions are grounded in python-miio:
https://python-miio.readthedocs.io/en/latest/_modules/miio/integrations/roidmi/vacuum/roidmivacuum_miot.html

## Why this fork cannot yet control the reported EVE Plus

Lab observations on `roidmi.vacuum.v60` (DID redacted):

- LAN UDP/54321 hello succeeds on the robot's network address.
- Authenticated LAN RPC with both saved AP pairing tokens times out, including when using python-miio.
- Pairing AP mode responds to `miIO.info` with authenticated data.
- Pairing AP `get_properties` replies with error -30015.
- No confirmed root method or access to the robot's map files is available.

A successful hello is not proof of a valid LAN token.
The app's UI and MIoT action mappings cannot override a rejected/unknown token.

## Before attempting an embedded Valetudo installation

1. Find a reproducible and reversible **model- and firmware-specific** root method for `roidmi.vacuum.v60`.
2. Determine actual miIO `device.conf`, local token and cloud key file paths; do **not** reuse Viomi paths blindly.
3. Confirm local authenticated MIoT property and action calls with a valid token.
4. Recover a real Roidmi map sample and document its format and upload/stream transport.
5. Then enable embedded model detection, verified map support, and build/install steps.

The driver deliberately does not register capabilities for unimplemented maps.
Do not flash images intended for other robot models.

## Developer configuration

Only for controlled development with a **known working local token**, set
`robot.implementation` to `RoidmiV60ValetudoRobot`, and populate
`robot.implementationSpecificConfig.ip`, `deviceId`, and `localSecret`
locally. Never commit tokens. The `embedded` mode is not supported until
the previous checklist is completed.

Run the isolated mapping tests:

```sh
node --test backend/test/robots/roidmi/RoidmiV60Miot_test.js
```

The full backend tests require the repository's normal Node dependencies.
