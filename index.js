'use strict';

const fs = require('fs');
const path = require('path');
const config = require('v-conf');

module.exports = ControllerEs9018k2m;

function ControllerEs9018k2m(context) {
    this.context = context;
    this.commandRouter = context.coreCommand;
    this.logger = context.logger;

    this.configFile = path.join(__dirname, 'config.json');
    this.config = new config();
}

/* =========================
   LIFECYCLE
========================= */

ControllerEs9018k2m.prototype.onVolumioStart = function () {
    this.logger.info('ES9018K2M plugin starting');

    try {
        this.config.loadFile(this.configFile);
        this.logger.info('Config loaded');
    } catch (e) {
        this.logger.error('Failed to load config: ' + e);
    }

    return Promise.resolve();
};

ControllerEs9018k2m.prototype.onStop = function () {
    this.logger.info('ES9018K2M plugin stopped');
    return Promise.resolve();
};

ControllerEs9018k2m.prototype.onRestart = function () {
    this.logger.info('ES9018K2M plugin restarted');
    return Promise.resolve();
};

/* =========================
   UI
========================= */

ControllerEs9018k2m.prototype.getUIConfig = function () {
    const uiConfigPath = path.join(__dirname, 'UIConfig.json');

    try {
        const uiconfig = JSON.parse(fs.readFileSync(uiConfigPath));
        return Promise.resolve(uiconfig);
    } catch (e) {
        this.logger.error('Failed to load UIConfig.json: ' + e);
        return Promise.reject(e);
    }
};

ControllerEs9018k2m.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};

/* =========================
   CONTROLS
========================= */

ControllerEs9018k2m.prototype.execVolumeControl = function (data) {
    this.logger.info('Volume control: ' + JSON.stringify(data));

    if (data?.volume_adjust !== undefined) {
        this.config.set('volumeLevel.value', data.volume_adjust);
    }

    return Promise.resolve();
};

ControllerEs9018k2m.prototype.execBalanceControl = function (data) {
    this.logger.info('Balance control: ' + JSON.stringify(data));

    if (data?.balance_adjust !== undefined) {
        this.config.set('balance.value', data.balance_adjust);
    }

    if (data?.channel_switch) {
        this.config.set('channel.value', data.channel_switch.value);
        this.config.set('channelLabel.value', data.channel_switch.label);
    }

    return Promise.resolve();
};

ControllerEs9018k2m.prototype.execResetBalanceControl = function () {
    this.logger.info('Reset balance');

    this.config.set('balance.value', 0);
    this.config.set('channel.value', true);
    this.config.set('channelLabel.value', 'Left/Right');

    return Promise.resolve();
};

ControllerEs9018k2m.prototype.execDigitalFilterControl = function (data) {
    this.logger.info('Digital filter control: ' + JSON.stringify(data));

    if (data?.fir_filter) {
        this.config.set('fir.value', data.fir_filter.value);
        this.config.set('firLabel.value', data.fir_filter.label);
    }

    if (data?.iir_filter) {
        this.config.set('iir.value', data.iir_filter.value);
        this.config.set('iirLabel.value', data.iir_filter.label);
    }

    if (data?.deemphasis_filter) {
        this.config.set('deemphasis.value', data.deemphasis_filter.value);
        this.config.set('deemphasisLabel.value', data.deemphasis_filter.label);
    }

    return Promise.resolve();
};

ControllerEs9018k2m.prototype.execDpllControl = function (data) {
    this.logger.info('DPLL control: ' + JSON.stringify(data));

    if (data?.i2sDPLL) {
        this.config.set('i2sDPLL.value', data.i2sDPLL.value);
        this.config.set('i2sLabelDPLL.value', data.i2sDPLL.label);
    }

    if (data?.dsdDPLL) {
        this.config.set('dsdDPLL.value', data.dsdDPLL.value);
        this.config.set('dsdLabelDPLL.value', data.dsdDPLL.label);
    }

    return Promise.resolve();
};
