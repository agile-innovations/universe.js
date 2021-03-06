/*jslint browser: true, sloppy: true */
var Utilities = {
    get_random_color: function () {
        var letters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
            color = '0x',
            i;
        for (i = 0; i < 6; i += 1) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    },

    /**
        Converts ECI to THREE.js 3D coordinate system. Compare these two websites for details on why we have to do this:
        http://celestrak.com/columns/v02n01/
        http://stackoverflow.com/questions/7935209/three-js-3d-coordinates-system
        @private
	*/
    eciTo3DCoordinates: function (location, earthExtensions) {
        if (!location) {
            return undefined;
        }

        /*
         *  z' = z*cos q - x*sin q
         *  x' = z*sin q + x*cos q
         *  y' = y
         *  x = -location.x
         *  y = location.z
         *  z = location.y
         */
        return {
            x : (location.y) * Math.sin(-earthExtensions.rotationOffsetFromXAxis) + (-location.x) * Math.cos(-earthExtensions.rotationOffsetFromXAxis),
            y : location.z,
            z : location.y * Math.cos(-earthExtensions.rotationOffsetFromXAxis) - (-location.x) * Math.sin(-earthExtensions.rotationOffsetFromXAxis),
            vx : -location.vx,
            vy : location.vz,
            vz : location.vy
        };
    },

    threeDToEciCoordinates: function (location, earthExtensions) {
        if (!location) {
            return undefined;
        }

        /*
         *  z' = z*cos q - x*sin q
         *  x' = z*sin q + x*cos q
         *  y' = y
         *  x = -location.x
         *  y = location.z
         *  z = location.y
         */
        return {
            x : (location.y) * Math.sin(earthExtensions.rotationOffsetFromXAxis) + (-location.x) * Math.cos(earthExtensions.rotationOffsetFromXAxis),
            y : location.z,
            z : location.y * Math.cos(earthExtensions.rotationOffsetFromXAxis) - (-location.x) * Math.sin(earthExtensions.rotationOffsetFromXAxis),
            vx : -location.vx,
            vy : location.vz,
            vz : location.vy
        };
    }
};