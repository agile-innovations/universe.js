var SSI = SSI || {};

SSI.Core3D = function(container) {
	// Variables used to draw the 3D elements
	var camera, scene, projector, renderer, w, h;
	var vector, animate;

	var overRenderer;

	// Constants for zooming, rotation, etc.
	var curZoomSpeed = 0;

	var mouse = {
		x : 0,
		y : 0
	}, mouseOnDown = {
		x : 0,
		y : 0
	};
	var rotation = {
		x : 0,
		y : 0
	}, target = {
		x : Math.PI * 3 / 2,
		y : Math.PI / 6.0
	}, targetOnDown = {
		x : 0,
		y : 0
	};

	// set initial distance
	var distance = 50000, distanceTarget = 50000;
	var PI_HALF = Math.PI / 2;

	var maxZoom = 150000;
	var minZoom = 10000;

	var drawnObjects = new Array();

	function init() {
		w = container.offsetWidth || window.innerWidth;
		h = container.offsetHeight || window.innerHeight;

		setupRenderer();

		// Field of View (View Angle)
		// Ratio between width and height, has to match aspect of CanvasRenderer
		// Near, Far
		camera = new THREE.PerspectiveCamera(30, w / h, 1, 315000);

		camera.position.z = distance;
		vector = new THREE.Vector3();

		// Scene into which the earth and other objects are displayed
		scene = new THREE.Scene();

		addEventListeners();

		animate();
	}

	function setupRenderer() {
		projector = new THREE.Projector();
		renderer = new THREE.WebGLRenderer({
			antialias : true
		});
		renderer.autoClear = false;
		renderer.setClearColorHex(0x000000, 0.0);
		renderer.setSize(w, h);

		renderer.domElement.style.position = 'absolute';

		container.appendChild(renderer.domElement);
	}

	function addEventListeners() {
		// Add event listeners for rotating, zooming, etc.

		container.addEventListener('mousedown', onMouseDown, false);

		container.addEventListener('mousewheel', onMouseWheel, false);

		document.addEventListener('keydown', onDocumentKeyDown, false);

		window.addEventListener('resize', onWindowResize, false);

		container.addEventListener('mouseover', function() {
			overRenderer = true;
		}, false);

		container.addEventListener('mouseout', function() {
			overRenderer = false;
		}, false);
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
	}

	function render() {
		zoom(curZoomSpeed);

		rotation.x += (target.x - rotation.x) * 0.1;
		rotation.y += (target.y - rotation.y) * 0.1;
		distance += (distanceTarget - distance) * 0.3;

		camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
		camera.position.y = distance * Math.sin(rotation.y);
		camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
		camera.lookAt(scene.position);

		vector.copy(camera.position);

		scaleDrawnObjects();

		renderer.clear();
		renderer.render(scene, camera);
	}

	function scaleDrawnObjects() {
		for(var i in drawnObjects) {
			if(drawnObjects[i].scale == true) {
				var objectPosition = drawnObjects[i].shape.position;
				var xDiff = objectPosition.x - camera.position.x;
				var yDiff = objectPosition.y - camera.position.y;
				var zDiff = objectPosition.z - camera.position.z;
				var distanceFromCamera = Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
				var scaleFactor = distanceFromCamera / (6371 * 7);
				drawnObjects[i].shape.scale.x = drawnObjects[i].shape.scale.y = drawnObjects[i].shape.scale.z = scaleFactor;
			}
		}
	}

	// Stock Behaviors like rotating and zooming
	function onMouseDown(event) {
		event.preventDefault();

		container.addEventListener('mousemove', onMouseMove, false);
		container.addEventListener('mouseup', onMouseUp, false);
		container.addEventListener('mouseout', onMouseOut, false);

		mouseOnDown.x = -event.clientX;
		mouseOnDown.y = event.clientY;

		targetOnDown.x = target.x;
		targetOnDown.y = target.y;

		container.style.cursor = 'move';
	}

	function onMouseMove(event) {
		mouse.x = -event.clientX;
		mouse.y = event.clientY;

		var zoomDamp = distance / (35000);

		target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
		target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

		target.y = target.y > PI_HALF ? PI_HALF : target.y;
		target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
	}

	function onMouseUp(event) {
		event.preventDefault();

		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
		container.style.cursor = 'auto';
	}

	function onMouseOut(event) {
		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
	}

	function onMouseWheel(event) {
		event.preventDefault();
		if(overRenderer) {
			zoom(event.wheelDeltaY * (10));
		}
		return false;
	}

	function onDocumentKeyDown(event) {
		switch (event.keyCode) {
			case 38:
				zoom(3200);
				event.preventDefault();
				break;
			case 40:
				zoom(-3200);
				event.preventDefault();
				break;
		}
	}

	function onWindowResize(event) {
		logger.debug('resize');
		w = container.offsetWidth || window.innerWidth;
        h = container.offsetHeight || window.innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	}

	function zoom(delta) {
		distanceTarget -= delta;
		distanceTarget = distanceTarget > maxZoom ? maxZoom : distanceTarget;
		distanceTarget = distanceTarget < minZoom ? minZoom : distanceTarget;
	}

	// Priviledged Methods
	this.draw = function(id, shape, scale) {
		if(drawnObjects[id] == undefined) {
			logger.debug(" adding and drawing: " + id);
			scene.add(shape);
			drawnObjects[id] = {
				shape : shape,
				scale : scale
			};
		}
	}
	
	this.showObject = function(id) {
		// if object exists in drawnObjects then add back to scene
		if (drawnObjects[id] != undefined) {
	        logger.debug("adding shape back to scene for id " + id);
		    scene.add(drawnObjects[id].shape);	
		}
	}
	
	this.hideObject = function(id) {
		if (drawnObjects[id] != undefined) {
			logger.debug("removing object from scene with id: " + id);
			scene.remove(drawnObjects[id].shape);
		}
	}
	
	init();

	return this;

};
