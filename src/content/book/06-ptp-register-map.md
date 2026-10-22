---
title: "Chapter 6 — PTP Register Map"
description: "BAR0 register offsets and safe timestamp access sequence for the documented PTP grandmaster interface."
part: "Part III — Integration Notes"
chapter: "6. PTP Register Map"
order: 21
category: "PTP Timing"
tags: ["PTP", "Register Map", "PCIe", "BAR0", "Timestamp"]
---

# PTP Register Map

The repository documents a 4 KiB PTP register window at BAR0 offsets `0x1000–0x1FFF`. The table below is a curated index of the register map; consult the [full register specification](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/REGISTER_MAP.md) before implementing a host driver. Offsets and behavior here describe the repository documentation and should be checked against the current RTL before hardware use.

## Version and status

| Offset | Register | Access | Purpose |
| --- | --- | --- | --- |
| `0x1000` | `PTP_VERSION` | R | Version encoded as major/minor/patch/build bytes |
| `0x1004` | `PTP_CAPABILITIES` | R | Feature flags, including GPS, OCXO, hardware timestamp, holdover, and survey mode |
| `0x1008` | `PTP_STATUS` | R | Overall lock/status bits |
| `0x1030` | `GPS_STATUS` | R | GPS lock/fix state |
| `0x1034` | `GPS_SATELLITES` | R | Satellite count |
| `0x1038` | `GPS_SURVEY_CFG` | R/W | Survey-in enable |
| `0x103C` | `GPS_SURVEY_DUR` | R/W | Survey duration in seconds |

The source map gives `0x01000000` as the current documented version value and `0x1F` as the capability example. Treat those as documented defaults, not as a live read from a programmed board.

## Reading the precision hardware clock

The PHC timestamp is 80 bits: 48 seconds bits and 32 nanoseconds bits, split across three aligned 32-bit registers. The register map specifies a latch sequence to avoid tearing while the clock advances:

1. Read `PHC_SEC_HI` at `0x1010` first; this captures the timestamp.
2. Read `PHC_SEC_LO` at `0x1014`.
3. Read `PHC_NSEC` at `0x1018`; this completes and clears the latch.

Combine seconds as `((sec_hi & 0xFFFF) << 32) | sec_lo`. Nanoseconds are documented in the range 0 through 999,999,999. A driver must use the specified order and serialize access if multiple readers share the latch.

## Adjustments

| Offset | Register | Access | Purpose |
| --- | --- | --- | --- |
| `0x1020` | `PHC_ADJ_SEC` | W | Coarse adjustment seconds |
| `0x1024` | `PHC_ADJ_NSEC` | W | Fine adjustment nanoseconds |
| `0x1028` | `PHC_ADJ_FREQ` | W | Signed frequency adjustment in parts per billion |
| `0x102C` | `PHC_ADJ_TRIGGER` | W | Apply the staged adjustment; bit 0 selects add/subtract and bit 1 triggers |

The source describes the trigger as self-clearing. Confirm write ordering and signed-value encoding in RTL before relying on these semantics in a production driver.

## Driver checklist

- Use aligned 32-bit accesses and the exact register endianness defined by the host/endpoint path.
- Read the full timestamp in the documented latch order.
- Validate reserved bits and reject nanosecond values outside the documented range.
- Test adjustment boundaries, trigger behavior, and concurrent readers in simulation and on hardware.
- Keep register-map documentation, RTL decode, and host-driver constants synchronized.

Source: [timing/REGISTER_MAP.md](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/REGISTER_MAP.md).
