
$(document).ready(function(){
	// set up empty map
	$('#map_canvas').gmap({'center': '39.027719,-103.623047', 'disableDefaultUI':false, 'callback': function() {
		var self = this;
		// on click set up the map
		$('#search').click( function(){
			// cleanup stuff
			$('#search_error').hide();
			self.clear('markers');
			self.clear('overlays');
			var artist = $('#artist_name').val(),
			year = $('#year option:selected').val();
			var overlay_loaded = false,
			markers_loaded = false;
			$('#loading').show();	
			// end cleanup stuff

			// making overlays based on listener counts
			$.getJSON( 'tour_api?artist='+artist+'&year='+year, function(data) { 	
				console.log(data);
				if (data.error != "None"){
					$('#search_error').show();
					$('#search_error').html(data.error+' (mySQL)');
					
					$('#loading').hide();
					return;
				}		
				var max_list = _.max(data.data.totals, function(tot) { return parseInt(tot.listeners); }),
					min_list =  _.min(data.data.totals, function(tot) { return parseInt(tot.listeners); });
		
				$.each(data.data.totals, function(i, city){
					var clientPos = new google.maps.LatLng(city.lat,city.long);
					var rad = getRad(parseInt(min_list.listeners), parseInt(max_list.listeners), city.listeners);
					var fillCol = getColor(rad);
					self.addShape('Circle', { 'strokeWeight': 0, 'fillColor': fillCol, 'fillOpacity': 0.25, 'center': clientPos, 'radius': rad}).click(function(){ 
						$('#info_box').html('<div style="text-align:center"><h2>City: '+city.city+'</h2><h2>Listeners: '+city.listeners+'</h2></div>');
					});
					// done loading overlays
					if (i == data.data.totals.length-1){
						console.log('overlay loaded');
						overlay_loaded=true;
						if (overlay_loaded && markers_loaded) 	$('#loading').hide();
					}
				});
				$('#tot_cities').html(data.data.total_cities);
				var tot_list = _.reduce(data.data.totals, function(a, b){ return a + parseInt(b.listeners); },0);
				console.log(tot_list);
				$('#tot_listeners').html(tot_list);
			});		
			// markers for concerts
			$.getJSON( 'http://ws.audioscrobbler.com/2.0/?method=artist.getpastevents&format=json&artist='+artist+'&api_key=46d8e5af527082f81cd3e592d5d832a8&limit=300', function(data) { 
			if (data.error){
					$('#search_error').show();
					$('#search_error').html(data.message+' (LFM)');
					
					$('#loading').hide();
					return;			
			}
			console.log(data);
			var concert_ctr = 0;
				$.each( data.events.event, function(i, event) {
					// find out date
					var date = event.startDate;
					date = date.split(' ');
				//	console.log(date[3]);
					// skip until reaches current year
					if (parseInt(date[3]) > year) return;
					// didn't skip! increment counter
					concert_ctr++;
					// after lower year, break loop 								
					if (parseInt(date[3]) < year){
						markers_loaded=true;
						console.log('markers loaded');
						if (overlay_loaded && markers_loaded) 	$('#loading').hide();
						$('#tot_concerts').html(concert_ctr);
						return false;
					}
					if (event.venue.location.country == "United States" ){
						var lat = event.venue.location['geo:point']['geo:lat'];
						var long = event.venue.location['geo:point']['geo:long'];
					//	console.log(lat+' : '+long);
						// hide erroneous geotags (failed :/ )
					//	if (long < -90 && long > -115 && lat < 50 && lat > 25){
							self.addMarker({ 'position': new google.maps.LatLng(lat, long), 'bounds':true } ).click(function() {
								$('#info_box').html('<div style="text-align:center"><h2>Event: '+event.title+'</h2><h2>Location: '+event.venue.location.city+'</h2><h2>Date: '+event.startDate+'</h2></div>');
							});
					//	}
					}
				
				});



			});
		}); 
	}});  
});
// constants for min and max radius size
var a = 50000,
	b = 200000;

function getRad(minn, maxx, x){
	var res =  ((((b-a)*(x-minn)) / (maxx-minn)) + a);
//	console.log(res);
	return res;
}

// hashtable of sorts?
// turn # from 50000-200000 to 0-14
function getColor(rad){
var hash = parseInt((((14)*(rad-a)) / (b-a)));
///console.log(rad);
//console.log(hash);
var array = [
	'FF0000', 'FF2200',
	'FF4400','FF6600',
	'FF8800','FFAA00',
	'FFCC00','FFEE00',
	'EEFF00','CCFF00',
	'AAFF00','88FF00',
	'66FF00','44FF00',
	'22FF00','00FF00',
];
return '#'+array[14-hash];
}
			
