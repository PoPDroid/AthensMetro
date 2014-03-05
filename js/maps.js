var map;
var stationarr1 = [];
var stationarr2 = [];
var stationarr3 = [];
var linkdurations = [];
var startmarker;
var stopmarker;
var startgpsposition;
var myroutes = [];
var markers = [];
var polys = [];
var infowindow;
var startstation;
var touchoption = "none";
var endstation;
var maxstops = 2;
var stationnames = [];
var mingroupedroute;
var mylocation = false;
var searchingdest =false;
var searchingstart =false;
var inputstart;
var inputdest;

function station(stationid, name, routes, lat, lon) {
	this.stationid = stationid;
	this.name = name;
	this.routes = routes;
	this.lat = lat;
	this.lon = lon;
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
	zoom(mingroupedroute);
}

function initialize() {

	var mapOptions = {
		zoom : 11,
		center : new google.maps.LatLng(38.074287, 23.808201)
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

	startstation = stationnames[0];

	endstation = stationnames[stationnames.length - 1];
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

	var myroute1 = new route("Route 1", stationarr1);
	var myroute2 = new route("Route 2", stationarr2);
	var myroute3 = new route("Route 3", stationarr3);
	myroutes.push(myroute1);
	myroutes.push(myroute2);
	myroutes.push(myroute3);
	drawrfixedroutes(myroutes);
	zoom(stationnames);
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
			if(searchingdest){
				map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
				searchingdest = false;
			}
			if(searchingstart){
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
		} else if (this.value == "choice-2") {
			$("#startstationsdiv").hide();
			$("#startsearchdiv").show();
			
			$("#startPage").popup("close");
			if(searchingdest){
				searchingdest = false;
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
			}
			if(!searchingstart){
				map.controls[google.maps.ControlPosition.TOP].push(inputstart);
				searchingstart = true;
			}
		} else if (this.value == "choice-3") {
			$("#startstationsdiv").hide();
			$("#startsearchdiv").hide();
			$("#startPage").popup("close");
			if(searchingdest){
				searchingdest = false;
				map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
			}
			if(searchingstart){
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
			if(searchingdest){
				map.controls[google.maps.ControlPosition.TOP].pop(inputdest);
				searchingdest = false;
			}
			if(searchingstart){
			$("#destinationstationsdiv").hide();
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
		} else if (this.value == "choice-2") {
			$("#destinationstationsdiv").hide();
			$("#destinationsearchdiv").show();
			$("#destPage").popup("close");
			if(searchingstart){
				map.controls[google.maps.ControlPosition.TOP].pop(inputstart);
				searchingstart = false;
			}
			if(!searchingdest){
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
	//var startoption = (document.getElementById('select-choice-start'));
	//var destoption = (document.getElementById('select-choice-destinatoin'));

	/*
	 map.controls[google.maps.ControlPosition.RIGHT_TOP].push(inputstart);
	 map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(inputdest);
	 map.controls[google.maps.ControlPosition.RIGHT_TOP].push(startstation);
	 map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(deststation);
	 //map.controls[google.maps.ControlPosition.BOTTOM_LEFT].pop(deststation);
	 //map.controls[google.maps.ControlPosition.TOP_CENTER].push(startoption);
	 //map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(destoption);*/

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
		searchingdest = false;
		$("#destsearchdiv").hide();
		var places = searchBoxDest.getPlaces();
		stopmarker.setPosition(places[0].geometry.location);
		endstation = closeststation(places[0].geometry.location);
		if (startstation.stationid != "none")
			drawShortestRoute(startstation, endstation);
	});

	// Bias the SearchBox results towards places that are within the bounds of the
	// current map's viewport.
	google.maps.event.addListener(map, 'bounds_changed', function() {
		var bounds = map.getBounds();
		searchBoxStart.setBounds(bounds);
	});

	// Bias the SearchBox results towards places that are within the bounds of the
	// current map's viewport.
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
	$.each(stationnames, function() {
		if (stationid == this.stationid)
			outstation = this;
	});
	return outstation;
}

function populateListViews() {

	$.each(stationarr1, function() {
		if (!($.inArray(this, stationnames) > -1)) {
			stationnames.push(this);
		}
	});
	$.each(stationarr2, function() {
		if (!($.inArray(this, stationnames) > -1)) {
			stationnames.push(this);
		}
	});
	$.each(stationarr3, function() {
		if (!($.inArray(this, stationnames) > -1)) {
			stationnames.push(this);
		}
	});
	var output = '';
	$.each(stationnames, function() {
		$('#stations-start').append("<li onclick='setStartStation(" + this.stationid + ")'  class='ui-screen-hidden' ><a>" + this.name + "</a></li>");
		$('#stations-dest').append("<li onclick='setEndStation(" + this.stationid + ")' class='ui-screen-hidden' ><a>" + this.name + "</a></li>");
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
	//map.setZoom(map.getZoom() );
}

function drawShortestRoute(ss, es) {
	$("#detailsbutton").show();
	clearOverlays();
	mingroupedroute;
	$('#route-list').empty();
	var mintime = -1;
	var time = 0;
	for (var i = 0; i < getRoutesWithStops(ss, es, 4).length; i++) {
		var currgroupedroute = getRoutesWithStops(ss, es, 4)[i];

		if ((currgroupedroute.duration < mintime) || mintime < 0) {
			mintime = currgroupedroute.duration;
			mingroupedroute = currgroupedroute;
			/////here we must consider whether to take shortest path or least number of stations
		}
	};
	var zoomstations = [];
	$('#route-list').append("<li data-theme='c'></li>").listview('refresh');
	$.each(mingroupedroute.routes, function() {
		drawroute(this);
		$.each(this.stations, function() {
			zoomstations.push(this);
		});
	});
	$('#route-list').append("<li data-theme='c'></li>").listview('refresh');
		$('#route-list').append("<li data-theme='c'></li>").listview('refresh');
	$('#route-list').append("<li data-theme='b' style='text-align: center;'>Number of interchanges: " + (mingroupedroute.routes.length - 1) + "</li>").listview('refresh');

	zoom(zoomstations);
	}

function drawroute(route) {

	var polyOptions = {
		strokeColor : "#FFFFFF",
		strokeOpacity : 1,
		strokeWeight : 4,
	};

	var poly = new google.maps.Polyline(polyOptions);
	poly.setMap(map);
	polys.push(poly);
	var path = poly.getPath();

	var curr = 0;
	$.each(route.stations, function() {
		path.push(new google.maps.LatLng(this.lat, this.lon));

		if (this == startstation || curr == 0 || this == endstation) {

			var stats = route.stations.length - 2;
			if (stats == -1)
				stats = 0;
			var iconimage = 'images/metro.png';
			var startdist = getDistanceFromLatLonInKm(startmarker.position.lat(),startmarker.position.lng(), startstation.lat,startstation.lon);
			var destdist = getDistanceFromLatLonInKm(stopmarker.position.lat(),stopmarker.position.lng(), endstation.lat,endstation.lon);
			var startdist = Math.round(startdist * 1000);
			var destdist = Math.round(destdist * 1000);
			var startdiststr = "";
			var destdiststr = "";
			if (startdist > 0.1 && startdist < 1000) 
				startdiststr = " (" +startdist + "m from Starting Point)"; 
			else if (startdist >=1000)
				startdiststr = " (" +Math.round(startdist/100) /10  + "Km from Starting Point)"; 
			if (destdist > 0.1 && destdist < 1000) 
				destdiststr = " (" +destdist + "m from Destination)"; 
			else if (destdist >=1000)
				destdiststr = " (" +Math.round(destdist/100) /10 + "Km from Destination)"; 
			
			if (this == startstation) {
				iconimage = 'images/metrostart.png';
				//$('#route-list').append("<li data-theme='b' style='text-align: center;'>Start</li>").listview('refresh');
				$('#route-list').append("<li data-theme='a'style='text-align: center;'>Start from: " + this.name + startdiststr + "</li>").listview('refresh');
				$('#route-list').append("<li data-theme='d' style='text-align: center;'>(Pass " + stats + " stations)</li>").listview('refresh');
			} else if (this == endstation) {
				iconimage = 'images/metrodest.png';
				$('#route-list').append("<li data-theme='a' style='text-align: center;'>Stop at: " + this.name +  destdiststr + "</li>").listview('refresh');
				//$('#route-list').append("<li data-theme='b'style='text-align: center;'>Destination</li>").listview('refresh');
			} else if (curr == 0 && this != endstation && this != startstation) {
				iconimage = 'images/metro.png';
				$('#route-list').append("<li data-theme='a' style='text-align: center;'>Change at: " + this.name + "</li>").listview('refresh');
				$('#route-list').append("<li data-theme='d' style='text-align: center;' >(Pass " + stats + " stations)</li>").listview('refresh');
			}
			if (startstation == endstation) {
				iconimage = 'images/metrodest.png';
				$('#route-list').append("<li data-theme='a' style='text-align: center;'>" + this.name + "</li>").listview('refresh');
				$('#route-list').append("<li data-theme='b'style='text-align: center;'>Destination</li>").listview('refresh');

			}
			var marker = new google.maps.Marker({
				position : new google.maps.LatLng(this.lat, this.lon),
				title : this.name,
				map : map,
				icon : iconimage
			});
			markers.push(marker);
			// Listen for click event
			google.maps.event.addListener(marker, 'click', function() {
				onItemClick(event, marker);
			});

		}

		var marker = new google.maps.Marker({
			position : new google.maps.LatLng(this.lat, this.lon),
			title : this.name,
			icon : {
				path : google.maps.SymbolPath.CIRCLE,
				scale : 4,
				strokeColor : "#000000"
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

function getCommonRoutesColour(stats) {
	var route1count = 0;
	var route2count = 0;
	var route3count = 0;
	$.each(stats, function() {
		$.each(this.routes, function() {

			if (this.name == "Route 1") {
				route1count++;
			} else if (this.name == "Route 2") {
				route2count++;
			} else if (this.name == "Route 3") {
				route3count++;
			}
		});
	});
	//????
	//get max col

}

function drawrfixedroutes(routes) {

	$.each(routes, function() {
		var colour = "";
		if (this.name == "Route 1") {
			colour = "#0000FF";
		} else if (this.name == "Route 2") {
			colour = "#FF0000";
		} else if (this.name == "Route 3") {
			colour = "#00FF00";
		}
		var polyOptions = {
			strokeColor : colour,
			strokeOpacity : 0.5,
			strokeWeight : 12
		};
		var poly = new google.maps.Polyline(polyOptions);
		poly.setMap(map);
		var path = poly.getPath();

		$.each(this.stations, function() {
			path.push(new google.maps.LatLng(this.lat, this.lon));

		});
	});
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
	$.each(stationarr1, function() {
		var distance = getDistanceFromLatLonInKm(latlong.lat(), latlong.lng(), this.lat, this.lon);
		if (closest == -1 || distance < closest) {
			clstation = this;
			closest = distance;
		}
	});
	$.each(stationarr2, function() {
		var distance = getDistanceFromLatLonInKm(latlong.lat(), latlong.lng(), this.lat, this.lon);
		if (closest == -1 || distance < closest) {
			clstation = this;
			closest = distance;
		}
	});
	$.each(stationarr3, function() {
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
	return deg * (Math.PI / 180)
}

//returns array of array of stations on path from start to stop stations
function getDirectRoutes(fromstation, tostation) {

	var directroutes = [];
	$.each(fromstation.routes, function() {
		if (($.inArray(this.toString(), tostation.routes) > -1)) {
			var directroute = new route("Direct Route", getStationsBetweenRoute(fromstation, tostation, getRouteByName(this)));
			directroutes.push(directroute);
		}
	});
	return directroutes;
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

function hasDirectRoute(fromstation, tostation) {
	return (getDirectRoutes(fromstation, tostation).length > 0);
}

function getRouteByName(name) {
	var resroute;
	$.each(myroutes, function() {
		if (this.name == name) {
			resroute = this;
		}
	});
	return resroute;
}

function getCommonRoute(firststation, laststation) {
	var resroute;
	$.each(myroutes, function() {
		if (($.inArray(this.name, firststation.routes) > -1) && ($.inArray(this.name, laststation.routes) > -1)) {
			resroute = this;
		}
	});
	return resroute;
}

//returns change stations on same rout as from station
function getChangeStations(fromstation) {
	var changestations = [];
	var currroute;
	$.each(myroutes, function() {
		if ($.inArray(this.name, fromstation.routes) > -1) {
			currroute = this;
			$.each(currroute.stations, function() {
				if (this.routes.length > 1) {
					changestations.push(this);
					//alert(this.name);
				}
			});
		}
	});
	return changestations;
}

function getShortestRoute(routes) {
	var minroute;
	$.each(routes, function() {

	});
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
	alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}


$(document).ready(function() {
	var station1 = new station("1", "Airport Station", new Array("Route 1"), 37.934715, 23.942335);
	var station2 = new station("2", "Koropi Station", new Array("Route 1"), 37.913097, 23.895821);
	var station3 = new station("3", "Peania-Kantza Station", new Array("Route 1"), 37.981506, 23.869907);
	var station4 = new station("4", "Pallini Station", new Array("Route 1"), 38.005444, 23.869707);
	var station5 = new station("5", "Doukissis Plakentias Station", new Array("Route 1"), 38.023983, 23.833746);
	var station6 = new station("6", "Halandri Station", new Array("Route 1"), 38.021976, 23.821611);
	var station7 = new station("7", "Agia Paraskeyi Station", new Array("Route 1"), 38.017120, 23.812273);
	var station8 = new station("8", "Nomismatokopio Station", new Array("Route 1"), 38.010159, 23.808237);
	var station9 = new station("9", "Holargos Station", new Array("Route 1"), 38.004959, 23.794735);
	var station10 = new station("10", "Ethniki Amyna Station", new Array("Route 1"), 37.999470, 23.784721);
	var station11 = new station("11", "Katehaki Station", new Array("Route 1"), 37.993477, 23.776918);
	var station12 = new station("12", "Panormou Station", new Array("Route 1"), 37.993092, 23.763502);
	var station13 = new station("13", "Ambelokipi Station", new Array("Route 1"), 37.987270, 23.757620);
	var station14 = new station("14", "Megaro Moussikis Station", new Array("Route 1"), 37.979393, 23.753492);
	var station15 = new station("15", "Evangelismos Station", new Array("Route 1"), 37.975937, 23.746456);
	var station16 = new station("16", "Syntagma Station", new Array("Route 1", "Route 2"), 37.975063, 23.735447);
	var station17 = new station("17", "Monastiraki Station", new Array("Route 1", "Route 3"), 37.976601, 23.726183);
	var station18 = new station("18", "Keramikos Station", new Array("Route 1"), 37.978733, 23.711073);
	var station19 = new station("19", "Eleonas Station", new Array("Route 1"), 37.987591, 23.693890);
	var station20 = new station("20", "Egaleo Station", new Array("Route 1"), 37.991409, 23.681862);

	var station22 = new station("22", "Aghios Antonios Station", new Array("Route 2"), 38.006542, 23.699280);
	var station23 = new station("23", "Sepolia Station", new Array("Route 2"), 38.002621, 23.713688);
	var station24 = new station("24", "Attiki Station", new Array("Route 2", "Route 3"), 37.998116, 23.722763);
	var station25 = new station("25", "Larissa Station", new Array("Route 2"), 37.990192, 23.719177);
	var station26 = new station("26", "Metaxourghio Station", new Array("Route 2"), 37.986584, 23.720821);
	var station27 = new station("27", "Omonia Station", new Array("Route 2", "Route 3"), 37.984016, 23.727983);
	var station28 = new station("28", "Panepistimio Station", new Array("Route 2"), 37.980167, 23.732908);
	var station29 = new station("29", "Akropoli Station", new Array("Route 2"), 37.968681, 23.729433);
	var station30 = new station("30", "Syngrou Fix Station", new Array("Route 2"), 37.964081, 23.726145);
	var station31 = new station("31", "Neos Kosmos Station", new Array("Route 2"), 37.957615, 23.728544);
	var station32 = new station("32", "Aghios Ioannis Station", new Array("Route 2"), 37.956306, 23.734411);
	var station33 = new station("33", "Dafni Station", new Array("Route 2"), 37.949314, 23.737202);
	var station34 = new station("34", "Aghios Dimitrios Station", new Array("Route 2"), 37.941151, 23.740540);

	var station36 = new station("36", "Kifissia Station", new Array("Route 3"), 38.074287, 23.808201);
	var station37 = new station("37", "KAT Station", new Array("Route 3"), 38.065437, 23.803967);
	var station38 = new station("38", "Maroussi Station", new Array("Route 3"), 38.056305, 23.805155);
	var station39 = new station("39", "Neradjiotissa Station", new Array("Route 3"), 38.045479, 23.793570);
	var station40 = new station("40", "Irini Station", new Array("Route 3"), 38.043098, 23.783792);
	var station41 = new station("41", "Iraklio Station", new Array("Route 3"), 38.046200, 23.766171);
	var station42 = new station("42", "Nea Ionia Station", new Array("Route 3"), 38.041401, 23.754854);
	var station43 = new station("43", "Pefkakia Station", new Array("Route 3"), 38.037128, 23.750179);
	var station44 = new station("44", "Perissos Station", new Array("Route 3"), 38.032810, 23.744658);
	var station45 = new station("45", "Ano Patissia Station", new Array("Route 3"), 38.023853, 23.735954);
	var station46 = new station("46", "Aghios Eleftherios Station", new Array("Route 3"), 38.020119, 23.731791);
	var station47 = new station("47", "Kato Patissia Station", new Array("Route 3"), 38.011600, 23.728579);
	var station48 = new station("48", "Aghios Nikolaos Station", new Array("Route 3"), 38.006794, 23.727640);
	var station49 = new station("49", "Victoria Station", new Array("Route 3"), 37.993088, 23.730200);
	var station50 = new station("50", "Thissio Station", new Array("Route 3"), 37.976746, 23.720728);
	var station51 = new station("51", "Petralona Station", new Array("Route 3"), 37.968281, 23.709007);
	var station52 = new station("52", "Tavros Station", new Array("Route 3"), 37.962582, 23.703470);
	var station53 = new station("53", "Kalithea Station", new Array("Route 3"), 37.960503, 23.697279);
	var station54 = new station("54", "Moschato Station", new Array("Route 3"), 37.955132, 23.680010);
	var station55 = new station("55", "Faliro Station", new Array("Route 3"), 37.944984, 23.664776);
	var station56 = new station("56", "Piraeus Station", new Array("Route 3"), 37.948063, 23.642447);
	stationarr1.push(station1);
	stationarr1.push(station2);
	stationarr1.push(station3);
	stationarr1.push(station4);
	stationarr1.push(station5);
	stationarr1.push(station6);
	stationarr1.push(station7);
	stationarr1.push(station8);
	stationarr1.push(station9);
	stationarr1.push(station10);
	stationarr1.push(station11);
	stationarr1.push(station12);
	stationarr1.push(station13);
	stationarr1.push(station14);
	stationarr1.push(station15);
	stationarr1.push(station16);
	stationarr1.push(station17);
	stationarr1.push(station18);
	stationarr1.push(station19);
	stationarr1.push(station20);

	for (var i = 0; i < (stationarr1.length - 1); i++) {
		linkdurations.push(new link(stationarr1[i], stationarr1[i + 1], 1));
	}
	stationarr2.push(station22);
	stationarr2.push(station23);
	stationarr2.push(station24);
	stationarr2.push(station25);
	stationarr2.push(station26);
	stationarr2.push(station27);
	stationarr2.push(station28);
	stationarr2.push(station16);
	stationarr2.push(station29);
	stationarr2.push(station30);
	stationarr2.push(station31);
	stationarr2.push(station32);
	stationarr2.push(station33);
	stationarr2.push(station34);

	for (var i = 0; i < (stationarr2.length - 1); i++) {
		linkdurations.push(new link(stationarr2[i], stationarr2[i + 1], 1));
	}

	stationarr3.push(station36);
	stationarr3.push(station37);
	stationarr3.push(station38);
	stationarr3.push(station39);
	stationarr3.push(station40);
	stationarr3.push(station41);
	stationarr3.push(station42);
	stationarr3.push(station43);
	stationarr3.push(station44);
	stationarr3.push(station45);
	stationarr3.push(station46);
	stationarr3.push(station47);
	stationarr3.push(station48);
	stationarr3.push(station24);
	stationarr3.push(station49);
	stationarr3.push(station27);
	stationarr3.push(station17);
	stationarr3.push(station50);
	stationarr3.push(station51);
	stationarr3.push(station52);
	stationarr3.push(station53);
	stationarr3.push(station54);
	stationarr3.push(station55);
	stationarr3.push(station56);

	for (var i = 0; i < (stationarr3.length - 1); i++) {
		linkdurations.push(new link(stationarr3[i], stationarr3[i + 1], 1));
	}

	populateListViews();
});

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