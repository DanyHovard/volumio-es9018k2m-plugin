# ES9018K2M I²C Control Plugin for Volumio

Volumio 4 plugin for direct hardware control of the ES9018K2M DAC via I²C.
Provides real-time control over volume, balance, digital filters, DPLL settings and device status using ES9018K2M internal registers.

⚠️ Requirements
- Volumio OS
- ES9018K2M DAC connected via I²C
- Enabled I²C interface
- Correct I²C address (default: 0x48)
- Node.js environment provided by Volumio

Updated for Volumio 4.073 compatibility.

 * supported es9018k2m hardware
   - Aoide es9018k2m DAC II (tested)
   - General es9018k2m DAC/DDC that contains i2c pins
 * supported platform: Raspberry Pi 
 * supported functions
   - volume, mute control
   - adjust balance and switch left/right channel
   - digital filter(fast/slow rolloff, IIR) and de-emphasis filter
   - i2s/DSD DPLL(Digital Phase Locked Loop) Jitter Reduction

## Changes for Volumio 4.073
- Updated i2c library from deprecated `i2c` to `i2c-bus`
- Updated dependencies to modern versions
- Improved error handling and i2c bus management
- Fixed bug in setIirFilter method
