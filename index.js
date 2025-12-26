'use strict';

const fs = require('fs-extra');
const config = require('v-conf');
const i2c = require('i2c-bus');

module.exports = ControllerES9018K2M;

function ControllerES9018K2M(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.logger.info("ControllerES9018K2M::constructor");
}

// ===================
// INIT
// ===================
ControllerES9018K2M.prototype.onVolumioStart = function() {
  this.configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
  this.getConf(this.configFile);
  return Promise.resolve();
};

ControllerES9018K2M.prototype.getConfigurationFiles = function() {
  return ['config.json'];
};

ControllerES9018K2M.prototype.getConf = function(configFile) {
  this.config = new config();
  this.config.loadFile(configFile);
};

ControllerES9018K2M.prototype.saveConfig = function() {
  this.config.set('volumeLevel', this.volumeLevel);
  this.config.set('balance', this.balance);
  this.config.set('balanceNote', this.balanceNote);

  this.config.set('fir', this.fir);
  this.config.set('firLabel', this.firLabel);
  this.config.set('iir', this.iir);
  this.config.set('iirLabel', this.iirLabel);
  this.config.set('deemphasis', this.deemphasis);
  this.config.set('deemphasisLabel', this.deemphasisLabel);

  this.config.set('i2sDPLL', this.i2sDPLL);
  this.config.set('i2sLabelDPLL', this.i2sLabelDPLL);
  this.config.set('dsdDPLL', this.dsdDPLL);
  this.config.set('dsdLabelDPLL', this.dsdLabelDPLL);
};

// ===================
// I2C read/write
// ===================
ControllerES9018K2M.prototype.readRegister = async function(regAddr) {
  try {
    const bus = await i2c.openPromisified(1);
    const byte = await bus.readByte(this.deviceAddress, regAddr);
    await bus.close();
    return byte;
  } catch (err) {
    this.logger.error("readRegister error: " + err);
    return null;
  }
};

ControllerES9018K2M.prototype.writeRegister = async function(regAddr, regVal) {
  try {
    const bus = await i2c.openPromisified(1);
    await bus.writeByte(this.deviceAddress, regAddr, regVal);
    await bus.close();
  } catch (err) {
    this.logger.error("writeRegister error: " + err);
  }
};

// ===================
// UI CONFIG
// ===================
ControllerES9018K2M.prototype.getUIConfig = async function() {
  const lang_code = this.commandRouter.sharedVars.get('language_code');
  let uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

  uiconf.sections[1].content[0].config.bars[0].value = this.volumeLevel;
  uiconf.sections[2].content[0].config.bars[0].value = this.balance;

  // остальные поля фильтров и DPLL
  uiconf.sections[3].content[0].value = {value: this.fir, label: this.firLabel};
  uiconf.sections[3].content[1].value = {value: this.iir, label: this.iirLabel};
  uiconf.sections[3].content[2].value = {value: this.deemphasis, label: this.deemphasisLabel};
  uiconf.sections[4].content[0].value = {value: this.i2sDPLL, label: this.i2sLabelDPLL};
  uiconf.sections[4].content[1].value = {value: this.dsdDPLL, label: this.dsdLabelDPLL};

  this.applyFunction();
  return uiconf;
};

ControllerES9018K2M.prototype.updateUIConfig = async function() {
  let uiconf = await this.getUIConfig();
  this.commandRouter.broadcastMessage('pushUiConfig', uiconf);
};

// ===================
// DEVICE INIT
// ===================
ControllerES9018K2M.prototype.initVariables = function() {
  this.ready = true;
  this.volumeLevel = 90;
  this.channel = true;
  this.channelLabel = "Left/Right";

  this.fir = 1;
  this.firLabel = "Fast Roll Off";
  this.iir = 0;
  this.iirLabel = "47K";
  this.deemphasis = 66;
  this.deemphasisLabel = "Off";

  this.i2sDPLL = 80;
  this.i2sLabelDPLL = "05";
  this.dsdDPLL = 10;
  this.dsdLabelDPLL = "10";

  this.lBal = 0;
  this.rBal = 0;
  this.balance = 0;
  this.balanceNote = "Mid Balance";
  this.centerBalance = 40;

  this.enableTHD = false;
};

ControllerES9018K2M.prototype.initRegister = function() {
  this.deviceAddress = 0x48;
  this.statusReg = 64;
  this.reg0=0x00;
  this.reg4=0x00;
  this.reg5=0x68;
  this.reg7=0x80;
  this.reg12=0x5A;
  this.reg21=0x00;
};

