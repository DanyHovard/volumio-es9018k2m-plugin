'use strict';

const fs = require('fs');
const path = require('path');
const BaseController = require('volumio-controller').BaseController;

module.exports = ControllerEs9018k2m;

function ControllerEs9018k2m(context) {
    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.configFile = path.join(__dirname, 'config.json');
    this.config = {};
}

ControllerEs9018k2m.prototype.onVolumioStart = async function () {
    this.logger.info('ES9018K2M Controller starting...');
    this.loadConfig();
};

ControllerEs9018k2m.prototype.loadConfig = function () {
    try {
        if (fs.existsSync(this.configFile)) {
            const data = fs.readFileSync(this.configFile);
            this.config = JSON.parse(data);
        } else {
            this.logger.warn('Config file not found, using defaults');
            this.config = {};
        }
    } catch (e) {
        this.logger.error('Error loading config.json: ' + e);
        this.config = {};
    }
};

ControllerEs9018k2m.prototype.saveConfig = function () {
    try {
        fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
        this.logger.info('Config saved');
    } catch (e) {
        this.logger.error('Error saving config.json: ' + e);
    }
};

// ********** UI METHODS **********
ControllerEs9018k2m.prototype.getUIConfig = function () {
    const uiConfigPath = path.join(__dirname, 'UIConfig.json');
    let uiconfig = {};
    try {
        uiconfig = JSON.parse(fs.readFileSync(uiConfigPath));
    } catch (e) {
        this.logger.error('Cannot load UIConfig.json: ' + e);
    }
    return uiconfig;
};

ControllerEs9018k2m.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};

// ********** API METHODS **********
ControllerEs9018k2m.prototype.execDeviceCheckControl = function (data) {
    this.logger.info('Checking device status...');
    // Тут можешь вставить реальный код проверки устройства
    return true;
};

ControllerEs9018k2m.prototype.execResetDeviceControl = function (data) {
    this.logger.info('Resetting device...');
    // Реальная логика сброса
    return true;
};

ControllerEs9018k2m.prototype.execVolumeControl = function (data) {
    this.logger.info('Setting volume: ' + JSON.stringify(data));
    this.config.volumeLevel.value = data.volume_adjust || this.config.volumeLevel.value;
    this.saveConfig();
    return true;
};

ControllerEs9018k2m.prototype.execBalanceControl = function (data) {
    this.logger.info('Setting balance: ' + JSON.stringify(data));
    this.config.balance.value = data.balance_adjust || this.config.balance.value;
    this.config.channel.value = data.channel_switch.value;
    this.config.channelLabel.value = data.channel_switch.label;
    this.saveConfig();
    return true;
};

ControllerEs9018k2m.prototype.execResetBalanceControl = function () {
    this.logger.info('Resetting balance');
    this.config.balance.value = 0;
    this.config.channel.value = true;
    this.config.channelLabel.value = 'Left/Right';
    this.saveConfig();
    return true;
};

ControllerEs9018k2m.prototype.execDigitalFilterControl = function (data) {
    this.logger.info('Setting digital filters: ' + JSON.stringify(data));
    this.config.fir.value = data.fir_filter.value;
    this.config.firLabel.value = data.fir_filter.label;
    this.config.iir.value = data.iir_filter.value;
    this.config.iirLabel.value = data.iir_filter.label;
    this.config.deemphasis.value = data.deemphasis_filter.value;
    this.config.deemphasisLabel.value = data.deemphasis_filter.label;
    this.saveConfig();
    return true;
};

ControllerEs9018k2m.prototype.execDpllControl = function (data) {
    this.logger.info('Setting DPLL: ' + JSON.stringify(data));
    this.config.i2sDPLL.value = data.i2sDPLL.value;
    this.config.i2sLabelDPLL.value = data.i2sDPLL.label;
    this.config.dsdDPLL.value = data.dsdDPLL.value;
    this.config.dsdLabelDPLL.value = data.dsdDPLL.label;
    this.saveConfig();
    return true;
};

// ********** VOLATILE **********
ControllerEs9018k2m.prototype.onStop = function () {
    this.logger.info('ES9018K2M Controller stopped');
    return Promise.resolve();
};

ControllerEs9018k2m.prototype.onRestart = function () {
    this.logger.info('ES9018K2M Controller restarted');
    return Promise.resolve();
};
