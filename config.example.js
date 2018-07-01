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

let scrappers = [{
  path:   function(x) { return x['thePropertyToShow'].toFixed(2); },
  url:    "https://the-first-url-you-want-to-scrap.com/api/endpoint",
  token:  "here-you-put-the-corresponding-token",
  symbol: "theSymbolForThisURL" 
},
{
  path:   function(x){ return x['HereGoesTheJsonPathProperty']['AnotherProp']; },
  url:    "https://the-second-url-you-want-to-scrap.com/api/endpoint",
  token:  "here-you-go-with-another-token",
  symbol: " Δ $ "
}];