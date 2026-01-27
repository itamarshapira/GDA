✅ 1. Reliability (MOST IMPORTANT)

Before any new features:

Auto-reconnect if BLE drops

Clear “Disconnected” state

GATT refresh only when needed

Prevent double subscriptions (you mostly solved this already)

Timeout + retry logic

If this fails → nothing else matters.

✅ 2. User clarity (operators are NOT developers)

Right now your UI is technical.

You need:

Big connection status indicator

Clear device name

Big current gas value

Obvious ALERT vs OK

Not:

Raw UUID concepts

Debug text

Hidden states

Think:

firefighter opens app → immediately understands.

✅ 3. Alarm UX

You already compute alert priority.

You still need:

Sound / vibration on alert

Full-screen alert mode

Flash screen red on alarm

Auto jump to Alert tab

This is critical for safety.

✅ 4. Minimal device control

You already have:

Gas

Temp

Interval

Settings

Media control

What’s missing:

Presets (“Factory”, “Indoor”, “Outdoor”)

Reset to defaults

Save profile to device

Export logs

What is NOT urgent

Be brutal here:

❌ Animations
❌ Fancy graphs
❌ Themes
❌ Dark/light toggle
❌ Extra tabs

Later.
