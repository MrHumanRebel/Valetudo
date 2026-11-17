#!/usr/bin/env python3
"""Receive-only serial logger for Roidmi EVE Plus bring-up.

Wire only robot TX -> adapter RX, and robot GND -> adapter GND.
DO NOT connect adapter TX or VCC to the robot.
Requires: python -m pip install pyserial
"""

import argparse
import hashlib
import pathlib
import sys
import time


def main():
    parser = argparse.ArgumentParser(description="Read-only UART capture; never sends serial data")
    parser.add_argument("--port", required=True, help="USB UART COM port (e.g. COM5)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default 115200)")
    parser.add_argument("--seconds", type=float, default=90, help="Capture duration")
    parser.add_argument("--out", type=pathlib.Path, required=True, help="New output file; never overwritten")
    args = parser.parse_args()

    if args.baud < 1200 or args.seconds <= 0:
        parser.error("baud must be >=1200 and seconds must be >0")

    try:
        import serial
    except ImportError:
        parser.error("Missing pyserial; install with: py -m pip install pyserial")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    if args.out.exists():
        parser.error(f"Output file exists (will not overwrite): {args.out}")

    port = serial.Serial()
    port.port = args.port
    port.baudrate = args.baud
    port.bytesize = serial.EIGHTBITS
    port.parity = serial.PARITY_NONE
    port.stopbits = serial.STOPBITS_ONE
    port.timeout = 0.25
    port.xonxoff = False
    port.rtscts = False
    port.dsrdtr = False
    port.dtr = False
    port.rts = False

    count = 0
    digest = hashlib.sha256()
    try:
        with open(args.out, "xb") as output:
            try:
                port.open()
            except Exception:
                args.out.unlink(missing_ok=True)
                raise
            print(f"Capturing RX only from {args.port} at {args.baud} baud; no bytes are transmitted")
            print("Power up robot only after safe board identification and wiring. Ctrl+C stops.")
            deadline = time.monotonic() + args.seconds
            try:
                while time.monotonic() < deadline:
                    block = port.read(4096)
                    if block:
                        output.write(block)
                        digest.update(block)
                        count += len(block)
            except KeyboardInterrupt:
                print("Stopped by user.")
            finally:
                port.close()
                output.flush()
    except OSError as exc:
        print(f"Capture failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    print(f"Saved {count} raw bytes to {args.out}, sha256={digest.hexdigest()}")
    print("Raw boot logs can contain Wi-Fi credentials, device identities or secrets: inspect before sharing.")
    if count == 0:
        print("No bytes received: check robot boot, cable, GND, correct TX, adapter voltage, and COM port.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
