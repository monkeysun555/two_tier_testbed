	// var video1 = document.getElementById('video1');
	// var video2 = document.getElementById('video2');
    
    // function run() {
	var baseUrl1 = '../ET/';
	var initUrl1 = baseUrl1 + 'BT_init.mp4';
	var templateUrl1 = baseUrl1 + 'BT_$Number$.m4s';
	var sourceBuffer1;
	var index1 = 1;
	var numberOfChunks1 = 65;
	var video1 = document.getElementById('video1');

	var baseUrl2 = '../ET/';
	var initUrl2 = baseUrl2 + 'ET_VP_1_init.mp4';
	var templateUrl2 = baseUrl2 + 'ET_VP_$VPNumber$_$SegNumber$.m4s';
	var sourceBuffer2;
	var index2 = 1;
	var vpindex = 6;
	var numberOfChunks2 = 65;
	var video2 = document.getElementById('video2');
	var prelength1 = 10;
	var prelength2 = 2;
	var predownloaded1 = false;
	var predownloaded2 = false;
	var target1 = 10;
	var target2 = 2;


//----------Canvas-----------//
	var camera, scene, renderer;
	var texture_placeholder,
	isUserInteracting = false,
	onMouseDownMouseX = 0, onMouseDownMouseY = 0,
	lon = 0, onMouseDownLon = 0,
	lat = 0, onMouseDownLat = 0,
	phi = 0, theta = 0,
	distance = 50,
	onPointerDownPointerX = 0,
	onPointerDownPointerY = 0,
	onPointerDownLon = 0,
	onPointerDownLat = 0;
	var FovHistory = [];
	var fovlength = 50;  // fps == 50
	var vpalign = [];
	var nextTime = 0;
	// var nextVPquan = 6;
	vpalign.push([nextTime, vpindex]);
