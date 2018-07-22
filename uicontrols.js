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

 /* exported UiControls */

const Gtk = imports.gi.Gtk;

function ConfigItem(control, propertyName, propertyType) {
  let self = this;

  self.control = control;
  self.propertyName = propertyName;
  self.propertyType = propertyType;

  return self;
}

function UiControls(target) {
  let self = target;

  let rightWidget = self.rightWidget;

  self.x = [0, 1];
  self.y = [0, 1];

  self.addLabel = function(text) {
    let label = new Gtk.Label({label: text, xalign: 0});
    label.visible = 1;
    label.can_focus = 0;
    rightWidget.attach(label, self.x[0], self.x[1], self.y[0], self.y[1], 0, 0, 0, 0);
    self.inc();
  };

  self.addTextBox = function(propertyName) {
    let entry = new Gtk.Entry();

    self.configWidgets.push(new ConfigItem(entry, propertyName, 'string'));
    entry.visible = 1;
    entry.can_focus = 1;
    entry.width_request = 100;
    entry.connect('changed', function() {
      self.editingItem[propertyName] = entry.get_text();
      self.saveEditingItem();
    });

    rightWidget.attach(entry, self.x[0], self.x[1], self.y[0], self.y[1], 0, 0, 0, 0);
    self.inc();
  };

  self.addSwitch = function(propertyName) {
    let sw = new Gtk.Switch();
    self.configWidgets.push(new ConfigItem(sw, propertyName, 'boolean'));
    sw.visible = 1;
    sw.can_focus = 0;
    sw.connect('notify::active', function(...args) {
      self.editingItem[propertyName] = args[0].active;
      self.saveEditingItem();
    });

    rightWidget.attach(sw, self.x[0], self.x[1], self.y[0], self.y[1], 0, 0, 0, 0);
    self.inc();
  };

  self.addComboBox = function(options, propertyName) {
    let cf = new Gtk.ComboBoxText();
    cf.visible = 1;
    cf.can_focus = 0;
    cf.width_request = 100;
    cf.append('', 'Select...');
    for (let i in options) {
      let currentOption = options[i];
      cf.append(currentOption, currentOption);
    }
    cf.set_text = function(text) {
      if (!!text) {
        cf.active_id = String(text);
      } else {
        cf.active_id = '';
      }
    };
    let initialValue = self.editingItem[propertyName];
    cf.set_text(initialValue);
    cf.connect('changed', function(...args) {
      try {
        self.editingItem[propertyName] = String(args[0].get_active_id());
        self.saveEditingItem();
      } catch (e) {
        // FIXME: try to do something with this error
      }
    });
    self.configWidgets.push(new ConfigItem(cf, propertyName, 'option_string'));
    self.rightWidget.attach(cf, self.x[0], self.x[1], self.y[0], self.y[1], 0, 0, 0, 0);
    self.inc();
  };

  self.inc = function(...args) {
    if (args[0]) {
      self.x[0] = 0;
      self.x[1] = 1;
      self.y[0] = 0;
      self.y[1] = 1;
      return 0;
    }

    if (self.x[0] == 1) {
      self.x[0] = 0;
      self.x[1] = 1;
      self.y[0] += 1;
      self.y[1] += 1;
      return 0;
    } else {
      self.x[0] += 1;
      self.x[1] += 1;
      return 0;
    }
  };

  return self;
}
