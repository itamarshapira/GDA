// src/services/alertPriority.js

/**
 * Alert Priority Lookup Table
 * ---------------------------
 * Key   = bit mask (UInt16)
 * Value = alert metadata
 *
 * NOTE:
 * 0x0001 === 1
 * 0x0002 === 2
 * 0x0004 === 4
 * etc…
 * JavaScript treats these as normal numbers internally.
 */

export const ALERT_PRIORITY = {
  0x0001: { name: "power_up", priority: 1 },
  0x0002: { name: "alignment", priority: 2 },
  0x0004: { name: "calib_mode", priority: 3 },
  0x0008: { name: "misAlignment", priority: 8 },
  0x0010: { name: "HW_Fault", priority: 4 },
  0x0020: { name: "param_fault", priority: 5 },
  0x0040: { name: "calib_fault", priority: 6 },
  0x0080: { name: "power_fault", priority: 7 },
  0x0100: { name: "warn_level", priority: 10 },
  0x0200: { name: "alarm_level", priority: 9 },
  0x0400: { name: "gas_mixture", priority: 11 },
  0x0800: { name: "safety_delay", priority: 14 },
  0x1000: { name: "no_sync", priority: 13 },
  0x2000: { name: "beam_blocked", priority: 12 },
  0x4000: { name: "peak_detect", priority: 15 },
  0x8000: { name: "fake_peak_detect", priority: 16 },
};
