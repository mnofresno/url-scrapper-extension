/*
 *
 *  URL Scrapper Extension
 *  - Displays a small url-scrapped information on the top panel.
 *  - On click, gives a popup with details about the url-scrapped.
 *
 * Copyright (C) 2011 - 2013
 *     Mariano Fresno <mnofresno@gmail.com>
 *
 * self file is part of url-scrapper-extension@mnofresno
 *
 * url-scrapper-extension@mnofresno is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * url-scrapper-extension@mnofresno is distributed in the hope self it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with url-scrapper-extension@mnofresno.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/* imported imports,
  global, */
/* exported init,
  buildPrefsWidget, */
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const EXTENSIONDIR = Me.dir.get_path();
const showDialogBox = Me.imports.lib.showDialogBox;
const log = global.log;
const UiControls = Me.imports.uicontrols.UiControls;

const UrlScrapperPrefsWidget = function() {
  const params = {
    Name: 'UrlScrapperPrefsWidget',
    GTypeName: 'UrlScrapperPrefsWidget',
    Extends: Gtk.Box,
  };

  const GDialog = new GObject.Class(params);

  let self = new GDialog();
  self.mScrappers = [];

  self.rightWidget = null;

  self.editingItem = {};
  self.editingItemIndex = 0;

  self._init = function() {
    self.settingsHelper = new Convenience.SettingsHelper();
    log('init dialog');

    self.initWindow();

    self.add(self.MainWidget);
  };

  self.Window = new Gtk.Builder();

  self.initWindow = function() {
    self.Window.add_from_file(EXTENSIONDIR + '/url-scrapper-settings.ui');
    self.MainWidget = self.Window.get_object('main-widget');
    self.treeview = self.Window.get_object('tree-treeview');
    self.liststore = self.Window.get_object('liststore');
    self.Iter = self.liststore.get_iter_first();
    self.treeViewSelection = self.Window.get_object('treeview-selection');
    let addScrapperButton = self.Window.get_object('tree-toolbutton-add');
    self.goDownButton = self.Window.get_object('tree-toolbutton-go-down');
    self.goUpButton = self.Window.get_object('tree-toolbutton-go-up');
    self.removeScrapperButton = self.Window.get_object('tree-toolbutton-remove');

    addScrapperButton.connect('clicked', self.addScrapper);
    self.goDownButton.connect('clicked', self.moveDownScrapper);
    self.goUpButton.connect('clicked', self.moveUpScrapper);
    self.removeScrapperButton.connect('clicked', self.removeScrapper);
    self.treeViewSelection.connect('changed', self.selectionChanged);

    self.treeview.set_model(self.liststore);

    let column = new Gtk.TreeViewColumn();

    self.treeview.append_column(column);

    let renderer = new Gtk.CellRendererText();
    column.pack_start(renderer, null);

    column.set_cell_data_func(renderer, function(...args) {
      args[1].markup = args[2].get_value(args[3], 0);
    });

    self.initConfigWidget();

    self.addLabel('Scrapping URL Name:');
    self.addTextBox('name');

    self.addLabel('Request URL:');
    self.addTextBox('url');

    self.addLabel('Use HTTP Method');
    self.addComboBox(['GET', 'POST', 'PUT', 'DELETE'], 'method');

    self.addLabel('Authorization Header token:');
    self.addTextBox('token');

    self.addLabel('Response data path:');
    self.addTextBox('path');

    self.addLabel('Result data symbol:');
    self.addTextBox('symbol');

    self.addLabel('Enabled:');
    self.addSwitch('active');

    self.addLabel('Use delta indicator:');
    self.addSwitch('useDelta');

    let scrappers = self.settingsHelper.getScrappers();
    self.editingItemIndex = 0;
    self.changeSelection();
    self.editingItem = !!scrappers[self.editingItemIndex] ? scrappers[self.editingItemIndex] : {};
    self.refreshUI();
  };

  self.refreshUI = function() {
    let scrappers = self.settingsHelper.getScrappers();

    self.goDownButton.sensitive = self.editingItemIndex < scrappers.length - 1;
    self.goUpButton.sensitive = self.editingItemIndex > 0;
    self.removeScrapperButton.sensitive = Boolean(scrappers.length);

    let scrappersVariation = JSON.stringify(scrappers) !== JSON.stringify(self.mScrappers);

    if (!scrappersVariation) {
      for (let i = 0; i < scrappers.length; i++) {
        if (scrappers[i] === self.mScrappers[i]) {
          scrappersVariation = true;
        }
      }
    }

    if (scrappersVariation) {
      if (typeof self.liststore != 'undefined') {
        self.liststore.clear();
      }

      if (scrappers.length > 0) {
        let current = self.liststore.get_iter_first();

        for (let i = 0; i < scrappers.length; i++) {
          current = self.liststore.append();
          let scrapper = scrappers[i];
          try {
            self.liststore.set_value(current, 0, scrapper.name);
          } catch (ex) {
            self.liststore.set_value(current, 0, 'errored-item');
          }
        }
      }

      self.mScrappers = scrappers;
    }

    let config = self.configWidgets;

    for (let i in config) {
      let propertyName = config[i].propertyName;
      let value = self.editingItem[propertyName];
      switch (config[i].propertyType) {
        case 'boolean':
          config[i].control.active = value;
        break;
        case 'string':
          if (!!value) {
            config[i].control.set_text(String(value));
          } else {
            config[i].control.set_text('');
          }
        break;
        case 'option_string':
          config[i].control.set_text(value);
        break;
      }
    }
  };

  self.initConfigWidget = function() {
    let rightWidgetTable = self.Window.get_object('right-widget-table');
    rightWidgetTable.visible = 1;
    rightWidgetTable.can_focus = 0;
    self.rightWidget = rightWidgetTable;
    new UiControls(self);
  };

  self.configWidgets = [];

  self.selectionChanged = function(select) {
    let selectedRow = select.get_selected_rows(self.liststore)[0][0];

    if (typeof selectedRow != 'undefined') {
      let rowNumber = parseInt(selectedRow.to_string());
      if (rowNumber !== self.editingItemIndex) {
        self.editingItemIndex = rowNumber;
        let scrappers = self.settingsHelper.getScrappers();
        let scrapper = scrappers[rowNumber];
        self.editingItem = !!scrapper ? scrapper : {};

        self.refreshUI();
      }
    }
    return 0;
  };

  self.changeSelection = function() {
    let path = Gtk.TreePath.new_from_string(String(self.editingItemIndex));
    self.treeview.get_selection().select_path(path);
  };

  self.saveEditingItem = function() {
    if (!self.editingItem || isNaN(self.editingItemIndex)) {
      return;
    }

    let scrappers = self.settingsHelper.getScrappers();

    scrappers[self.editingItemIndex] = self.editingItem;

    self.settingsHelper.setScrappers(scrappers);
  };

  self.addScrapper = function() {
    showDialogBox('Add new URL Scrapper',
      'Please write the name',
      function(input) {
        let scrappers = self.settingsHelper.getScrappers();
        self.editingItemIndex = scrappers.length;
        self.editingItem = {name: input};
        scrappers.push(self.editingItem);
        self.settingsHelper.setScrappers(scrappers);
        self.changeSelection();
    });
  };

  self.removeScrapper = function() {
    let scrappers = self.settingsHelper.getScrappers();
    scrappers.splice(self.editingItemIndex, 1);
    self.settingsHelper.setScrappers(scrappers);
    self.changeSelection();
    return 0;
  };

  function arrayMove(arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
        let k = newIndex - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr;
  }

  self.moveUpScrapper = function() {
    let scrappers = self.settingsHelper.getScrappers();
    let targetIndex = self.editingItemIndex - 1;
    self.settingsHelper.setScrappers(arrayMove(scrappers, self.editingItemIndex, targetIndex));
    self.editingItemIndex = targetIndex;
    self.changeSelection();
    self.refreshUI();
    return 0;
  };

  self.moveDownScrapper = function() {
    let scrappers = self.settingsHelper.getScrappers();
    let targetIndex = self.editingItemIndex + 1;
    self.settingsHelper.setScrappers(arrayMove(scrappers, self.editingItemIndex, targetIndex));
    self.editingItemIndex = targetIndex;
    self.changeSelection();
    self.refreshUI();
    return 0;
  };

  self._init();

  return self;
};

function init() {

}

function buildPrefsWidget() {
  let widget = new UrlScrapperPrefsWidget();
  widget.show_all();

  return widget;
}
