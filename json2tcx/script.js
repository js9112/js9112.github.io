function xmlHeader(startTime, activityType) {
	var res = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
	res += "<TrainingCenterDatabase xmlns=\"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd\">\n";
	res += "<Activities>\n<Activity Sport=\"";
	res += activityType;
	res += "\">";
	res += "<Id>" + startTime + "</Id>\n";
	return res;
}

function xmlFooter(model,major,minor,release) {
let creator = "<Creator xsi:type=\"Device_t\">" 
	   + "<Name>Samsung "+ model + "</Name>" 
	   + "<UnitId>0</UnitId>"
	   + "<ProductID>0</ProductID>"
	   + "<Version>"
	   + "<VersionMajor>0</VersionMajor>" 
	   + "<VersionMinor>0</VersionMinor>"
	   + "<BuildMajor>0</BuildMajor>"
	   + "<BuildMinor>0</BuildMinor>"
	   + "</Version>"
	   + "</Creator>";

let author = "<Author xsi:type=\"Application_t\">"
		 + "<Name>Run4Gear Samsung Wearable App</Name>"
		 + "<Build><Version>"
	     + "<VersionMajor>" + major + "</VersionMajor>"
	     + "<VersionMinor>" + minor + "</VersionMinor>"
		 + "<BuildMajor>" + release + "</BuildMajor>"
		 + "<BuildMinor>0</BuildMinor>" 
		 + "</Version></Build>"
	     + "<LangID>en</LangID>"
		 + "<PartNumber>000-0000-000</PartNumber>"
		 + "</Author>"

	return creator + "\n</Activity>\n</Activities>\n" + author + "\n</TrainingCenterDatabase>";
}

function xmlLapHeader(startTime, lapTime, lapDist, maxHR, hrAvg, cal, maxSpd) {
	var res = "<Lap StartTime=\"" + startTime + "\">\n";
	res += "<TotalTimeSeconds>" + lapTime + "</TotalTimeSeconds>\n";
	res += "<DistanceMeters>" + lapDist + "</DistanceMeters>\n";
	if (maxSpd > -0.5)
		res += "<MaximumSpeed>" + (maxSpd * 1000. / 3600.) + "</MaximumSpeed>\n";
	res += "<Calories>" + cal + "</Calories>\n";
	res += "<AverageHeartRateBpm>";
	res += "<Value>" + hrAvg + "</Value></AverageHeartRateBpm>\n";
	res += "<MaximumHeartRateBpm>";
	res += "<Value>" + maxHR + "</Value></MaximumHeartRateBpm>\n";
	res += "<Intensity>Active</Intensity><TriggerMethod>Manual</TriggerMethod>\n";
	return res;
}

function startTrack() {
	return "<Track>\n";
}

function endTrack() {
	return "</Track>\n";
}

function endlap() {
	return "</Lap>\n";
}

function xmlTrackPoint(time, lat, lng, distance, hrm, alt, step, spd, biking) {
	//distance *= 1000;//km -> meter
	var res = "<Trackpoint>\n<Time>" + time + "</Time>\n";
	res += "<Position>\n";
	res += "<LatitudeDegrees>" + lat + "</LatitudeDegrees>\n";
	res += "<LongitudeDegrees>" + lng + "</LongitudeDegrees>\n";
	res += "</Position>\n";
	res += "<AltitudeMeters>" + alt + "</AltitudeMeters>\n";
	res += "<DistanceMeters>" + distance + "</DistanceMeters>\n";
	res += "<HeartRateBpm><Value>" + Math.round(hrm) + "</Value></HeartRateBpm>\n";
	if (biking)
		res += "<Cadence>" + Math.round(step) + "</Cadence>\n";
	res += "<Extensions>\n";
	res += "<TPX xmlns=\"http://www.garmin.com/xmlschemas/ActivityExtension/v2\">\n"
	res += "<Speed>" + (spd * 1000. / 3600.) + "</Speed>\n";
	if (!biking)
		res += "<RunCadence>" + Math.round(step / 2) + "</RunCadence>\n";
	res += "</TPX>\n";
	res += "</Extensions>\n";
	res += "</Trackpoint>\n";
	return res;
}

