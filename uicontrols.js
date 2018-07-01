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

  self.addTextBox = function(b) {
    let entry = new Gtk.Entry();

    self.configWidgets.push([entry, b]);
    entry.visible = 1;
    entry.can_focus = 1;
    entry.width_request = 100;

    entry.active_id = String(b);
    entry.connect('changed', function() {
      self.editingItem[b] = entry.get_text();
      self.saveEditingItem();
    });

    rightWidget.attach(entry, self.x[0], self.x[1], self.y[0], self.y[1], 0, 0, 0, 0);
    self.inc();

    return 0;
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
