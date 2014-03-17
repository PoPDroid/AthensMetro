
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