function dist(p1, p2) {
	let a = p1.lat - p2.lat;
	let b = p1.lng - p2.lng;
	return Math.sqrt(a*a+b*b);
}

function removeBadStartingPoint(d) {
	for (var l = 0; l < d.laps.length; ++l) {
		//console.log("lap" + l + "\n");
		var lap = d.laps[l];
		let i = 0;
		while (i < lap.points.length -1 && lap.points[i].lat == 0 && lap.points[i].lng == 0)
			++i;
		//if (i != 0)  
		{
			while (i < lap.points.length - 1 
				&& 
				dist(lap.points[i], lap.points[i+1]) > 0.1)
				++i;

			while(i > 0) {
				lap.points[i-1].lat = lap.points[i].lat;
				lap.points[i-1].lng = lap.points[i].lng;
				--i;
			}
		}
}
}

function detectActivityType(d) {
	if (d.type == "BIKING")
		return "Biking";
	if (d.type == "Indoor Biking")
		return "Biking";
	if (d.type == "SPINBIKE")
		return "Biking";
	if (d.type == "HIKING")
		return "Hiking";
	if (d.type == "TREADMILL")
		return "Running";
	if (d.type == "Treadmill")
		return "Running";
	return d.type;
}

function json2tcx(data, jsonfile, callback) {
    //var data = fs.readFileSync(jsonfile);
    //var d = require(jsonpath+jsonfile);
    var d = JSON.parse(data);
    var prevspeed = 0;
    var profile = d.profile;
    if (d.measure !== undefined)
	d = d.measure;
    
    removeBadStartingPoint(d);
    let biking = false;
    if (detectActivityType(d) == "Biking")
	biking = true;
    
    var tcx = xmlHeader(d.date, detectActivityType(d));
    for (var l = 0; l < d.laps.length; ++l) {
	var lap = d.laps[l];
			var spd = -1.;
	if (lap.maxspd != undefined) {
	    spd = lap.maxspd;
	    if (spd > 300)
		spd /= 1000;
	}
	tcx += xmlLapHeader(lap.date, lap.time, lap.len, lap.maxhr, lap.ahr, lap.cal, spd);
	var trackStarted = false;
	for (var i = 0; i < lap.points.length; ++i) {
	    var p = lap.points[i];
	    if (p.pause != undefined) {
		if (trackStarted)
		    tcx += endTrack();
					trackStarted = false;
	    }
	    else {
		if (!trackStarted) {
		    tcx += startTrack();
		    trackStarted = true;
		}
		if (p.spd > -0.0001)
		    prevspeed = p.spd;
		tcx += xmlTrackPoint(p.date, p.lat, p.lng, p.len, p.hr, p.alt, p.cad, prevspeed, biking);
	    }
	}
	if (trackStarted)
	    tcx += endTrack();
	tcx += endlap();
    }
    tcx += xmlFooter(d.gearmodel, 2, 0 , 0);
    tcxfilename = jsonfile.substr(0, jsonfile.length - 5) + ".tcx";
    document.getElementById("success").innerHTML='Succesfully converted. <br> Download of file '+tcxfilename+" should start now."
    save(tcxfilename, tcx);
    /* fs.writeFile(tcxfilename, tcx, function (err) {
      if (err) {
          console.log("json2tcx::error");
          return;
      }
      if (callback !== undefined)
          callback(tcxfilename, profile);
    }); */
}

const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
    readJSON(event.target.files[0]);
  });

function readJSON(file) {
  	document.getElementById("error").innerHTML='';
  	document.getElementById("success").innerHTML='';
  if (file.type!="application/json") {
  	document.getElementById("error").innerHTML='File is not JSON.'
    console.log('File is not JSON.', file.type, file);
    return;
  }
const reader = new FileReader();
  reader.addEventListener('load', (event) => {
		json2tcx(event.target.result, file.name)
  });
  reader.readAsText(file);
 	
}

function save(filename, data) {
    var blob = new Blob([data], {type: 'application/vnd.garmin.tcx+xml'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
        window.URL.revokeObjectURL(blob)
    }
}

