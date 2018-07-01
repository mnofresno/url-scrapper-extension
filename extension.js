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

let _httpSession;
let receivedData;

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

  self.output = [];

  self._init = function() {
    let box = new St.BoxLayout();
    let icon = new St.Icon({icon_name: 'system-search-symbolic', style_class: 'system-status-icon'});
    self.buttonText = new St.Label({text: ' Loading... ',
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER});
    box.add(icon);
    box.add(self.buttonText);
    box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

    self.actor.add_child(box);

    let resumen = new PopupMenu.PopupMenuItem('Resumen');
    let config = new PopupMenu.PopupMenuItem('Configurar extensión...');
    let about = new PopupMenu.PopupMenuItem('Acerca de...');
    config.connect('activate', self.onPreferencesActivate);
    resumen.connect('activate', function() {
      self._showResumen();
    });
    about.connect('activate', function() {
      let aboutFileContents = String(GLib.file_get_contents(EXTENSIONDIR + '/ABOUT')[1]);
      showMessage(aboutFileContents);
    });

    self.menu.addMenuItem(resumen);
    self.menu.addMenuItem(config);
    self.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    self.menu.addMenuItem(about);

    self.output = new Array(self.getScrappers().length);

    self._refresh();
  };

  self.getScrappers = function() {
    if (!self.Settings) {
      self.loadConfig();
    }

    let scrappers = self.Settings.get_string(Convenience.SCRAPPERS_KEY);

    try {
      scrappers = JSON.parse(scrappers);
    } catch (ex) {
      scrappers = [];

      self.Settings.set_string(Convenience.SCRAPPERS_KEY, JSON.stringify(scrappers));
    }

    return scrappers;
  };

  self.SettingsC = null;

  self.loadConfig = function() {
    self.Settings = Convenience.getSettings(Convenience.URL_SCRAPPER_SETTINGS_SCHEMA);
    self.SettingsC = self.Settings.connect('changed', function() {
      self._loadData();
    });
  };

  self._showResumen = function() {
    let f = function() {
      let r = receivedData.resumen;
      showMessage('Diferencia: $ ' + r.diferencia +
                  '\nTotal: $ ' + r.total +
                  '\nTotal Mensual: $ ' + r.totalMensual +
                  '\nTotal Reintegros Mensuales: $ ' + r.reintegroMensualTotal +
                  '\nTotal Mensual Propio: $ ' + r.totalMensualPropio);
    };

    if (!!receivedData) {
      f();
    }
  };

  self._refresh = function() {
    self._loadData(self._refreshUI);
    self._removeTimeout();
    self._timeout = Mainloop.timeout_add_seconds(10, self._refresh);
    return true;
  };

  self._loadData = function(callbackFunction) {
    let scrappers = self.getScrappers();
    for (let currentIndex = 0; currentIndex < scrappers.length; currentIndex++) {
      let currentScrapper = scrappers[currentIndex];
      self._loadItemData(callbackFunction, currentIndex, currentScrapper);
    }
  };

  self._loadItemData = function(callbackFunction, currentIndex, currentScrapper) {
    _httpSession = new Soup.Session();
    let message = Soup.form_request_new_from_hash('GET', currentScrapper.url, {});
    message.request_headers.append('Authorization', 'bearer ' + currentScrapper.token);
    _httpSession.queue_message(message, function(_httpSession, message) {
          if (message.status_code !== 200) {
            showMessage(message);
            return;
          }

          let json = JSON.parse(message.response_body.data);

          /* jshint evil:true */
          let pathProjector = new Function('x', 'return x' + currentScrapper.path + ';');
          /* jshint evil:false */

          self._refreshUI({
            rawJson: json,
            symbol: currentScrapper.symbol,
            path: pathProjector,
            currentIndex: currentIndex,
          });
          if (currentIndex === 1) {
            receivedData = json;
          }
        }
    );
  };

  self._refreshUI = function(data) {
    let textOutput = data.path(data.rawJson);

    textOutput = data.symbol + textOutput;

    self.output[data.currentIndex] = textOutput;

    self.buttonText.set_text(self.output.join(' '));
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

