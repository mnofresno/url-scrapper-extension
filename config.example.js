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