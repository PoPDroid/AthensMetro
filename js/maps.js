var map;
var stationarrs = [];
var linkdurations = [];
var startmarker;
var stopmarker;
var startgpsposition;
var mylines = [];
var markers = [];
var polys = [];
var fixedpolys = [];
var infowindow;
var startstation;
var touchoption = "none";
var endstation;
var maxstops = 2;
var allstations = [];
var mingroupedroute;
var mylocation = false;
var searchingdest = false;
var searchingstart = false;
var inputstart;
var inputdest;
var mapcentrelat ;
var mapcentrelng ;
var shortestpolypath;

//route constructor
function lineroute(name, route, colour) {
	//durations.length = stations.length because durations = duration of corresponding station from last station
	this.name = name;
	this.route = route;
	this.colour = colour;
}

function station(stationid, name, line, lat, lon, change) {
	this.stationid = stationid;
	this.name = name;
	this.line = line;
	this.lat = lat;
	this.lon = lon;
	this.change = change;
}

//route constructor
function route(name, stations) {
	//durations.length = stations.length because durations = duration of corresponding station from last station
	this.name = name;
	this.stations = stations;
	this.duration = getStationsArrayDistance(stations);
}

//route constructor
function groupedroute(routes, firststation, laststation) {
	//durations.length = stations.length because durations = duration of corresponding station from last station
	this.routes = routes;
	var dur = 0;
	var st = -1;
	$.each(routes, function() {
		dur += this.duration;
		st++;
	});
	this.stops = st;
	this.duration = dur;
	this.firststation = firststation;
	this.laststation = laststation;
}

function link(fromstation, tostation, duration) {
	this.fromstation = fromstation;
	this.tostation = tostation;
	this.duration = duration;
	this.distance = getDistanceFromLatLonInKm(tostation.lat, tostation.lon, fromstation.lat, fromstation.lon);
}

function loadMain() {

	$.mobile.changePage("#mainPage");
	google.maps.event.trigger(map, 'resize');
	//zoom(mingroupedroute);
}

