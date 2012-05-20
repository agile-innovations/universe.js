var RungeKuttaFehlbergPropagator = {

    /**
     *
     *
     * @param state                    double[]
     * @param elapsedTime              double
     * @param dt                       double
     * @param timeAtStartOfPropagation date
     *
     * @returns Array of doubles
     */
    rungeKuttaFehlbergIntegrator: function(state, elapsedTime, dt, timeAtStartOfPropagation)
    {
        //fifth order runge-kutta-fehlberg integrator
        var tempState = state;

        var f = [];          //array of doubles[9]
        var deltaState = []; //array of doubles[9]
        var dtPrime = 0.0;            //double

        var N = 1;  //int
        var h = dt; //double

        //if the timestep is too big, reduce it to a smaller timestep and loop through the updates at the smaller timestep to add up to the total timestep
        var maxResolution = 0.02; //double

        if (dt > maxResolution)
        {
            h = maxResolution;
        }

        var newMilliseconds = timeAtStartOfPropagation.getTime(); //long

        N = elapsedTime / h;

        var j = 1;

        for (j = 1; j <= N; j++)
        {
            newMilliseconds = newMilliseconds + (h * 1000.0); //keep in millis
            var simTime = new Date(newMilliseconds);
            GST = CoordinateConversionTools.convertTimeToGMST(simTime); //double

            var k1 = []; //double[9]
            var k2 = []; //double[9]
            var k3 = []; //double[9]
            var k4 = []; //double[9]
            var k5 = []; //double[9]
            var k6 = []; //double[9]

            //for loop counter
            var i = 0;

            //build k1
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i];
            }

            dtPrime = h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k1[i] = h * f[i];
            }

            //build k2
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + 0.25 * k1[i];
            }

            dtPrime = 0.25 * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k2[i] = h * f[i];
            }

            //build k3
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + (3.0 / 32.0) * k1[i] + (9.0 / 32.0) * k2[i];
            }

            dtPrime = 0.375 * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k3[i] = h * f[i];
            }

            //build k4
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + ((1932.0 / 2197.0) * k1[i]) -
                    ((7200.0 / 2197.0) * k2[i]) + ((7296.0 / 2197.0) * k3[i]);
            }

            dtPrime = 0.9230769230769231 * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k4[i] = h * f[i];
            }

            //build k5
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + ((439.0 / 216.0) * k1[i]) -
                    (8.0 * k2[i]) + ((3680.0 / 513.0) * k3[i]) - ((845.0 / 4104.0) * k4[i]);
            }

            dtPrime = h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k5[i] = h * f[i];
            }

            //build k6
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] - ((8.0 / 27.0) * k1[i]) +
                    ((2.0) * k2[i]) - ((3544.0 / 2565.0) * k3[i]) +
                    ((1859.0 / 4104.0) * k4[i]) - ((11.0 / 40.0) * k5[i]);
            }

            dtPrime = (0.5) * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k6[i] = h * f[i];
            }

            //generate the estimate for this step in time
            for (i = 0; i < 9; i++)
            {
                //http://en.wikipedia.org/wiki/Runge%E2%80%93Kutta%E2%80%93Fehlberg_method
                tempState[i] = tempState[i] + ((16.0 / 135.0) * k1[i]) +
                    ((6656.0 / 12825.0) * k3[i]) + ((28561.0 / 56430.0) * k4[i]) -
                    ((9.0 / 50.0) * k5[i]) + ((2.0 / 55.0) * k6[i]);
            }
        }

        return tempState;
    },

    /**
     *
     *
     * @param state double[]
     * @param dt    double
     * @param GST   double
     *
     * @returns double[]
     */
    generateStateUpdate: function(state, dt, GST)
    {
        //state is 9x1
        //state structure is x,y,z,vx,vy,vz,ax,ay,az
        var stateRateOfChange = []; //double[9]
        var mu = Constants.muEarth;     //double
        var r = Math.sqrt((state[0] * state[0]) + (state[1] * state[1]) +
            (state[2] * state[2])); //double

        //figure out the rate of change of x,y,z,vx,vy,vz
        stateRateOfChange[0] = state[3]; //vx
        stateRateOfChange[1] = state[4]; //vy
        stateRateOfChange[2] = state[5]; //vz
        stateRateOfChange[3] = -mu * state[0] / (r * r * r); //ax
        stateRateOfChange[4] = -mu * state[1] / (r * r * r); //ay
        stateRateOfChange[5] = -mu * state[2] / (r * r * r); //az
        stateRateOfChange[6] = 0.0;
        stateRateOfChange[7] = 0.0;
        stateRateOfChange[8] = 0.0;
       
        return stateRateOfChange;
    },
    
    propagateOrbit: function(eci, elapsedTime, dt, timeAtStartOfPropagation)
    {
        var state = [];     //double[9]

        //establish the starting state vector;
        state[0] = eci.x;
        state[1] = eci.y;
        state[2] = eci.z;
        state[3] = eci.vx;
        state[4] = eci.vy;
        state[5] = eci.vz;
        state[6] = eci.ax;
        state[7] = eci.ay;
        state[8] = eci.az;

        //call the integrator
        var updatedState =  //double[]
            this.rungeKuttaFehlbergIntegrator(state, elapsedTime, dt, timeAtStartOfPropagation);

        //console.log("updatedState: " + JSON.stringify(updatedState));
        //translate the integrated values into the correct class structure
        var newEci = new UNIVERSE.ECICoordinates(
            updatedState[0], 
            updatedState[1], 
            updatedState[2], 
            updatedState[3], 
            updatedState[4], 
            updatedState[5], 
            updatedState[6], 
            updatedState[7], 
            updatedState[8]); //ECICoordinates
        //console.log("newEci: " + JSON.stringify(newEci));
        return newEci;
    }
};