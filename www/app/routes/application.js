import Ember from 'ember';
import config from '../config/environment';

function selectLocale(selected) {
  // FIXME
  let supported = ['en', 'ko', 'en-us'];
  const language = navigator.languages[0] || navigator.language || navigator.userLanguage;

  let locale = selected;

  if (locale == null) {
    // default locale
    locale = language;
    if (supported.indexOf(locale) < 0) {
      locale = locale.replace(/\-[a-zA-Z]*$/, '');
    }
  }
  if (supported.indexOf(locale) >= 0) {
    if (locale === 'en') {
      locale = 'en-us';
    }
  } else {
    locale = 'en-us';
  }
  return locale;
}

export default Ember.Route.extend({
  intl: Ember.inject.service(),
  selectedLanguage: null,
  languages: null,
  poolSettings: null,
  poolCharts: null,
  chartTimestamp: 0,
  priceInfo: null,
  priceTimestamp: 0,
  currencies: null,
  selectedCurrency: null,

  beforeModel() {
    let locale = this.get('selectedLanguage');
    if (!locale) {
      // read cookie
      locale = Ember.$.cookie('lang');
      // pick a locale
      locale = selectLocale(locale);

      this.get('intl').setLocale(locale);
      Ember.$.cookie('lang', locale);
      console.log('INFO: locale selected - ' + locale);
      this.set('selectedLanguage', locale);

      // read currency cookie
      let curr = Ember.$.cookie('currency');
      // or read default currency
      curr = curr ? curr : config.APP.defaultCurrencies[locale.substr(0, 2)];
      if (Object.values(config.APP.defaultCurrencies).indexOf(curr) > -1) {
        this.set('selectedCurrency', curr);
      } else {
        this.set('selectedCurrency', 'USD');
      }
    }

    let intl = this.get('intl');
    this.set('languages', [
      { name: intl.t('lang.korean'), value: 'ko'},
      { name: intl.t('lang.english'), value: 'en-us'}
    ]);

    let settings = this.get('poolSettings');
    if (!settings) {
      let self = this;
      let url = config.APP.ApiUrl + 'api/settings';
      Ember.$.ajax({
        url: url,
        type: 'GET',
        header: {
          'Accept': 'application/json'
        },
        success: function(data) {
          settings = Ember.Object.create(data);
          self.set('poolSettings', settings);
          console.log('INFO: pool settings loaded..');
        },
        error: function(request, status, e) {
          console.log('ERROR: fail to load pool settings: ' + e);
          self.set('poolSettings', {});
        }
      });
    }

    let price = this.get('priceInfo');
    let needUpdatePrice = new Date().getTime() - this.getWithDefault('priceTimestamp', 0) > (config.APP.priceInterval || 3*60000 /* 3 min */);
    if ((needUpdatePrice || !price) && config.APP.priceApiUrl) {
      let self = this;
      let url = config.APP.priceApiUrl;

      Ember.$.getJSON(url).then(function(data) {
          price = Ember.Object.create(data);
          self.set('priceInfo', price);
          self.set('priceTimestamp', new Date().getTime());
          console.log('INFO: price info loaded..');
      });
    }

  },

  actions: {
    selectLanguage: function(lang) {
      let selected = lang;
      if (typeof selected === 'undefined') {
        return true;
      }
      let locale = selectLocale(selected);
      this.get('intl').setLocale(locale);
      this.set('selectedLanguage', locale);
      Ember.$.cookie('lang', locale);
      let languages = this.get('languages');
      for (var i = 0; i < languages.length; i++) {
        if (languages[i].value == locale) {
          Ember.$('#selectedLanguage').html(languages[i].name + '<b class="caret"></b>');
          break;
        }
      }

      return true;
    },

    selectCurrency: function(currency) {
      let selected = currency;
      if (typeof currency === 'undefined') {
        return true;
      }
      Ember.$.cookie('currency', currency);
      let currencies = Object.keys(config.APP.currencies);
      for (var i = 0; i < currencies.length; i++) {
        if (currencies[i] === currency) {
          var symbol = config.APP.currencies[currency];
          Ember.$('#selectedCurrency').html(symbol + '<b class="caret"></b>');
          var price = this.get('priceInfo');
          if (price && price[currency]) {
            currency = price[currency];
            var parsed = parseFloat(currency).toFixed(3);
            Ember.$('#currentPrice').html(parsed);
          } else {
            Ember.$('#currentPrice').html('--');
          }
          break;
        }
      }

      return true;
    },

    toggleMenu: function() {
      Ember.$('.navbar-collapse.in').attr("aria-expanded", false).removeClass("in");
    }
  },

	model: function() {
    var url = config.APP.ApiUrl + 'api/stats';
    let charts = this.get('poolCharts');
    if (!charts || new Date().getTime() - this.getWithDefault('chartTimestamp', 0) > (config.APP.highcharts.main.chartInterval || 900000 /* 15 min */)) {
      url += '/chart';
      charts = null;
    }
    let self = this;
    return Ember.$.getJSON(url).then(function(data) {
      if (!charts) {
        self.set('poolCharts', data.poolCharts);
        self.set('chartTimestamp', new Date().getTime());
      } else {
        data.poolCharts = self.get('poolCharts');
      }
      return Ember.Object.create(data);
    });
	},

  setupController: function(controller, model) {
    let settings = this.get('poolSettings');
    model.settings = settings;
    model.languages = this.get('languages');
    model.currencies = config.APP.currencies;
    model.selectedCurrency = this.get('selectedCurrency');
    model.priceInfo = this.get('priceInfo');
    this._super(controller, model);
    Ember.run.later(this, this.refresh, 5000);
  }
});