function initialize() {

	var mapOptions = {
		zoom : 11,
		center : new google.maps.LatLng(mapcentrelat, mapcentrelng)
	};

	google.maps.visualRefresh = true;
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	google.maps.event.trigger(map, 'resize');
	infowindow = new google.maps.InfoWindow({
		content : "contentString"
	});
	google.maps.event.trigger(map, 'resize');

	//getLocation();

	var imagestart = 'images/start.png';
	var imagestop = 'images/stop.png';

	startstation = allstations[0];

	endstation = allstations[allstations.length - 1];
	startmarker = new google.maps.Marker({
		map : map,
		draggable : true,
		position : new google.maps.LatLng(startstation.lat, startstation.lon),
		icon : imagestart
	});
	stopmarker = new google.maps.Marker({
		map : map,
		draggable : true,
		position : new google.maps.LatLng(endstation.lat, endstation.lon),
		icon : imagestop
	});

	google.maps.event.addListener(startmarker, 'dragend', function(event) {
		startstation = closeststation(event.latLng);
		if (endstation.stationid != "none")
			drawShortestRoute(startstation, endstation);

	});

	google.maps.event.addListener(stopmarker, 'dragend', function(event) {
		endstation = closeststation(event.latLng);
		if (startstation.stationid != "none") {
			drawShortestRoute(startstation, endstation);
		}
	});

	google.maps.event.addListener(map, 'click', function(event) {
		if (touchoption == "start") {
			startmarker.setPosition(event.latLng);
			startstation = closeststation(event.latLng);
			if (endstation.stationid != "none")
				drawShortestRoute(startstation, endstation);
		} else if (touchoption == "destination") {
			stopmarker.setPosition(event.latLng);
			endstation = closeststation(event.latLng);
			if (startstation.stationid != "none")
				drawShortestRoute(startstation, endstation);
		}

	});

	drawfixedroutes(mylines);
	zoom(allstations);
	var listener = google.maps.event.addListener(map, "idle", function() { 
	  map.setZoom(map.getZoom()+1); 
	  google.maps.event.removeListener(listener); 
	});
	searchBox();
	$("#select-choice-start").val("search-start");
	google.maps.event.trigger(map, 'resize');

	$("#mainPage").on('pageshow', function() {
		google.maps.event.trigger(map, 'resize');
		drawShortestRoute(startstation, endstation);
	});

	$('input[name=start-radio]').on('change', function() {

		if (this.value == "choice-1") {
			$("#startstationsdiv").show();
			$("#startsearchdiv").hide();
			if (searchingdest) {
				map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
				searchingdest = false;
			}
			if (searchingstart) {
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
		} else if (this.value == "choice-2") {
			$("#startstationsdiv").hide();
			$("#startsearchdiv").show();

			$("#startPage").popup("close");
			if (searchingdest) {
				searchingdest = false;
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
			}
			if (!searchingstart) {
				map.controls[google.maps.ControlPosition.TOP].push(inputstart);
				searchingstart = true;
			}
		} else if (this.value == "choice-3") {
			$("#startstationsdiv").hide();
			$("#startsearchdiv").hide();
			$("#startPage").popup("close");
			if (searchingdest) {
				searchingdest = false;
				map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
			}
			if (searchingstart) {
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
			getLocation();

		}
	});

	$('input[name=destination-radio]').on('change', function() {

		if (this.value == "choice-1") {
			$("#destinationstationsdiv").show();
			$("#destinationsearchdiv").hide();
			if (searchingdest) {
				map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
				searchingdest = false;
			}
			if (searchingstart) {
				$("#destinationstationsdiv").hide();
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
		} else if (this.value == "choice-2") {
			$("#destinationstationsdiv").hide();
			$("#destinationsearchdiv").show();
			$("#destPage").popup("close");
			if (searchingstart) {
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
			if (!searchingdest) {
				map.controls[google.maps.ControlPosition.TOP].push(inputdest);
				searchingdest = true;
			}
		}
	});

	$("#detailsbutton").click(function() {
		$.mobile.activePage.find('#popupPanel').panel("open");
	});
	$("#setstartbutton").click(function() {
		goToMap();
		var selected = $("input[name=start-radio]:checked");
		if (selected.length > 0) {
			selectedVal = selected.val();
		}
		if (selectedVal == "choice-2") {
			map.controls[google.maps.ControlPosition.TOP].push(inputstart);
			$("#startsearchdiv").show();
		}
	});
	$("#setdestbutton").click(function() {
		goToMap();
		var selected = $("input[name=destination-radio]:checked");
		if (selected.length > 0) {
			selectedVal = selected.val();
		}
		if (selectedVal == "choice-2") {
			map.controls[google.maps.ControlPosition.TOP].push(inputdest);
			$("#destinationsearchdiv").show();
		}
	});
	
}

function searchBox() {
	// Create the search box and link it to the UI element.
	inputstart = (document.getElementById('pac-input-start'));
	inputdest = (document.getElementById('pac-input-dest'));
	var startbutton = (document.getElementById('startbutton'));
	var destbutton = (document.getElementById('destbutton'));
	var detailsbutton = (document.getElementById('detailsbutton'));

	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(startbutton);
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(destbutton);
	map.controls[google.maps.ControlPosition.LEFT_TOP].push(detailsbutton);

	var searchBoxStart = new google.maps.places.SearchBox((inputstart));
	var searchBoxDest = new google.maps.places.SearchBox((inputdest));
	google.maps.event.addListener(searchBoxStart, 'places_changed', function() {
		map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
		searchingstart = false;
		$("#startsearchdiv").hide();
		var places = searchBoxStart.getPlaces();
		startmarker.setPosition(places[0].geometry.location);
		startstation = closeststation(places[0].geometry.location);
		if (endstation.stationid != "none")
			drawShortestRoute(startstation, endstation);

	});

	google.maps.event.addListener(searchBoxDest, 'places_changed', function() {
		map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
		$("#destsearchdiv").hide();
		var places = searchBoxDest.getPlaces();
		stopmarker.setPosition(places[0].geometry.location);
		endstation = closeststation(places[0].geometry.location);
		if (startstation.stationid != "none")
			drawShortestRoute(startstation, endstation);
	});

	google.maps.event.addListener(map, 'bounds_changed', function() {
		var bounds = map.getBounds();
		searchBoxStart.setBounds(bounds);
	});

	google.maps.event.addListener(map, 'bounds_changed', function() {
		var bounds = map.getBounds();
		searchBoxDest.setBounds(bounds);
	});
}

function goToMap() {
	if (mylocation) {
		getLocation();
	}
	$(".ui-popup").popup("close");
	//drawShortestRoute(startstation, endstation);

}

function setStartStation(stationid) {
	startstation = getStationByID(stationid);
	startmarker.setPosition(new google.maps.LatLng(startstation.lat, startstation.lon));
	if (endstation.stationid != "none")
		drawShortestRoute(startstation, endstation);
	$('input[data-type="search"]').val("");
	$('input[data-type="search"]').trigger("keyup");

	$(".ui-popup").popup("close");
	//$("#startstationlabel").text(startstation.name);

}

function setEndStation(stationid) {
	endstation = getStationByID(stationid);
	stopmarker.setPosition(new google.maps.LatLng(endstation.lat, endstation.lon));

	if (startstation.stationid != "none")
		drawShortestRoute(startstation, endstation);
	$('input[data-type="search"]').val("");
	$('input[data-type="search"]').trigger("keyup");
	$(".ui-popup").popup("close");
	//$("#deststationlabel").text(endstation.name);
}

function getStationByID(stationid) {
	var outstation;
	$.each(allstations, function() {
		if (stationid == this.stationid)
			outstation = this;
	});
	return outstation;
}

function populateListViews() {

	var output = '';
	$.each(allstations, function() {
		$('#stations-start').append("<li onclick='setStartStation(\"" + this.stationid + "\")'  class='ui-screen-hidden' ><a>" + this.stationid + "</a></li>");
		$('#stations-dest').append("<li onclick='setEndStation(\"" + this.stationid + "\")' class='ui-screen-hidden' ><a>" + this.stationid + "</a></li>");
	});
	$('#stations-start').listview('refresh');
	$('#stations-dest').listview('refresh');
}

function clearOverlays() {//clear overlays function
	if (markers) {
		for (i in markers) {
			markers[i].setMap(null);
		}
		for (i in polys) {
			polys[i].setMap(null);
		}
	}
}

function zoom(fitstations) {
	var bounds = new google.maps.LatLngBounds();
	$.each(fitstations, function() {
		bounds.extend(new google.maps.LatLng(this.lat, this.lon));
	});
	bounds.extend(startmarker.getPosition());
	bounds.extend(stopmarker.getPosition());
	map.fitBounds(bounds);
	

}

function drawShortestRoute(ss, es) {
	$("#detailsbutton").show();
	clearOverlays(); mingroupedroute;
	$('#route-list').empty();
	mingroupedroute = getMinGroupedRoute(ss,es);
	var zoomstations = [];

	var lineSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 8,
    strokeColor: "#000000"
  	};
  	
	var polyOptions = {
		strokeColor : "#FFFFFF",
		strokeOpacity : 1,
		strokeWeight : 9,    icons: [{
      icon: lineSymbol,
      offset: '100%'
    }],
	};
	
	var polyline = new google.maps.Polyline(polyOptions);
	polyline.setMap(map);
	polys.push(polyline);
	shortestpolypath = polyline.getPath();
	
	$.each(mingroupedroute.routes, function() {
		drawroute(this);
		$.each(this.stations, function() {
			zoomstations.push(this);
		});
	});
	
	var count = 0;
    window.setInterval(function() {
	      count = (count + 1) % 300;
	
	      var icons = polyline.get('icons');
	      icons[0].offset = (count / 2.6) + '%';
	      polyline.set('icons', icons);
	  }, 20);
	  
	$('#route-list').append("<li data-theme='c'></li>").listview('refresh');
	$('#route-list').append("<li data-theme='b' style='text-align: center;'>Number of interchanges: " + (mingroupedroute.routes.length - 1) + "</li>").listview('refresh');

	zoom(zoomstations);
	
	$.each(fixedpolys,function(){
		this.setOptions({strokeOpacity: 0.3});
	});
}

function drawWalkingLine(strt,stp){
	  // Define a symbol using SVG path notation, with an opacity of 1.
  var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 4
  };

  var lineCoordinates = [
    strt,
    stp
  ];

  var line = new google.maps.Polyline({
    path: lineCoordinates,
    strokeOpacity: 0,
    icons: [{
      icon: lineSymbol,
      offset: '0',
      repeat: '20px'
    }],
    map: map
  });
	polys.push(line);
}

function getMinGroupedRoute(ss,es){
	var reached =false;
	var resgroupedroute;
	var resgroupedroutes = [];
	var prevgroupedroutes = [];
	var currstart;
	var currstop;
	$.each(getStationsByName(ss.name), function() {
		var start = this;
		$.each(getStationsByName(es.name), function() {
			var end = this;
			if (hasDirectRoute(start, end)) {//there is a direct route
				reached = true;
				var rt = getDirectRoute(start, end);
				resgroupedroute = new groupedroute(new Array(rt), start, end);
			} else {
				$.each(getChangeStations(start), function() {
					var change = this;
					if(hasDirectRoute(start, this)){
						var rt = getDirectRoute(start, this);
						var tmpgroupedroute = new groupedroute(new Array(rt), start, this);
						prevgroupedroutes.push(tmpgroupedroute);
					}
				});
			}
		});

	});
	while(!reached){
		var oldprevgroupedroutes = [];
		var newprevgroupedroutes = [];
		$.each(prevgroupedroutes,function(){
			var currprevgroupedroute = this;
			oldprevgroupedroutes.push(currprevgroupedroute);
				$.each(getStationsByName(currprevgroupedroute.laststation.name),function(){
					var start = this;
					
						$.each(getStationsByName(es.name),function(){							
							if(hasDirectRoute(start, this)){
									var rt = [];
									rt =  currprevgroupedroute.routes.slice(0);
									rt.push(getDirectRoute(start, this));
									var tmpgroupedroute = new groupedroute(rt, currprevgroupedroute.firststation, this);
									reached = true;
									resgroupedroutes.push(tmpgroupedroute);
								};
						});
						if(!reached)
						{
							$.each(getChangeStations(start),function(){
									if(hasDirectRoute(start, this)){
										var rt = [];
										rt =  currprevgroupedroute.routes.slice(0);
										rt.push(getDirectRoute(start, this));
										var tmpgroupedroute = new groupedroute(rt, currprevgroupedroute.firststation, this);
										newprevgroupedroutes.push(tmpgroupedroute);
									}
							});
						}
				});
		});
		
		$.each(oldprevgroupedroutes,function(){
			prevgroupedroutes.pop(this);
		});		
		$.each(newprevgroupedroutes,function(){
			prevgroupedroutes.push(this);
		});
		
	}
	
	var minduration = -1;
		$.each(resgroupedroutes,function(){
			if(this.duration<minduration || minduration==-1){
				resgroupedroute = this;
				minduration=this.duration;
			}
	
		});
	return resgroupedroute;
	}

	//returns change stations on same rout as from station
function getChangeStations(fromstation) {
	var changestations = [];
	var currroute;
			$.each(getRouteByName(fromstation.line).stations, function() {
				if (this.change) {
					changestations.push(this);
					//alert(this.name);
				}
			});
	return changestations;
}

function getStationsByName(name){
	var res = [];
	$.each(allstations,function(){
		if(this.name==name)
			res.push(this);
	});
	return res;
}

function hasDirectRoute(fromstation, tostation) {
	return(fromstation.line==tostation.line);
}

function getStationsBetweenRoute(fromstation, tostation, route) {
	var resstations = [];
	var hit = false;
	for (var i = $.inArray(fromstation, route.stations); i <= route.stations.length; i++) {
		resstations.push(route.stations[i]);
		if (route.stations[i] == tostation) {
			hit = true;
			break;
		}
	}
	if (!hit) {
		resstations = [];
		for (var i = $.inArray(fromstation, route.stations); i >= 0; i--) {
			resstations.push(route.stations[i]);
			if (route.stations[i] == tostation) {
				hit = true;
				break;
			}
		}
	}
	return resstations;
}


//to do getStationsByName, getDirectRoute
function getDirectRoute(fromstation, tostation) {
	
	var directroute;
	if(hasDirectRoute(fromstation, tostation) ){
		directroute = new route("Direct Route", getStationsBetweenRoute(fromstation, tostation, getRouteByName(fromstation.line)));
	}
	
	return directroute;
}


function drawroute(route) {


	var polyOptions = {
		strokeColor : getStationColour(route.stations[0]),
		strokeOpacity : 1,
		strokeWeight : 4
	};

	var poly = new google.maps.Polyline(polyOptions);
	poly.setMap(map);
	polys.push(poly);
	var path = poly.getPath();

	var curr = 0;
	$.each(route.stations, function() {
		path.push(new google.maps.LatLng(this.lat, this.lon));
		shortestpolypath.push(new google.maps.LatLng(this.lat, this.lon));
		if (this.name == startstation.name || curr == 0 || this.name == endstation.name) {
			var stats = route.stations.length - 2;
			if (stats == -1)
				stats = 0;
			var iconimage = 'images/metro.png';
			var startdist = getDistanceFromLatLonInKm(startmarker.position.lat(), startmarker.position.lng(), startstation.lat, startstation.lon);
			var destdist = getDistanceFromLatLonInKm(stopmarker.position.lat(), stopmarker.position.lng(), endstation.lat, endstation.lon);
			var startdist = Math.round(startdist * 1000);
			var destdist = Math.round(destdist * 1000);
			var startdiststr = "";
			var destdiststr = "";
			if (startdist > 0.1 && startdist < 1000)
				startdiststr = " (" + startdist + "m from Starting Point)  ";
			else if (startdist >= 1000)
				startdiststr = " (" + Math.round(startdist / 100) / 10 + "Km from Starting Point)";
			if (destdist > 0.1 && destdist < 1000)
				destdiststr = " (" + destdist + "m from Destination)";
			else if (destdist >= 1000)
				destdiststr = " (" + Math.round(destdist / 100) / 10 + "Km from Last Stop)";
			
			var startwalkingdirections = "";
			if(startdist>0) {
				if(navigator.userAgent.match(/iPhone|iPad|iPod/i))
				startwalkingdirections ="<li data-theme='b'><a style='text-align: center;' href = 'http://maps.apple.com/?saddr=" +startmarker.position.lat()+ ","+ startmarker.position.lng()+"&daddr="+startstation.lat+ "," + startstation.lon+"&dirflg=w'  target='_blank'>Directions to Station <br />" + startdiststr + "</a></li>";
				else			
				startwalkingdirections ="<li data-theme='b'><a style='text-align: center;' href = 'http://maps.google.com/maps?saddr=" +startmarker.position.lat()+ ","+ startmarker.position.lng()+"&daddr="+startstation.lat+ "," + startstation.lon+"&dirflg=w'  target='_blank'>Directions to Station <br />" + startdiststr + "</a></li>";		
			}
			var destwalkingdirections = "";
			if(destdist>0){
				if(navigator.userAgent.match(/iPhone|iPad|iPod/i))
			 	destwalkingdirections="<li data-theme='b'><a style='text-align: center;' href = 'http://maps.apple.com/?saddr=" +endstation.lat+ "," + endstation.lon+"&daddr="+stopmarker.position.lat()+ ","+ stopmarker.position.lng()+"&dirflg=w'  target='_blank'>Directions to Destination <br />" + destdiststr + "</a></li>";
				else			
			 	destwalkingdirections="<li data-theme='b'><a style='text-align: center;' href = 'http://maps.google.com/maps?saddr=" +endstation.lat+ "," + endstation.lon+"&daddr="+stopmarker.position.lat()+ ","+ stopmarker.position.lng()+"&dirflg=w'  target='_blank'>Directions to Destination <br />" + destdiststr+ "</a></li>";
				
			} 
			drawWalkingLine(startmarker.position,new google.maps.LatLng(startstation.lat, startstation.lon));
			drawWalkingLine(stopmarker.position,new google.maps.LatLng(endstation.lat, endstation.lon));
			if (this.name == startstation.name) {
				iconimage = 'images/metrostart.png';
				$('#route-list').append(startwalkingdirections +"<li data-theme='a'style='text-align: center;color:"+getStationColour(this)+";'>Start from: <br /> " + this.name +"<br />("+this.line+" line)</li> ").listview('refresh');
				$('#route-list').append("<li data-theme='a' style='text-align: center;color:"+getStationColour(this)+";'>Pass " + stats + " stations <br />("+this.line+" line)</li>").listview('refresh');
			} else if (this.name == endstation.name) {
				iconimage = 'images/metrodest.png';
				$('#route-list').append("<li data-theme='a' style='text-align: center;color:"+getStationColour(this)+";'>Stop at: <br />" + this.name  + "</li>"+destwalkingdirections).listview('refresh');
			} else if (curr == 0 && this.name != endstation.name && this.name != startstation.name) {
				iconimage = 'images/metro.png';
				$('#route-list').append("<li data-theme='a' style='text-align: center;color:"+getStationColour(this)+";'>Change at: <br />"+this.name+" <br />(" + this.line + " line)</li>").listview('refresh');
				$('#route-list').append("<li data-theme='a' style='text-align: center;color:"+getStationColour(this)+";' >Pass " + stats + " stations <br />("+this.line+" line)</li>").listview('refresh');
			}
			if (startstation.name == endstation.name) {
				iconimage = 'images/metrodest.png';
				$('#route-list').append("<li data-theme='a' style='text-align: center;color:"+getStationColour(this)+";'>" + this.name + "</li>").listview('refresh');
				$('#route-list').append("<li data-theme='a'style='text-align: center;color:"+getStationColour(this)+";'>Destination</li>").listview('refresh');

			}
			var marker = new google.maps.Marker({
				position : new google.maps.LatLng(this.lat, this.lon),
				title : this.name,
				map : map,
				icon : iconimage
			});
			

/*
			var infowindow = new google.maps.InfoWindow();
                infowindow.setContent(marker.title);
    		infowindow.open(map,marker);
*/

			markers.push(marker);
			// Listen for click event
			google.maps.event.addListener(marker, 'click', function() {
				onItemClick(event, marker);
			});

		}

		var colour = getStationColour(this);
		
		var marker = new google.maps.Marker({
			position : new google.maps.LatLng(this.lat, this.lon),
			title : this.name,
			icon : {
				path : google.maps.SymbolPath.CIRCLE,
				scale : 4,
				strokeColor : colour
			},
			map : map
		});
		markers.push(marker);

		// Listen for click event
		google.maps.event.addListener(marker, 'click', function() {
			onItemClick(event, marker);
		});
		curr++;
	});
	

}


function getStationColour(stat){
	var res;
	$.each(mylines,function(){
		if (stat.line==this.name)
			res = this.colour;
	});
	return res;
}

function onItemClick(event, pin) {
	// Create content
	var contentString = pin.title;
	// Replace our Info Window's content and position
	infowindow.setContent(contentString);
	infowindow.setPosition(pin.position);
	infowindow.open(map);
}

function closeststation(latlong) {
	var closest = -1;

	var clstation;
	$.each(allstations, function() {
		var distance = getDistanceFromLatLonInKm(latlong.lat(), latlong.lng(), this.lat, this.lon);
		if (closest == -1 || distance < closest) {
			clstation = this;
			closest = distance;
		}
	});

	return clstation;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var R = 6371;
	// Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1);
	// deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	// Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180);
}


//returns array of groupedroutes
function getRoutesWithStops(fromstation, tostation, maxstops) {
	var iteration = 0;
	var possibleroutes = [];
	var possiblefullroutes = [];
	var possibleroute = [];
	var reached = false;
	if (hasDirectRoute(fromstation, tostation)) {
		$.each(getDirectRoutes(fromstation, tostation), function() {
			var groupedrouteout = new groupedroute(new Array(this), fromstation, tostation);
			possibleroutes.push(groupedrouteout);
			possiblefullroutes.push(groupedrouteout);
		});
		reached = true;
	} else {

		$.each(getChangeStations(fromstation), function() {
			var firststop = this;
			$.each(getDirectRoutes(fromstation, this), function() {
				//pass rute not array first
				var groupedrouteout = new groupedroute(new Array(this), fromstation, firststop);
				possibleroutes.push(groupedrouteout);
			});
		});
	}
	while ((!reached)) {
		$.each(possibleroutes, function() {
			var thisroute = this;
			if (hasDirectRoute(thisroute.laststation, tostation)) {
				$.each(getDirectRoutes(this.laststation, tostation), function() {
					thisroute.routes.push(this);
					thisroute.laststation = tostation;
					thisroute.duration += this.duration;
					possiblefullroutes.push(thisroute);
				});
				reached = true;
				//should be ok till here....look down
			} else {
				$.each(getChangeStations(thisroute.laststation), function() {
					var chst = this;
					$.each(getDirectRoutes(thisroute.laststation, chst), function() {
						var groupedrouteout = thisroute;
						groupedrouteout.routes.push(this);
						groupedrouteout.laststation = chst;
						groupedrouteout.duration += this.duration;
						possibleroutes.push(groupedrouteout);
					});
				});

			}
		});
		iteration++;
	}

	return possiblefullroutes;
}

function getStationsArrayDistance(stations) {
	var duration = 0;
	if (stations.length > 1) {
		for (var i = 0; i < (stations.length ); i++) {
			duration += getLinkDuration(stations[i], stations[i + 1]);
		}
	}
	return duration;
}

function getLinkDuration(fromstation, tostation) {
	var duration = 0;
	$.each(linkdurations, function() {
		if (((this.fromstation == fromstation) && (this.tostation == tostation)) || ((this.tostation == fromstation) && (this.fromstation == tostation))) {
			duration = this.duration;
		}
	});
	return duration;
}

function getRouteByName(name) {
	var resroute;
	$.each(mylines, function() {
		if (this.route.name == name) {
			resroute = this.route;
		}
	});
	return resroute;
}





$(function() {
	$("#mylocation").click(function() {
		$.mobile.navigate("#mainPage");
	});
});

function getLocation() {
	if (navigator.geolocation) {
		var options = {
			frequency : 3600000
		};
		navigator.geolocation.getCurrentPosition(showPosition, onError, null);
	} else {
		x.innerHTML = "Geolocation is not supported by this browser.";
	}
	mylocation = false;
}

function showPosition(position) {
	startgpsposition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

	startmarker.setPosition(startgpsposition);
	startstation = closeststation(startgpsposition);
	if (endstation.stationid != "none")
		drawShortestRoute(startstation, endstation);
	mylocation = false;
}

function onError(error) {
	//alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}


$(document).ready(function() {
	
$.getJSON("metro.json",function(json){
mapcentrelat = json.mapcentrelat ;
mapcentrelng = json.mapcentrelng ;
	$.each(json.lines,function(index,value){
		var stationarr = [];
		var linename = value.line;
		$.each(value.stations, function() {
			var stat = new station(this.name + "-"+ linename , this.name, linename, this.lat, this.lon, this.change);
			stationarr.push(stat);
			allstations.push(stat);
			if (stationarr.length > 1) {
				linkdurations.push(new link(stationarr[stationarr.length - 2], stationarr[stationarr.length - 1], this.dist));
			}
		});
		stationarrs.push(stationarr);
		var newroute = new route(linename, stationarr);
		var col = value.colour;
		var newline = new lineroute(linename,newroute,col);
		mylines.push(newline);
			});
		});

	populateListViews();
	
	
        var options = new ContactFindOptions();
        options.filter="";          // empty search string returns all contacts
        options.multiple=true;      // return multiple results
        filter = ["displayName"];   // return contact.displayName field

        // find contacts
        navigator.contacts.find(filter, onSuccess, onError, options);
        
});

    function onSuccess(contacts) {
        for (var i=0; i<contacts.length; i++) {
            alert(contacts[i].displayName);
        }
    };

function drawfixedroutes(lines) {

	$.each(lines, function() {
		var colour = this.colour;
		var polyOptions = {
			strokeColor : colour,
			strokeOpacity : 0.5,
			strokeWeight : 12
		};
		var poly = new google.maps.Polyline(polyOptions);
		poly.setMap(map);
		fixedpolys.push(poly);
		var path = poly.getPath();

		$.each(this.route.stations, function() {
			path.push(new google.maps.LatLng(this.lat, this.lon));

		});
	});
}

function loadScript() {
	if (window.navigator.onLine) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places&sensor=false&v=3.exp&' + 'callback=initialize';
		document.body.appendChild(script);

	} else
		alert("offline");
}
window.onload = loadScript;