//----------Canvas-----------//


	if (!window.MediaSource) {
		console.error('No Media Source API available');
		// return;
	}


	var ms1 = new MediaSource();
	video1.src = window.URL.createObjectURL(ms1);
	ms1.addEventListener('sourceopen', onMediaSourceOpen1);

	var ms2 = new MediaSource();
	video2.src = window.URL.createObjectURL(ms2);
	ms2.addEventListener('sourceopen', onMediaSourceOpen2);
  
	function onMediaSourceOpen1() {
		sourceBuffer1 = ms1.addSourceBuffer('video/mp4; codecs="avc1.640033, mp4a.40.2"');
		// predownload1();
		sourceBuffer1.addEventListener('updateend', nextSegment1);
		GET1(initUrl1, appendToBuffer1);

		// video1.play();
	}

	function onMediaSourceOpen2() {
		sourceBuffer2 = ms2.addSourceBuffer('video/mp4; codecs="avc1.640032, mp4a.40.2"');
		// predownload2();
		sourceBuffer2.addEventListener('updateend', nextSegment2);
		GET2(initUrl2, appendToBuffer2);
		// video2.play();
	}

	// function predownload1(){
	// 	sourceBuffer1.addEventListener('updateend', nextSegment1);
	// }

	// function predownload2(){
	// 	sourceBuffer2.addEventListener('updateend', nextSegment2);
	// }

	function nextSegment1() {
		var url1 = templateUrl1.replace('$Number$', index1);
		GET1(url1, appendToBuffer1);
		index1++;
		if (index1 > prelength1) {
			sourceBuffer1.removeEventListener('updateend', nextSegment1);
			// sourceBuffer1.addEventListener('updateend', checkStatus);
			predownloaded1 = true;
			checkPredownload();
		}
	}


	function nextSegment2() {
		var url2 = templateUrl2.replace('$SegNumber$', index2);
		var url2 = url2.replace('$VPNumber$', vpindex);
		GET2(url2, appendToBuffer2);
		console.log('nextsegment2: ' + index2);
		index2++;
		if (index2 > prelength2) {
			sourceBuffer2.removeEventListener('updateend', nextSegment2);
			// sourceBuffer2.addEventListener('updateend', checkStatus);
			predownloaded2 = true;
			checkPredownload();
		}
	}

	function checkPredownload(){
		// console.log(predownloaded1, predownloaded2);
		if (predownloaded1 == true && predownloaded2 == true){
			sourceBuffer1.addEventListener('updateend', checkStatus);
			sourceBuffer2.addEventListener('updateend', checkStatus);
			// var length1 = calculateLength(video1);
			// var length2 = calculateLength(video2);
			// console.log(length1, length2);
			// addET();	
			nextTime = video2.buffered.end(0);
			console.log('start play');
			video1.play();
			video2.play();		
		} 
	}

	function addET(){
		vpalign.push([video2.buffered.end(0), vpindex]);
		console.log("before append, length is: " + video2.buffered.end(0));
	}

	function checkStatus(){
		// var url1 = templateUrl1.replace('$Number$', index1);
		// console.log(url1);		
		var length1 = calculateLength(video1);
		var length2 = calculateLength(video2);
		console.log('bt buffer is: ' + length1 + 'et buffer is: ' + length2);
		var safe1 = length1 - target1;
		var safe2 = length2 - target2;
		// console.log(safe1, safe2, video1.currentTime);
		var wait;
		var buffernum = 0;
		console.log('index1 is: ' + index1 + ' index2 is: ' + index2);
		if (safe1 < safe2 && index1 < numberOfChunks1){
			wait = safe1*1000;
			buffernum = 1;
		}
		else{
			wait = safe2*1000;
			buffernum = 2;
		}

		if (wait > 0){
			console.log('wait time is: '+ wait);
			setTimeout(checkStatus, wait + 50);
		}
		else{
			// console.log(buffernum, wait/1000.0, length1, length2);
			// console.log(FovHistory);
			if(buffernum == 1){
				var url1 = templateUrl1.replace('$Number$', index1);
				GET2(url1, appendToBuffer1);
				index1++;	
				if (index1 > numberOfChunks1) {
					sourceBuffer1.removeEventListener('updateend', checkStatus);
				}
			}
			else if(buffernum == 2){
				// var url2 = templateUrl2.replace('$Number$', index2);
				vpindex = predict();
				// predict(index2);
				var url2 = templateUrl2.replace('$SegNumber$', index2);
				var url2 = url2.replace('$VPNumber$', vpindex);				
				GET2(url2, appendToBuffer2);
				index2++;	
				console.log('status index is: ' + index2)
				if (index2 > numberOfChunks2) {
					sourceBuffer2.removeEventListener('updateend', checkStatus);
				}
			}
			else{
				console.log('error');
			}
		}

	}

	// function checkStatus2(){
	// 	var url2 = templateUrl2.replace('$Number$', index2);
	// 	console.log(url2);		
	// 	var length = calculateLength(video2);
	// 	console.log(length);
	// 	if (length < 10){
	// 		GET1(url1, appendToBuffer1);
	// 		index1++;
	// 	}
	// }

	function predict(){
		var trunList = truncate();
		var coefs = coef(trunList);
		var hor = calculateHor(coefs);
		// console.log(hor);
		var VPquan = quantize(hor);
		return VPquan;
	}

	function calculateHor(coefs){
		var time = video2.buffered.end(0) + 0.5;
		var prediction = coefs[0] + coefs[1] * time;
		return prediction;
	}

	function quantize(degree){
		// console.log(degree);
		var adjustDegree = (degree % 360);
		if (adjustDegree < 0){
			adjustDegree += 360;
		}
		adjustDegree += 15;
		// if (adjustDegree < 0){
		// 	adjustDegree += 360
		// }
		if (adjustDegree >= 360){
			adjustDegree -= 360
		}
		// console.log(adjustDegree);
		var quantizeNum = (Math.floor(adjustDegree/30) + 6)%12;
		if(quantizeNum == 0){
			quantizeNum += 12;
		}
		// console.log(quantizeNum);
		return quantizeNum;
	}

	function truncate(){
		var count, direction;
		var last = FovHistory[FovHistory.length-1][0];
		// console.log(last);
		var secondLast = FovHistory[FovHistory.length-2][0];
		var temp = secondLast;
		direction = Math.sign(last - secondLast);
		var tempDir = direction;
		count = 3;
		while(count <= FovHistory.length && tempDir == direction){
			tempDir = Math.sign(temp - FovHistory[FovHistory.length-count][0]);
			temp = FovHistory[FovHistory.length-count][0];
			count++;
		}
		var truncatedHis = FovHistory.slice(FovHistory.length-count+2, FovHistory.length);
		return truncatedHis;
	}

	function coef(data){
		// console.log(data);
		var x = [], y=[];
		var sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;
		for (var i = 0; i < data.length; i++){
			x.push(data[i][1]);
			sum_x += data[i][1];
			y.push(data[i][0]);
			sum_y += data[i][0];
			sum_xy += data[i][1]*data[i][0];
			sum_xx += data[i][1]*data[i][1];
		}

		m_x = sum_x/data.length;
		m_y = sum_y/data.length;

		SS_xy = sum_xy - data.length*m_y*m_x;
		SS_xx = sum_xx - data.length*m_x*m_x;

		var b_1 = SS_xy / SS_xx
		var b_0 = m_y - b_1*m_x
		// console.log(b_1, b_0, data, video1.currentTime);
		return [b_0, b_1];
	}


	function appendToBuffer1(videoChunk1) {
		if (videoChunk1) {
			sourceBuffer1.appendBuffer(new Uint8Array(videoChunk1));
		}
		console.log(video1.buffered.end(0));
	}

	function GET1(url1, callback) {
		var xhr1 = new XMLHttpRequest();
		xhr1.open('GET', url1);
		xhr1.responseType = 'arraybuffer';
		xhr1.onload = function(e) {
			if (xhr1.status != 200) {
				console.warn('Unexpected status code ' + xhr1.status + ' for ' + url1);
				return false;
			}
			callback(xhr1.response);
		};
		xhr1.send();
	}


	function appendToBuffer2(videoChunk2) {
		if (videoChunk2) {
			if(index2 > 2) {
				// console.log(index2)
				addET();
			}
			sourceBuffer2.appendBuffer(new Uint8Array(videoChunk2));
			console.log("after append et length is: " + video2.buffered.end(0))
		}
	}

	function GET2(url2, callback) {
		var xhr2 = new XMLHttpRequest();
		xhr2.open('GET', url2);
		xhr2.responseType = 'arraybuffer';
		xhr2.onload = function(e) {
			if (xhr2.status != 200) {
				console.warn('Unexpected status code ' + xhr2.status + ' for ' + url2);
				return false;
			}
			callback(xhr2.response);
		};
		xhr2.send();
	}	
    // };

	function calculateLength(video) {
		// console.log(video.buffered.end(0), video.currentTime)
		if(video.buffered.end){
			var bufferEnd = video.buffered.end(0);
			var current = video.currentTime;
			// console.log(current, bufferEnd);
			var bufferLength = bufferEnd - current;
			// console.log('exist');
			return bufferLength;
		}
		else {
			// console.log('not exist');
			return -1;
		}

	}

