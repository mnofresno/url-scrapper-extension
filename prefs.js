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

/*globals imports, global */
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const EXTENSIONDIR = Me.dir.get_path();
const showDialogBox = Me.imports.lib.showDialogBox;
const log = global.log;

const UrlScrapperPrefsWidget = function()
{
  const params = {
    Name: 'UrlScrapperPrefsWidget',
    GTypeName: 'UrlScrapperPrefsWidget',
    Extends: Gtk.Box
  };

  const GDialog = new GObject.Class(params);

  let self = new GDialog();

  self.mScrappers = [];

  self.x = [0,1];
  self.y = [0,1];
  self.right_widget = null;

  self.editingItem = {};
  self.editingItemIndex = 0;

	self._init = function()
	{
    log("init dialog");

    self.initWindow();

		self.add(self.MainWidget);
	};

  self.Window = new Gtk.Builder();

	self.initWindow = function()
	{
		self.mScrappers = [];

		self.Window.add_from_file(EXTENSIONDIR + "/url-scrapper-settings.ui");
		self.MainWidget = self.Window.get_object("main-widget");
		self.treeview = self.Window.get_object("tree-treeview");
		self.liststore = self.Window.get_object("liststore");
		self.Iter = self.liststore.get_iter_first();
		let button = self.Window.get_object("tree-toolbutton-add");

		button.connect("clicked", self.addScrapper);
		self.Window.get_object("tree-toolbutton-remove").connect("clicked", self.removeScrapper);
		self.Window.get_object("treeview-selection").connect("changed", self.selectionChanged);

		self.treeview.set_model(self.liststore);

		let column = new Gtk.TreeViewColumn()
		self.treeview.append_column(column);

		let renderer = new Gtk.CellRendererText();
		column.pack_start(renderer, null);

		column.set_cell_data_func(renderer, function()
		{
		  arguments[1].markup = arguments[2].get_value(arguments[3],0);
		});


    self.initConfigWidget();

    self.addLabel('Scrapping URL Name:');
    self.addTextBox("name");

    self.addLabel('Request URL:');
    self.addTextBox("url");

    self.addLabel('Authorization Header token:');
    self.addTextBox("token");

    self.addLabel('Response data path:');
    self.addTextBox("path");

    self.addLabel('Result data symbol:');
    self.addTextBox("symbol");


    let scrappers = self.getScrappers();
    self.editingItemIndex = 0;
    self.changeSelection();
    self.editingItem = scrappers[self.editingItemIndex];
    self.refreshUI();
	};

	self.refreshUI = function()
	{
		self.MainWidget = self.Window.get_object("main-widget");
		self.treeview = self.Window.get_object("tree-treeview");
		self.liststore = self.Window.get_object("liststore");
		self.Iter = self.liststore.get_iter_first();

		let scrappers = self.getScrappers();
    log("readed scrappers: " + JSON.stringify(scrappers));
		self.Window.get_object("tree-toolbutton-remove").sensitive = Boolean(scrappers.length);

		let scrappersVariation = !!(scrappers.length - self.mScrappers.length);

    if(!scrappersVariation)
    {
      for(let i = 0; i < scrappers.length; i++) {
				if(scrappers[i] === self.mScrappers[i]) {
          scrappersVariation = true;
        }
			}
    }

		if(scrappersVariation)
		{
			if(typeof self.liststore != "undefined")
			{
				self.liststore.clear();
			}

			if(scrappers.length > 0)
			{
				let current = self.liststore.get_iter_first();

				for(let i = 0; i < scrappers.length; i++)
				{
					current = self.liststore.append();
          let scrapper = scrappers[i];
          try{
            self.liststore.set_value(current, 0, scrapper.name);
          }
          catch(ex)
          {
            self.liststore.set_value(current, 0, 'errored-item');
          }
				}
			}

      self.mScrappers = scrappers;
    }

    let config = self.configWidgets;

    for(let i in config)
    {
      // if(typeof config[i][0].active_id != "undefined" && config[i][0].active_id != self[config[i][1]])
			// {
			// 	config[i][0].active_id = String(self[config[i][1]]);
			// }
			// else if(typeof config[i][0].active_id == "undefined" && config[i][0].active != self[config[i][1]])
			// {
			// 	config[i][0].active = self[config[i][1]];
      // }
      if(typeof config[i][0].get_text != "undefined" )
      {
        let propertyName = config[i][1];
        let value = self.editingItem[propertyName];
        if(!!value){
          config[i][0].set_text(String(value));
        }
        else {
          config[i][0].set_text('');
        }
      }
    }
	};

	self.initConfigWidget = function()
	{
		self.configWidgets.splice(0, self.configWidgets.length);
		let a = self.Window.get_object("right-widget-table");
		a.visible = 1;
		a.can_focus = 0;
		self.right_widget = a;
  };

  self.configWidgets = [];

	self.selectionChanged = function(select)
	{
		let selectedRow = select.get_selected_rows(self.liststore)[0][0];

    if(typeof selectedRow != "undefined")
    {
      let rowNumber = parseInt(selectedRow.to_string());
      if(rowNumber !== self.editingItemIndex)
      {
        self.editingItemIndex = rowNumber;
        let scrappers = self.getScrappers();
        let scrapper = scrappers[rowNumber];
        self.editingItem = scrapper;
        log('currentRow: ' + rowNumber);
        self.refreshUI();
      }
    }
    return 0;
	};

	self.changeSelection = function()
	{
		let path = Gtk.TreePath.new_from_string(String(self.editingItemIndex));
		self.treeview.get_selection().select_path(path);
  };

	self.loadConfig = function()
	{
    self.Settings = Convenience.getSettings(Convenience.URL_SCRAPPER_SETTINGS_SCHEMA);
    self.SettingsC = self.Settings.connect("changed",function(){ self.refreshUI();});
  };

	self.getScrappers = function()
	{
    log("getter scrapper");

    if(!self.Settings)
    {
      self.loadConfig();
    }

    let scrappers = self.Settings.get_string(Convenience.SCRAPPERS_KEY);

    log("PREPARSE: " +  scrappers);
    try{
      scrappers = JSON.parse(scrappers);
    }
    catch(ex)
    {
      log("parse ex: " +  ex);
      scrappers = [];

      self.Settings.set_string(Convenience.SCRAPPERS_KEY, JSON.stringify(scrappers));
    }

    log("Scrappers: " + JSON.stringify(scrappers));

    return scrappers;
  };

	self.setScrappers = function(v)
	{
    log("setter scrapper");
    if(!self.Settings)
    {
      self.loadConfig();
      log("config loaded");

    }
    let scrappers = v;
    if(!Array.isArray(scrappers))
    {
      scrappers = [];
    }
    self.Settings.set_string(Convenience.SCRAPPERS_KEY, JSON.stringify(scrappers));

  };

  self.saveEditingItem = function()
  {
    log('pre saving editing item');
    if(!self.editingItem || isNaN(self.editingItemIndex)) {
      return;
    }

    let scrappers = self.getScrappers();

    scrappers[self.editingItemIndex] = self.editingItem;

    self.setScrappers(scrappers);
    log('saved editing item');
  };

	self.addScrapper = function()
	{
    log("add scrapper pressed");

    showDialogBox("Add new URL Scrapper",
      "Please write the name",
      function(input){
        log("added scrapper");
        let scrappers = self.getScrappers();
        log('scrappers pre push');
        scrappers.push({ name: input });
        log('scrappers pre setter');
        self.setScrappers(scrappers);
    });
  };

	self.removeScrapper = function()
	{
    let scrappers = self.getScrappers();
    scrappers.splice(self.editingItemIndex, 1);
    self.setScrappers(scrappers);
		return 0;
  };

	self.addLabel = function(text)
	{
	  let l = new Gtk.Label({label:text,xalign:0});
	  l.visible = 1;
	  l.can_focus = 0;
	  self.right_widget.attach(l, self.x[0],self.x[1], self.y[0],self.y[1],0,0,0,0);
	  self.inc();
  };

	self.addTextBox = function(b)
	{

    let entry = new Gtk.Entry();


    self.configWidgets.push([entry,b]);
    entry.visible = 1;
    entry.can_focus = 1;
    entry.width_request = 100;

    entry.active_id = String(b);
    entry.connect("changed",function(){
      self.editingItem[b] = entry.get_text();
      self.saveEditingItem();
    });

    self.right_widget.attach(entry, self.x[0], self.x[1], self.y[0], self.y[1],0,0,0,0);
    self.inc();

    return 0;
  };

	self.inc = function()
	{
		if(arguments[0])
		{
      self.x[0] = 0;
      self.x[1] = 1;
      self.y[0] = 0;
      self.y[1] = 1;
      return 0;
		}

		if(self.x[0] == 1)
		{
      self.x[0] = 0;
      self.x[1] = 1;
      self.y[0] += 1;
      self.y[1] += 1;
      return 0;
		}
		else
		{
      self.x[0] += 1;
      self.x[1] += 1;
      return 0;
		}
	};

  self._init();

  return self;
};

function init()
{
  log("first init prefs");
}

function buildPrefsWidget()
{
  let widget = new UrlScrapperPrefsWidget();
  widget.show_all();

	return widget;
}
