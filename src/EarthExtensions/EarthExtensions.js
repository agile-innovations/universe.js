
var SSI = SSI || {};

SSI.EarthExtensions = function(universe) {
	var earthExtensions = this;
	
	// constants
    var earthSphereRadius = 6371;

	var centerPoint = new THREE.Vector3(0,0,0);
	
	// have to do this this way since the decision of whether to show or hide it has to be made at draw time
    var enableControlLines = undefined;

    universe.setObjectInLibrary("default_ground_object_geometry", new THREE.SphereGeometry(300, 20, 10));
    universe.setObjectInLibrary("default_ground_object_material", new THREE.MeshLambertMaterial({color : 0x00CC00}));

    universe.setObjectInLibrary("default_ground_track_material", new THREE.MeshBasicMaterial({
        color : 0xCC0000,
        transparent:true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    }));

    universe.setObjectInLibrary("default_sensor_projection_material",new THREE.MeshBasicMaterial({
         color: 0xffaa00,
         transparent: true,
         blending: THREE.AdditiveBlending,
         overdraw: true,
         opacity: 0.15
            }));

    universe.setObjectInLibrary("default_orbit_line_material", new THREE.LineBasicMaterial({
                color : 0x990000,
                opacity : 1
            }));
            
    universe.setObjectInLibrary("default_ground_object_tracing_line_material", new THREE.LineBasicMaterial({
                color : 0x009900,
                opacity : 1
            }));

	// earthOptions:
    // image
    //
    this.addEarth = function(earthOptions) {
        var earthSphereSegments = 40, earthSphereRings = 30;

        // Create the sphere
        var geometry = new THREE.SphereGeometry(earthSphereRadius, earthSphereSegments, earthSphereRings);

        // Define the material to be used for the sphere surface by pulling the image and wrapping it around the sphere
        var shader = {
            uniforms : {
                'texture' : {
                    type : 't',
                    value : 0,
                    texture : null
                }
            },
            vertexShader : ['varying vec3 vNormal;', 'varying vec2 vUv;', 'void main() {', 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', 'vNormal = normalize( normalMatrix * normal );', 'vUv = uv;', '}'].join('\n'),
            fragmentShader : ['uniform sampler2D texture;', 'varying vec3 vNormal;', 'varying vec2 vUv;', 'void main() {', 'vec3 diffuse = texture2D( texture, vUv ).xyz;', 'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );', 'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );', 'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );', '}'].join('\n')
        };
        var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

        uniforms['texture'].texture = THREE.ImageUtils.loadTexture(earthOptions.image);

        var material = new THREE.ShaderMaterial({
            uniforms : uniforms,
            vertexShader : shader.vertexShader,
            fragmentShader : shader.fragmentShader
        });

        var earthMesh = new THREE.Mesh(geometry, material);

        universe.addObject({
            id : "earth",
            objectName : "earth",
            update : function(elapsedTime) {
                var rotationAngle = CoordinateConversionTools.convertTimeToGMST(universe.getCurrentUniverseTime());
                earthMesh.rotation.y = rotationAngle * (2 * Math.PI / 360);
            },
            draw : function() {
                universe.draw(this.id, earthMesh, false);
            }
        });
    };
    
    this.addMoon = function(moonOptions) {
        var moonSphereSegments = 40, moonSphereRings = 30;
        var moonSphereRadius = 1737.1;
        var initialStateVector = {x: -360680.9359251, y: -42332.8629642, z: -30945.6526294, x_dot: 0.1634206, y_dot: -1.0634127, z_dot:  0.0412856, epoch: moonOptions.epoch};

        // Create the sphere
        var geometry = new THREE.SphereGeometry(moonSphereRadius, moonSphereSegments, moonSphereRings);

        // Define the material to be used for the sphere surface by pulling the image and wrapping it around the sphere
        var shader = {
            uniforms : {
                'texture' : {
                    type : 't',
                    value : 0,
                    texture : null
                }
            },
            vertexShader : ['varying vec3 vNormal;', 'varying vec2 vUv;', 'void main() {', 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', 'vNormal = normalize( normalMatrix * normal );', 'vUv = uv;', '}'].join('\n'),
            fragmentShader : ['uniform sampler2D texture;', 'varying vec3 vNormal;', 'varying vec2 vUv;', 'void main() {', 'vec3 diffuse = texture2D( texture, vUv ).xyz;', 'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );', 'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );', 'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );', '}'].join('\n')
        };
        var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

        uniforms['texture'].texture = THREE.ImageUtils.loadTexture(moonOptions.image);

        var material = new THREE.ShaderMaterial({
            uniforms : uniforms,
            vertexShader : shader.vertexShader,
            fragmentShader : shader.fragmentShader
        });

        var moonMesh = new THREE.Mesh(geometry, material);

        universe.addObject({
            id : "moon",
            objectName : "moon",
            stateVector: initialStateVector,
            update : function(elapsedTime) {
                var eci = new ECICoordinates(
                        this.stateVector.x,
                        this.stateVector.y,
                        this.stateVector.z,
                        this.stateVector.x_dot,
                        this.stateVector.y_dot,
                        this.stateVector.z_dot
                    );
                    
                    var time = new Date(universe.getCurrentUniverseTime());
                    var elapsedTime = (time.getTime() - this.stateVector.epoch.getTime())/1000; // seconds
                   
                    var propagatedValue = OrbitPropagator.propagateOrbit(eci, elapsedTime, 100, this.stateVector.epoch);
                    var convertedLocation = eciTo3DCoordinates({x: propagatedValue.x, y: propagatedValue.y, z: propagatedValue.z });
                    //console.log("propagatedValue: " + JSON.stringify(propagatedValue) + " elapsedTime: " + elapsedTime);
                    moonMesh.position = {x: convertedLocation.x, y: convertedLocation.y, z: convertedLocation.z }
                    
            },
            draw : function() {
                universe.draw(this.id, moonMesh, false);
            }
        });
    }

	// spaceObject:
    // id
    // stateVector
    //   time
    //   x, y, z
    // objectName
    // propagator
    // modelId
    // showPropogationLine
    // showGroundTrackPoint
    this.addSpaceObject = function(spaceObject) {
        var objectGeometry, material;
        universe.getObjectFromLibraryById(spaceObject.modelId, function(retrieved_geometry) {
            objectGeometry = retrieved_geometry;
            universe.getObjectFromLibraryById("default_material", function(retrieved_material) {
                material = retrieved_material;

                objectGeometry.applyMatrix( new THREE.Matrix4().setRotationFromEuler( new THREE.Vector3( 0, Math.PI, 0 ) ));
                var objectModel = new THREE.Mesh(objectGeometry, material);

                universe.addObject({
                    id : spaceObject.id,
                    objectName : spaceObject.objectName,
                    update : function(elapsedTime) {
                        // need to pass a time to the propagator
                        var convertedLocation = eciTo3DCoordinates(spaceObject.propagator());
                        if(convertedLocation != undefined) {
                            objectModel.position.set(convertedLocation.x, convertedLocation.y, convertedLocation.z);

                            //http://mrdoob.github.com/three.js/examples/misc_lookat.html
                            objectModel.lookAt(centerPoint);
                        }

                    },
                    draw : function() {
                        universe.draw(this.id, objectModel, false);
                        earthExtensions.showModelForId(spaceObject.showVehicle, this.id);
                    }
                });

                earthExtensions.addPropogationLineForObject(spaceObject);
                earthExtensions.showOrbitLineForObject(spaceObject.showPropogationLine, spaceObject.id);

                earthExtensions.addGroundTrackPointForObject(spaceObject);
                earthExtensions.showGroundTrackForId(spaceObject.showGroundTrackPoint, spaceObject.id);

                earthExtensions.addSensorProjection(spaceObject);
                earthExtensions.showSensorProjectionForId(spaceObject.showSensorProjections, spaceObject.id);
                
                earthExtensions.addClosestGroundObjectTracingLine(spaceObject);
                // Have to do the below on draw for the control line since it creates a new line every draw
                // earthExtensions.showControlLineForId(spaceObject.showControlLine, spaceObject.id);
            });
        });
    };
    // groundObject:
    // id
    // propagator
    // object
    this.addGroundObject = function(groundObject) {
        var objectGeometry, objectMaterial, material;
        if(!groundObject.modelId) {
            groundObject.modelId = "default_ground_object_geometry";
            material = "default_ground_object_material";
        }
        else {
            material = "default_material";
        }
        universe.getObjectFromLibraryById(groundObject.modelId, function(retrieved_geometry) {
            objectGeometry = retrieved_geometry;
            universe.getObjectFromLibraryById(material, function(retrieved_material) {
                objectMaterial = retrieved_material;
                objectGeometry.applyMatrix( new THREE.Matrix4().setRotationFromEuler( new THREE.Vector3( Math.PI / 2, Math.PI, 0 ) ));
                var groundObjectMesh = new THREE.Mesh(objectGeometry, objectMaterial);

                universe.addObject({
                    id : groundObject.id,
                    objectName : groundObject.objectName,
                    currentLocation: undefined,
                    update : function(elapsedTime) {
                        // check earth rotation and update location
                        var position = eciTo3DCoordinates(groundObject.propagator());
                        groundObjectMesh.position.set(position.x, position.y, position.z);
                        this.currentLocation = {x: position.x, y: position.y, z: position.z};

                        //http://mrdoob.github.com/three.js/examples/misc_lookat.html
                        var scaled_position_vector = new THREE.Vector3(position.x, position.y, position.z);

                        // arbitrary size, just a point along the position vector further out for the object to lookAt
                        scaled_position_vector.multiplyScalar(1.4);

                        groundObjectMesh.lookAt(scaled_position_vector);
                    },
                    draw : function() {
                        universe.draw(this.id, groundObjectMesh, true);
                    }
                });
            });
        });
    };

	this.addGroundTrackPointForObject = function(object) {
        var objectGeometry, objectMaterial;
        universe.getObjectFromLibraryById("default_ground_object_geometry", function(retrieved_geometry) {
            objectGeometry = retrieved_geometry;
            universe.getObjectFromLibraryById("default_ground_track_material", function(retrieved_material) {
                objectMaterial = retrieved_material;


                var groundObjectMesh = new THREE.Mesh(objectGeometry, objectMaterial);

                universe.addObject({
                    id : object.id + "_groundPoint",
                    objectName : object.objectName,
                    update : function(elapsedTime) {
                        var objectLocation = eciTo3DCoordinates(object.propagator(undefined, false));
                        if(objectLocation != undefined) {
                            var vector = new THREE.Vector3(objectLocation.x, objectLocation.y, objectLocation.z);

                            // move the vector to the surface of the earth
                            vector.multiplyScalar(earthSphereRadius / vector.length())

                            groundObjectMesh.position.copy(vector);
                        }
                    },
                    draw : function() {
                        universe.draw(this.id, groundObjectMesh, true);
                    }
                });
            });
        });
    }

    // method to add an orbit line
    this.addPropogationLineForObject = function(object) {
        var objectGeometry, objectMaterial;
        objectGeometry = new THREE.Geometry();
        universe.getObjectFromLibraryById("default_orbit_line_material", function(retrieved_material) {
            objectMaterial = retrieved_material;
            var timeToPropogate = new Date(universe.getCurrentUniverseTime());
            var loopCount = 1440;

            // draw a vertex for each minute in a 24 hour period
            // dropped this to a vertex for every 5 minutes.  This seems to be about the max that you can use for a LEO
            // and still look decent.  HEOs and GEOs look fine with much greater spans.  For performance reasons, may want
            // to make this a param that can be set per vehicle
            for(var j = 0; j < loopCount; j += 5) {
                var convertedLocation = eciTo3DCoordinates(object.propagator(timeToPropogate, false));
                if(convertedLocation != undefined) {
                    var vector = new THREE.Vector3(convertedLocation.x, convertedLocation.y, convertedLocation.z);
                    objectGeometry.vertices.push(new THREE.Vertex(vector));
                }

                timeToPropogate.setMinutes(timeToPropogate.getMinutes() + 5);
            }

            var lineS = new THREE.Line(objectGeometry, objectMaterial);

            universe.addObject({
                id : object.id + "_propogation",
                objectName : object.objectName,
                update : function(elapsedTime) {
                // add points onto the end of the track?
                },
                draw : function() {
                    universe.draw(this.id, lineS, false);
                }
            });
        });
    }

    this.addSensorProjection = function(object) {

        var objectGeometry, objectMaterial;

        // Determine the object's location in 3D space
        var objectLocation = eciTo3DCoordinates(object.propagator(undefined, false));
        if(objectLocation != undefined) {
            // Create a SensorPattern
            var sensor_size = 1;
            objectGeometry = new SensorPatternGeometry(sensor_size);

            // TODO: this code is pretty bad;  the beam size will stay the same based on initial distance
            // from the earth.  so it's really wrong
            var initial_pos = new THREE.Vector3(objectLocation.x, objectLocation.y, objectLocation.z);
            var base_length = initial_pos.length() - earthSphereRadius;
            var cone_width_scale = 0.15;

            //17431
            
            // if the vehicle starts too close to the earth, make it a nominal length instead (i.e. a Molniya orbit)

            universe.getObjectFromLibraryById("default_sensor_projection_material", function(retrieved_material) {
                objectMaterial = retrieved_material;

                var sensorProjection = new THREE.Mesh(objectGeometry, objectMaterial);

                sensorProjection.doubleSided=true;

                universe.addObject({
                    id : object.id + "_sensorProjection",
                    objectName : object.objectName,
                    update : function(elapsedTime) {

                        var objectLocation = eciTo3DCoordinates(object.propagator(undefined, false));

                        if(objectLocation != undefined) {
                            var vector = new THREE.Vector3(objectLocation.x, objectLocation.y, objectLocation.z);

                            // Move the tip of the sensor projection to the vehicle's location
                            sensorProjection.position.copy(vector);

                            // the sensor projections are along the z axis and a length of 1, so scaling it
                            // arbitarily along z will extend the length
                            sensorProjection.scale.z = vector.length() - earthSphereRadius + 200;
                            
                            // sensor_size is the projection dimension at the earth's surface (or at least the end of the cone)
                            // the projection length of the vector is 1
                            //sensorProjection.scale.x = sensorProjection.scale.y = sensorProjection.scale.z * (1 / base_length) ;
                            sensorProjection.scale.x = sensorProjection.scale.y = sensorProjection.scale.z * cone_width_scale ;
                            //logger.debug("vec length:" + vector.length() +"    base_length:" + base_length + "   sensor scale: " + sensorProjection.scale.x);

                            var sensor_boresite = new THREE.Vector3(0,0,0);
                            sensorProjection.lookAt(sensor_boresite);


                        }
                    },
                    draw : function() {
                        universe.draw(this.id, sensorProjection, false);
                    }
                });
            });
        }
    }
    
    this.addClosestGroundObjectTracingLine = function(object) {
        var objectGeometry, objectMaterial;
        
        
        universe.getObjectFromLibraryById("default_ground_object_tracing_line_material", function(retrieved_material) {
            objectMaterial = retrieved_material;

            var line = undefined;
            universe.addObject({
                id : object.id + "_controlLine",
                objectName : object.objectName,
                update : function(elapsedTime) {
                    
                    var objectLocation = eciTo3DCoordinates(object.propagator(undefined, false));
                    
                    var closestGroundObject = findClosestGroundObject(objectLocation);
                         
                    if(closestGroundObject != undefined) {
                        objectGeometry = new THREE.Geometry();
                        var vector = new THREE.Vector3(objectLocation.x, objectLocation.y, objectLocation.z);
                        objectGeometry.vertices.push(new THREE.Vertex(vector));
                        
                        var vector2 = new THREE.Vector3(closestGroundObject.currentLocation.x, closestGroundObject.currentLocation.y, closestGroundObject.currentLocation.z);
                        objectGeometry.vertices.push(new THREE.Vertex(vector2));
                        
                        line = new THREE.Line(objectGeometry, objectMaterial);
                    }
                },
                draw : function() {
                    universe.unDraw(this.id);
                    if(line != undefined) {
                        universe.draw(this.id, line, false);
                        
                        //TODO: this is not perfect.  It does not allow the vehicle to override the global setting as the other settings do
                        if(enableControlLines != undefined) {
                            earthExtensions.showControlLineForId(enableControlLines, object.id);
                        }
                        else {
                            earthExtensions.showControlLineForId(object.showControlLine, object.id);                            
                        }

                    }
                }
            });
        });
    }
    
    function findClosestGroundObject(location) {
        var location_vector = new THREE.Vector3(location.x, location.y, location.z);

        // move the vector to the surface of the earth
        location_vector.multiplyScalar(earthSphereRadius / location_vector.length())
        
        return findClosestObject(location_vector);
    }
    
    function findClosestObject(location_vector) {
        var graphicsObjects = universe.getGraphicsObjects();
        
        var closestDistance = undefined;
        var closestObject = undefined;
        
        for(var i in graphicsObjects) {
            if(graphicsObjects[i].currentLocation != undefined) {
                var vector = new THREE.Vector3(graphicsObjects[i].currentLocation.x, graphicsObjects[i].currentLocation.y, graphicsObjects[i].currentLocation.z);
                var distance_to = vector.distanceTo(location_vector);
                if(closestDistance == undefined || distance_to < closestDistance) {
                    closestObject = graphicsObjects[i];
                    closestDistance = distance_to;
                }
            }
        }
        
        return closestObject;
    }
    
    this.showAllOrbitLines = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_propogation") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    }

    this.showOrbitLineForObject = function(isEnabled, id) {
        logger.debug("in show orbit lines " + isEnabled);
        universe.showObject(id + "_propogation", isEnabled);
    }

    this.showModelForId = function(isEnabled, id) {
        logger.debug("show/hiding vehicle model " + isEnabled);
        universe.showObject(id, isEnabled);
    }
    
    this.showAllGroundTracks = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_groundPoint") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    }

    this.showGroundTrackForId = function(isEnabled, id) {
        logger.debug("show/hiding groundTrack, isEnabled: " + isEnabled + " id: " + id);
        universe.showObject(id + "_groundPoint", isEnabled);
    }
    
    this.showAllSensorProjections = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_sensorProjection") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    }

    this.showSensorProjectionForId = function(isEnabled, id) {
        //console.log("show/hiding sensorProjection");
        universe.showObject(id + "_sensorProjection", isEnabled);
    }
    
    this.showAllControlLines = function(isEnabled) {
        enableControlLines = isEnabled;
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_controlLine") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    }
    
    this.showControlLineForId = function(isEnabled, id) {
        universe.showObject(id + "_controlLine", isEnabled);
    }

    this.removeAllExceptEarthAndMoon = function() {
        var graphicsObjects = universe.getGraphicsObjects();
        
        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id != "earth" && graphicsObjects[i].id != "moon") {
                universe.removeObject(graphicsObjects[i].id);
            }
        }
    }

	this.setup = function() {
		this.removeAllExceptEarthAndMoon();
		universe.setup();
	}

    // Compare these two websites for details on why we have to do this:
    // http://celestrak.com/columns/v02n01/
    // http://stackoverflow.com/questions/7935209/three-js-3d-coordinates-system
    function eciTo3DCoordinates(location) {
        if(location == undefined) {
            return undefined;
        }
        return {
            x : -location.x,
            y : location.z,
            z : location.y
        };
    }
}