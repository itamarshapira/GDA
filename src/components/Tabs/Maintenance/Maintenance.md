## Temporarily Disabled Features

### G-Force Axis & Detector Angle

**Status:** Disabled temporarily  
**Date:** 2026-10-18

**Location:** Detector MediaControl component

**Reason:**
G-Force Axis and Detector Angle are currently not required in the application's UI.

**Current implementation:**
The JSX section is disabled using:

`{false && (...)}`

The original implementation remains in the source code.

**To restore:**
Remove the conditional wrapper or change `false` to `true`.

**Important:**
Only the UI was disabled. Verify whether accelerometer BLE notifications and related calculations are still active before re-enabling the feature.
