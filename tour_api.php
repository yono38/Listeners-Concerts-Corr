<?php
	error_reporting(E_ALL);
	ini_set('display_errors', '1');
	header('Content-type: application/json');
	// set up
	$results = array(
		'error' => 'Incomplete',
		'data' => array(
			'totals' => array()
		)
	);
	
	$limits = array(
		'2009' => array(
			'start' => 1233489600,
			'end' => 1261915200,
		),
		'2010' => array(
			'start' => 1261915200,
			'end' => 1293364800
		),
		'2011' => array(
			'start' => 1293364800,
			'end' => 1325419200
		),
		'all' => array(
			'start' => 1233489600,
			'end' => 1325419200
		)
	);
	
	if (isset($_GET['year']) && ($_GET['year']=='2009' || $_GET['year'] == '2010' || $_GET['year'] == '2011' || $_GET['year'] == 'all')){
		$results['year'] = $_GET['year'];
	}
	// default to 2011
	else{
		$results['year'] = '2011'; 
	}
	
	// connect to server
	$link = mysql_connect('localhost', 'username', 'password');
	mysql_select_db("LastFM", $link);
	if (!$link) {
	//	$results['error'] = 'Could not connect to DB';
	//	echo json_encode($results);
		set_err('Could not connect to DB', $link);
		return;
	}
	function set_err($errstr, &$con){
		$results['error'] = $errstr;
		echo json_encode($results);
		mysql_close($con);
	}

	// get the artist name
	if (empty($_GET['artist'])){
		set_err('Artist parameter required', $link);
		return;
	}
	$results['data']['artist'] = $_GET['artist'];
	
	// see if artist is in DB
	$query = "SELECT * FROM artists WHERE artist_name='".$_GET['artist']."'";	
	$res = mysql_query($query, $link);
	if (!$res){
		set_err('Artist not found: '.$_GET['artist'], $link);
		return;
	}	
	else{
		$art = mysql_fetch_array($res);
		$results['data']['artist_id'] = $art['id'];
	}
	
	// deal with date limiting later
	// get totals
	$query = "SELECT city_id, SUM(listeners) as total FROM `artist_rank` WHERE artist_id=".$results['data']['artist_id']." and start_date >= ".$limits[$results['year']]['start']." and end_date <= ".$limits[$results['year']]['end']." group by city_id";
	$res = mysql_query($query, $link);
	while($row = mysql_fetch_array($res)){
		// get geocoordinates of city
		$geo_q = "SELECT * FROM cities WHERE city_id=".$row['city_id'];
	//	echo $geo_q;
		$geo_res = mysql_query($geo_q, $link);
		$geo_row = mysql_fetch_array($geo_res);
		$temp = array(
			'cid' => $row['city_id'],
			'city' => $geo_row['name'],
			'lat' => $geo_row['lat'],
			'long' => $geo_row['long'],		
			'listeners' => $row['total']						
		);
		// put into array
		array_push($results['data']['totals'], $temp);
	}

	
	// get min/max date range
	// "SELECT MIN( start_date ) as first_start, MIN(end_date) as first_end, MAX(start_date) as last_start, MAX( end_date ) as last_end FROM  `weeklychartrange` WHERE city_id ="
	
	$results['data']['total_cities'] = count($results['data']['totals']);
	$results['error'] = 'None';

	echo json_encode($results);
	mysql_close($link);
	
?>