//---------------------------Canvas--------------------------//

	document.addEventListener('DOMContentLoaded', function(){

		var canvas1 = document.getElementById('c1');
		var context1 = canvas1.getContext('2d');
		
		var ew, eh;
		
		video1.addEventListener('play', function()
		{
			ew = video1.clientWidth;
			eh = video1.clientHeight;
			canvas1.width = ew;
			canvas1.height = eh;

			init();
			draw(video1, video2, context1, ew, eh);
			// trackFov();

		},false);
	},false);

	function init() {

		var container, mesh;

		container = document.getElementById( 'container' );

		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
		camera.target = new THREE.Vector3( 0, 0, 0 );

		scene = new THREE.Scene();

		var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
		// invert the geometry on the x-axis so that all of the faces point inward
		geometry.scale( - 1, 1, 1 );


		var canvas1 = document.getElementById( 'c1' );
		var texture = new THREE.CanvasTexture( canvas1 )

		texture.minFilter = THREE.LinearFilter;
		texture.format = THREE.RGBFormat;

		var material   = new THREE.MeshBasicMaterial( { map : texture } );

		mesh = new THREE.Mesh( geometry, material );

		scene.add( mesh );

		renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( renderer.domElement );

		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		document.addEventListener( 'wheel', onDocumentMouseWheel, false );
		window.addEventListener( 'resize', onWindowResize, false );

	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	function onDocumentMouseDown( event ) {

		event.preventDefault();

		isUserInteracting = true;

		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;

		onPointerDownLon = lon;
		onPointerDownLat = lat;

	}

	function onDocumentMouseMove( event ) {
		if ( isUserInteracting === true ) {
			lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
			lat = ( onPointerDownPointerY - event.clientY ) * 0.1 + onPointerDownLat;
		}
	}

	function onDocumentMouseUp( event ) {

		isUserInteracting = false;

	}

	function onDocumentMouseWheel( event ) {

		distance += event.deltaY * 0.05;

		distance = THREE.Math.clamp( distance, 1, 50 );

	}

	function update() {

		lat = Math.max( - 85, Math.min( 85, lat ) );
		phi = THREE.Math.degToRad( 90 - lat );
		theta = THREE.Math.degToRad( lon );

		// console.log(lon), record the lon history
		if (FovHistory.length >= fovlength){
			FovHistory.shift();
		}
		FovHistory.push([lon, Math.round(video1.currentTime * 100)/ 100]);

		camera.position.x = distance * Math.sin( phi ) * Math.cos( theta );
		camera.position.y = distance * Math.cos( phi );
		camera.position.z = distance * Math.sin( phi ) * Math.sin( theta );

		camera.lookAt( camera.target );

		var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
		geometry.scale( - 1, 1, 1 );

		var canvas1 = document.getElementById( 'c1' );
		var texture = new THREE.CanvasTexture( canvas1 );
		var material   = new THREE.MeshBasicMaterial( { map : texture } );

		var scene = new THREE.Mesh( geometry, material );

		renderer.render(scene, camera);
		geometry.dispose();
        geometry = undefined;

        material.dispose();
        material = undefined;

        texture.dispose();
        texture = undefined;

	}

	function draw(video1,video2,c1,w,h) 
	{
		if (video1.currentTime >= nextTime){
			// console.log(nextTime, video1.currentTime, vpalign);
			var nextVP = vpalign.shift();
			// console.log(nextVP);
			if (nextVP){
				nextTime = nextVP[0];
				nextVPquan = nextVP[1];
				// console.log(nextTime, nextVPquan)
			}
			else{
				console.log('error');
			}
		}

		if(video1.paused || video1.ended) {
		    // setTimeout(draw,20,video1,video2,c1,w,h);
		    return
		}
	
		c1.drawImage(video1,0,0, w,h);

		// adjust here
		c1.drawImage(video2, ((nextVP*30)%360), 0, 225, h);
		// c1.drawImage(video1,0,0,w, h);

		update();
		if(video1.buffered.length > 0){
			// console.log(video1.currentTime,video1.buffered.end(0), video1.seekable);
		}
		// console.log(video2.buffered.length, video2.seekable);
		calculateLength(video1);

	    setTimeout(draw,20,video1,video2,c1,w,h);
	}

	// run();
