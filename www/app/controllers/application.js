import Ember from 'ember';
import config from '../config/environment';

export default Ember.Controller.extend({
  intl: Ember.inject.service(),
  get config() {
    return config.APP;
  },

  height: Ember.computed('model.nodes', {
    get() {
      var node = this.get('bestNode');
      if (node) {
        return node.height;
      }
      return 0;
    }
  }),

  roundShares: Ember.computed('model.stats', {
    get() {
      return parseInt(this.get('model.stats.roundShares'));
    }
  }),

  difficulty: Ember.computed('model.nodes', {
    get() {
      var node = this.get('bestNode');
      if (node) {
        return node.difficulty;
      }
      return 0;
    }
  }),

  blockTime: Ember.computed('model.nodes', {
    get() {
      var node = this.get('bestNode');
      if (node && node.blocktime) {
        return node.blocktime;
      }
      return config.APP.BlockTime;
    }
  }),

  blockReward: Ember.computed('model', {
    get() {
      var blockReward = this.get('model.blockReward');
      blockReward = blockReward * 1e-18;
      return blockReward;
    }
  }),

  hashrate: Ember.computed('difficulty', {
    get() {
      var blockTime = this.get('blockTime');
      return this.getWithDefault('difficulty', 0) / blockTime;
    }
  }),

  immatureTotal: Ember.computed('model', {
    get() {
      return this.getWithDefault('model.immatureTotal', 0) + this.getWithDefault('model.candidatesTotal', 0);
    }
  }),

  bestNode: Ember.computed('model.nodes', {
    get() {
      var node = null;
      this.get('model.nodes').forEach(function (n) {
        if (!node) {
          node = n;
        }
        if (node.height < n.height) {
          node = n;
        }
      });
      return node;
    }
  }),

  lastBlockFound: Ember.computed('model', {
    get() {
      return parseInt(this.get('model.lastBlockFound')) || 0;
    }
  }),

  languages: Ember.computed('model', {
    get() {
      return this.get('model.languages');
    }
  }),

  selectedLanguage: Ember.computed({
    get() {
      var langs = this.get('languages');
      var lang = Ember.$.cookie('lang');
      for (var i = 0; i < langs.length; i++) {
        if (langs[i].value == lang) {
          return langs[i].name;
        }
      }
      return lang;
    }
  }),

  currencies: Ember.computed('model', {
    get() {
      return config.APP.currencies;
    }
  }),

  selectedCurrency: Ember.computed({
    get() {
      var currencies = this.get('currencies');
      var currency = Ember.$.cookie('currency');
      for (var i = 0; i < currencies.length; i++) {
        if (currencies[i].value === currency) {
          return currencies[i].name;
        }
      }
      return currency;
    }
  }),

  roundVariance: Ember.computed('model', {
    get() {
      var percent = this.get('model.stats.roundShares') / this.get('difficulty');
      if (!percent) {
        return 0;
      }
      return percent.toFixed(2);
    }
  }),

  nextEpoch: Ember.computed('height', {
    get() {
      var epochOffset = (30000 - (this.getWithDefault('height', 1) % 30000)) * 1000 * this.get('config').BlockTime;
      return Date.now() + epochOffset;
    }
  })
});
