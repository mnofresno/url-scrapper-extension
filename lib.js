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

 /* exported showDialogBox,
  showMessage
 */
function showDialogBox(message, title, callback) {
  const Gtk = imports.gi.Gtk;

  let dialog = new Gtk.Dialog({title: !!title ? title: ''});
  let entry = new Gtk.Entry();
  entry.margin_top = 12;
  entry.margin_bottom = 12;
  let label = new Gtk.Label({label: !!message ? message: ''});

  dialog.set_border_width(12);
  dialog.set_modal(1);
  dialog.set_resizable(0);

  dialog.add_button(Gtk.STOCK_CANCEL, 0);
  let okButton = dialog.add_button(Gtk.STOCK_OK, 1);

  okButton.set_can_default(true);
  okButton.sensitive = 0;

  dialog.set_default(okButton);

  entry.connect('changed', function(textInput) {
    okButton.sensitive = 0;
    if (!!textInput) {
      okButton.sensitive = 1;
    }
    return 0;
  });

  let dialogArea = dialog.get_content_area();

  dialogArea.pack_start(label, 0, 0, 0);
  dialogArea.pack_start(entry, 0, 0, 0);
  dialog.connect('response', function(w, responseId) {
    let text = entry.get_text();
    if (responseId && text) {
      if (!!callback) {
        callback(text);
      }
    }
    dialog.destroy();
    return 0;
  });

  dialog.show_all();
}

function showMessage(message) {
    const Tweener = imports.ui.tweener;
    const St = imports.gi.St;
    const Main = imports.ui.main;

    let text;
    if (!text) {
        text = new St.Label({style_class: 'helloworld-label', text: message});
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

    let hideMsg = function() {
        Main.uiGroup.remove_actor(text);
        text = null;
    };
    Tweener.addTween(text,
                     {opacity: 0,
                       time: 20,
                       transition: 'easeOutQuad',
                       onComplete: hideMsg});

    text.connect('button-press-event', hideMsg);
}
