    // src/constants/bleUuids.js

// ✅ Generic Access Service (0x1800) // * done
export const GENERIC_ACCESS_UUID = "00001800-0000-1000-8000-00805f9b34fb";// prime uuid for generic access service
export const DEVICE_NAME_UUID = "00002a00-0000-1000-8000-00805f9b34fb";
export const APPEARANCE_UUID = "00002a01-0000-1000-8000-00805f9b34fb";

// ✅ Generic Attribute Service (0x1801) // * No need to read anything here, just for service discovery.
export const GENERIC_ATTRIBUTE_UUID = "00001801-0000-1000-8000-00805f9b34fb"; // prime uuid for generic attribute service
export const SERVICE_CHANGED_UUID = "00002a05-0000-1000-8000-00805f9b34fb";

// ✅ Device Information Service (0x180A) -  // * done
export const DEVICE_INFORMATION_UUID = "0000180a-0000-1000-8000-00805f9b34fb"; // prime uuid for device information service
export const MANUFACTURER_UUID = "00002a29-0000-1000-8000-00805f9b34fb";
export const MODEL_NUMBER_UUID = "00002a24-0000-1000-8000-00805f9b34fb";
export const SYSTEM_ID_UUID = "00002a23-0000-1000-8000-00805f9b34fb";
export const PRESENTATION_FORMAT_UUID = "00002a3d-0000-1000-8000-00805f9b34fb"; // ! this not used yet, but ok to keep

// ✅ Alert Notification Service (0x1811)`
export const ALERT_NOTIFICATION_UUID = "00001811-0000-1000-8000-00805f9b34fb"; // prime uuid for alert notification service
export const ALERT_STATUS_UUID = "00002a3f-0000-1000-8000-00805f9b34fb";

// ✅ Environmental Sensing Service (0x181A)
export const ENVIRONMENTAL_SENSING_UUID = "0000181a-0000-1000-8000-00805f9b34fb";   // prime uuid for environmental sensing service
export const METHANE_UUID = "00002bd1-0000-1000-8000-00805f9b34fb";
export const TEMPERATURE_UUID = "00002a6e-0000-1000-8000-00805f9b34fb";
export const MEASUREMENT_INTERVAL_UUID = "00002a21-0000-1000-8000-00805f9b34fb";

// ✅ Media Control Service (0x1848)
export const MEDIA_CONTROL_UUID = "00001848-0000-1000-8000-00805f9b34fb";  // prime uuid for media control service
export const MEDIA_CONTROL_POINT_UUID = "00002ba4-0000-1000-8000-00805f9b34fb";

// ✅ Custom FG Settings Service deviceSettings
export const FG_SETTINGS_UUID = "1b7e8251-2877-41c3-b46e-cf057c562024"; // prime uuid for FG settings service
export const FULL_SCALE_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078901";
export const ALARM_LEVEL_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078902";
export const WARN_LEVEL_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078903";
export const LOWEST_LEVEL_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078904";
export const RESPONSE_TIME_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078905";
export const BLOCK_DELAY_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078906";
export const SELECT_GAS_TYPE_UUID = "889bf2a8-f93f-4481-a67e-3b2f4a078907";
