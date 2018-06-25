/*
 *
 *  URL Scrapper Extension
 *  - Displays a small weather information on the top panel.
 *  - On click, gives a popup with details about the weather.
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

const Tweener = imports.ui.tweener;
const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = Me.imports.config;

let scrappers = Config.scrappers;

let output = new Array(scrappers.length);
let _httpSession;
let receivedData;
const URLScrapperExtension = new Lang.Class({
  Name: 'URLScrapperExtension',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "URL Scrapper Extension", false);
    this.buttonText = new St.Label({
      text: _("Cargarndo..."),
      y_align: Clutter.ActorAlign.CENTER
    });
    
    this.actor.add_actor(this.buttonText);
    this._refresh();
    this.actor.connect('button-press-event', this._showResumen);
  },

  _showResumen: function() {
    
    
    let f = function(data){

      let r = receivedData.resumen;
      showMessage("Diferencia: $ " +  r.diferencia +
                  "\nTotal: $ " + r.total +
                  "\nTotal Mensual: $ " + r.totalMensual +
                  "\nTotal Reintegros Mensuales: $ " + r.reintegroMensualTotal +
                  "\nTotal Mensual Propio: $ " + r.totalMensualPropio);
                  
    };

    f();
  },

  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));
    return true;
  },
  _loadData: function(callbackFunction){
    for(let currentIndex = 0; currentIndex < scrappers.length; currentIndex++)
    {
      let currentScrapper = scrappers[currentIndex];
      this._loadItemData(callbackFunction, currentIndex, currentScrapper);
    }
  },
  _loadItemData: function (callbackFunction, currentIndex, currentScrapper) {
    let params = {
      amount: '1000',
      sourceCurrency: 'USD',
      targetCurrency: 'ARS'
    };
    _httpSession = new Soup.Session();
    let message = Soup.form_request_new_from_hash('GET', currentScrapper.url, params);
    message.request_headers.append("Authorization", "bearer " + currentScrapper.token);
    _httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
          if (message.status_code !== 200)
          {
            showMessage(message);
            return;
          }
        
          let json = JSON.parse(message.response_body.data);
          this._refreshUI({
            rawJson: json,
            symbol: currentScrapper.symbol,
            path: currentScrapper.path,
            currentIndex: currentIndex        
          });
          receivedData = json;
        }
      )
    );
  },

  _refreshUI: function (data) {
    let textOutput = data.path(data.rawJson);
    
    textOutput = data.symbol + textOutput;
    
    output[data.currentIndex] = textOutput;

    this.buttonText.set_text(output.join(' '));
  },

  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (_httpSession !== undefined)
      _httpSession.abort();
    _httpSession = undefined;

    if (this._timeout)
      Mainloop.source_remove(this._timeout);
    this._timeout = undefined;

    this.menu.removeAll();
  }
});

let urlScrapperMenu;

function init() {
}

function enable() {
	urlScrapperMenu = new URLScrapperExtension;
	Main.panel.addToStatusArea('url-scrapper', urlScrapperMenu);
}

function disable() {
	urlScrapperMenu.stop();
	urlScrapperMenu.destroy();
}

function showMessage(message) {
    let text;
    if (!text) {
        text =  new St.Label({ style_class: 'helloworld-label', text: message });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

    Tweener.addTween(text,
                     { opacity: 0,
                       time: 20,
                       transition: 'easeOutQuad',
                       onComplete: hideMsg });

    text.connect('button-press-event', hideMsg);

    var hideMsg = function()
    {
        Main.uiGroup.remove_actor(text);
        text = null;
    };
}

