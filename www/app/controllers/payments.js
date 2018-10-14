import Controller from '@ember/controller';
import { inject } from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  applicationController: inject('application'),
  stats: computed.reads('applicationController'),
  settings: computed.reads('applicationController.model.settings'),
  config: computed.reads('applicationController.config'),

  PaymentsAmount: computed({
    get() {
      return (parseFloat(this.get('model').paymentsAmount) / 1000000000);
    }
  }),

  earnPerDay: computed('stats', {
    // earn per day per 1 GH/s
    get() {
      let reward = this.getWithDefault('stats.blockReward', this.get('config').BlockReward);
      let blocktime = this.getWithDefault('stats.blockTime', this.get('config').BlockTime);
      return (24 * 60 * 60 / blocktime * reward * 1000000000 / this.get('stats.hashrate')).toFixed(2);
    }
  }),

  // try to read some settings from the model.settings
  PayoutThreshold: computed('settings', {
    get() {
      var threshold = this.get('settings.PayoutThreshold');
      if (threshold) {
        // in shannon (10**9)
        return threshold / 1000000000;
      }
      return this.get('config').PayoutThreshold;
    }
  })
});