ControllerES9018K2M.prototype.initDevice = async function() {
  await this.muteES9018K2m();
  await this.writeRegister(0, this.reg0);
  await this.writeRegister(4, this.reg4);
  await this.writeRegister(5, this.reg5);
  await this.setVolume(this.volumeLevel);
  await this.unmuteES9018K2m();
};

// ===================
// VOLUME & BALANCE
// ===================
ControllerES9018K2M.prototype.setVolume = async function(regVal) {
  let value = 100 - regVal;
  await this.writeRegister(15, value + this.lBal);
  await this.writeRegister(16, value + this.rBal);
};

ControllerES9018K2M.prototype.muteES9018K2m = async function() {
  this.reg7 |= 0x03; // mute both channels
  await this.writeRegister(7, this.reg7);
};

ControllerES9018K2M.prototype.unmuteES9018K2m = async function() {
  this.reg7 &= ~0x03; // unmute both channels
  await this.writeRegister(7, this.reg7);
};

ControllerES9018K2M.prototype.setBalance = async function(value){
  value += this.centerBalance;

  if (value === this.centerBalance) {
    this.lBal = 0;
    this.rBal = 0;
    this.balanceNote = "Mid Balance";
  } else if (value > this.centerBalance) {
    this.rBal = 0;
    this.lBal = value - this.centerBalance;
    this.balanceNote = `Right ${this.lBal/2} dB`;
  } else {
    this.lBal = 0;
    this.rBal = this.centerBalance - value;
    this.balanceNote = `Left ${this.rBal/2} dB`;
  }

  await this.setVolume(this.volumeLevel);
  await this.updateUIConfig();
};

// ===================
// FIR/IIR/Deemphasis
// ===================
ControllerES9018K2M.prototype.setFirFilter = async function(selected){
  this.fir = selected.value;
  this.firLabel = selected.label;

  switch(selected.value) {
    case 0:
      this.reg7 |= (1<<5); this.reg7 &= ~(1<<6); this.reg21 &= ~(1<<0);
      break;
    case 1:
      this.reg7 &= ~(1<<5); this.reg7 &= ~(1<<6); this.reg21 &= ~(1<<0);
      break;
    case 2:
      this.reg7 &= ~(1<<5); this.reg7 |= (1<<6); this.reg21 &= ~(1<<0);
      break;
    case 3:
      this.reg21 |= (1<<0);
      break;
  }
  await this.writeRegister(7, this.reg7);
  await this.writeRegister(21, this.reg21);
};

ControllerES9018K2M.prototype.setIirFilter = async function(selected){
  this.iir = selected.value;
  this.iirLabel = selected.label;

  switch(selected.value){
    case 0: this.reg7 &= ~0x0C; this.reg21 &= ~(1<<2); break;
    case 1: this.reg7 = (this.reg7 | (1<<2)) & ~(1<<3); this.reg21 &= ~(1<<2); break;
    case 2: this.reg7 = (this.reg7 | (1<<3)) & ~(1<<2); this.reg21 &= ~(1<<2); break;
    case 3: this.reg7 |= 0x0C; this.reg21 &= ~(1<<2); break;
    case 4: this.reg21 |= (1<<2); break;
  }
  await this.writeRegister(7, this.reg7);
  await this.writeRegister(21, this.reg21);
};

ControllerES9018K2M.prototype.setDeemphasisFilter = async function(selected){
  this.deemphasis = selected.value;
  this.deemphasisLabel = selected.label;
  await this.writeRegister(6, selected.value);
};

// ===================
// DPLL
// ===================
ControllerES9018K2M.prototype.setI2sDPLL = async function(selected){
  this.i2sDPLL = selected.value;
  this.i2sLabelDPLL = selected.label;
  this.reg12 &= 0x0F;
  this.reg12 |= selected.value;
  await this.writeRegister(0x0C, this.reg12);
};

ControllerES9018K2M.prototype.setDsdDPLL = async function(selected){
  this.dsdDPLL = selected.value;
  this.dsdLabelDPLL = selected.label;
  this.reg12 &= 0xF0;
  this.reg12 |= selected.value;
  await this.writeRegister(0x0C, this.reg12);
};

// ===================
// APPLY ALL SETTINGS
// ===================
ControllerES9018K2M.prototype.applyFunction = async function(){
  await this.setBalance(this.balance);
  await this.setFirFilter({value: this.fir,label:this.firLabel});
  await this.setIirFilter({value: this.iir,label:this.iirLabel});
  await this.setDeemphasisFilter({value:this.deemphasis,label:this.deemphasisLabel});
  await this.setI2sDPLL({value:this.i2sDPLL,label:this.i2sLabelDPLL});
  await this.setDsdDPLL({value:this.dsdDPLL,label:this.dsdLabelDPLL});
  await this.unmuteES9018K2m();
};
