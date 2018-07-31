/*
 *
 *  URL Scrapper Extension
 *  - Displays a small url-scrapped information on the top panel.
 *  - On click, gives a popup with details about the url-scrapped.
 *
 * Copyright (C) 2011 - 2013
 *     Mariano Fresno <mnofresno@gmail.com>
 *
 * This file is part of url-scrapper-extension@mnofresno
 *
 * url-scrapper-extension@mnofresno is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * url-scrapper-extension@mnofresno is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with url-scrapper-extension@mnofresno.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
/* exported init,
  enable,
  disable
*/

const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const EXTENSIONDIR = Me.dir.get_path();
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;

const Convenience = Me.imports.convenience;
let showMessage = Me.imports.lib.showMessage;


/* global init */
const URLScrapperExtension = function() {
  const params = {
    Name: 'URLScrapperExtension',
    Extends: PanelMenu.Button,
    _init: function() {
      this.parent(0.0, 'URL Scrapper Extension', false);
    },
  };

  let PanelMenuButton = new Lang.Class(params);

  const self = new PanelMenuButton();

  let _httpSession;
  self.output = [];

  self.scrappersConfig = {};
  self.scrappersData = {};

  self._init = function() {
    self.settingsHelper = new Convenience.SettingsHelper(self.onConfigUpdate);
    let box = new St.BoxLayout();
    let icon = new St.Icon({icon_name: 'system-search-symbolic', style_class: 'system-status-icon'});
    self.buttonText = new St.Label({text: ' Loading... ',
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER});
    box.add(icon);
    box.add(self.buttonText);
    box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

    self.actor.add_child(box);

    let config = new PopupMenu.PopupMenuItem('Extension settings...');
    let about = new PopupMenu.PopupMenuItem('About...');
    config.connect('activate', self.onPreferencesActivate);
    about.connect('activate', function() {
      let aboutFileContents = String(GLib.file_get_contents(EXTENSIONDIR + '/ABOUT')[1]);
      showMessage(aboutFileContents);
    });

    self.menu.addMenuItem(config);
    self.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    self.menu.addMenuItem(about);

    self.onConfigUpdate();
    self._refresh();
  };

  self._refresh = function() {
    self._loadData();
    self._removeTimeout();
    self._timeout = Mainloop.timeout_add_seconds(10, self._refresh);
    return true;
  };

  self.isValidScrapper = function(scrapper) {
    return !!scrapper.url &&
      !!scrapper.path &&
      !!scrapper.name &&
      !!scrapper.token &&
      !!scrapper.symbol &&
      scrapper.active === true;
  };

  self._loadData = function() {
    let scrappers = self.scrappersConfig;
    let scrappersKeys = Object.keys(scrappers);
    for (let currentIndex = 0; currentIndex < scrappersKeys.length; currentIndex++) {
      let scrapperKey = scrappersKeys[currentIndex];
      let currentScrapperConfig = scrappers[scrapperKey];
      self._loadItemData(scrapperKey, currentScrapperConfig);
    }
  };

  self.onConfigUpdate = function() {
    let scrappers = self.settingsHelper.getScrappers();
    self.scrappersConfig = {};
    let invalidScrappers = 0;
    self.output = new Array(scrappers.length);
    for (let i = 0; i < scrappers.length; i++) {
      let scrapperConfig = scrappers[i];
      if (!self.isValidScrapper(scrapperConfig)) {
        invalidScrappers++;
        continue;
      }
      let pathProjector = function(input) {
        try {
          let projector = new Function('x', 'return x' + scrapperConfig.path + ';');
          return projector(input);
        } catch (ex) {
          return '';
        }
      };
      scrapperConfig.pathProjector = pathProjector;
      let key = self.toLowerDashSeparated(scrapperConfig.name);
      self.scrappersConfig[key] = scrapperConfig;
      self._refreshUI(key);
    }
    if (invalidScrappers === scrappers.length) {
      self.buttonText.text = 'no valid scrappers configured';
    }
  };

  self._loadItemData = function(scrapperKey, scrapperConfig) {
    _httpSession = new Soup.Session();
    let message = Soup.form_request_new_from_hash(!!scrapperConfig.method ?
      scrapperConfig.method : 'GET', scrapperConfig.url, {});
    message.request_headers.append('Authorization', 'bearer ' + scrapperConfig.token);
    _httpSession.queue_message(message, function(_httpSession, message) {
          if (message.status_code !== 200) {
            let error = 'HTTP status: ' + message.status_code +
              '\nHTTP request error: ' + message.response_body.toString();
            log(error);
            return;
          }

          let json = JSON.parse(message.response_body.data);
          self.scrappersData[scrapperKey] = json;
          self._refreshUI(scrapperKey);
        }
    );
  };

  self.toLowerDashSeparated = function(input) {
    return input.toString().replace(/\s/g, '_');
  };

  self._refreshUI = function(scrapperKey) {
    let scrapperConfig = self.scrappersConfig[scrapperKey];
    if (!scrapperConfig) {
      delete self.output[scrapperKey];
    } else {
      let scrapperData = self.scrappersData[scrapperKey];
      let textOutput = scrapperConfig.pathProjector(scrapperData);
      let previousData = self.output[scrapperKey];
      self.output[scrapperKey] = {
        text: function(dm) { return scrapperConfig.symbol + dm + textOutput; },
        current: parseFloat(isNaN(parseFloat(textOutput)) ? 0 : textOutput),
        previous: !!previousData && parseFloat(isNaN(parseFloat(previousData.current)) ? 0 : previousData.current),
      };
    }
    self.buttonText.set_text(Object.keys(self.output).map(function(key) {
      let data = self.output[key];
      let delta = data.current - data.previous;
      let deltaMsg = delta > 0 ? '↗' : (delta < 0 ? '↘' : '→');
      return data.text(deltaMsg);
    }).join(' | '));
  };

  self._removeTimeout = function() {
    if (self._timeout) {
      Mainloop.source_remove(self._timeout);
      self._timeout = null;
    }
  };

  self.stop = function() {
    if (_httpSession !== undefined) {
      _httpSession.abort();
    }
    _httpSession = undefined;

    if (self._timeout) {
      Mainloop.source_remove(self._timeout);
    }
    self._timeout = undefined;

    self.menu.removeAll();
  };

  self.onPreferencesActivate = function() {
    Util.spawn(['gnome-shell-extension-prefs', 'url-scrapper-extension@mnofresno']);
    return 0;
  };

  self._init();
  return self;
};

let urlScrapperMenu;

function init() {
}

function enable() {
  urlScrapperMenu = new URLScrapperExtension();
  Main.panel.addToStatusArea('url-scrapper', urlScrapperMenu);
}

function disable() {
  urlScrapperMenu.stop();
  urlScrapperMenu.destroy();
}
