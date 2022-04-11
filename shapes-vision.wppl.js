/*
// Helper functions available (provided by the dependencies we include above):

var canvas1 = Draw(50, 50, true) // semicolon at end of line is optional
// parameters are width, height, whether to display the canvas in the output
loadImage(canvas1, "assets/beach.png")

var canvas2 = Draw(50, 50, true)
loadImage(canvas2, "assets/beach2.png")

// distance compares two images
//images must be the same size
canvas1.distance(canvas2)

// some available distributions (see http://docs.webppl.org/en/master/distributions.html and https://webppl.readthedocs.io/en/master/sample.html)
flip() or flip(p) e.g. flip(0.7) (70% likelihood of heads)
uniform(min, max) e.g. uniform(0, 10) (random value between 0 and 10, each option equally likely)
gaussian(mean, standardDeviation) e.g. gaussian(0, 3)
randomInteger(max) e.g. randomInteger(10) (random integer from 0 to 9)

For more WebPPL documentation, see https://webppl.readthedocs.io/en/master/
*/

// ** IF YOU WANT TO UPLOAD AN IMAGE, UPLOAD IT TO THE /assets FOLDER; you can drag and drop it at https://github.com/p-ai-org/p-generative/tree/main/assets
// (I put beach.png there as an example -- see how small it is! smaller images will be easier for us to process;
// you can shrink any image you want, or edit any image you want, using https://www.photopea.com/) **

var drawShapes = function(canvas, shapes, stroke, fill, opacity) {
    if (shapes.length == 0) { return []; }
    var next = shapes[0];
    if (next.shape === 'rect') {
        var leftX = next.x - next.dims[0]
        var topY = next.y - next.dims[1]
        var angle = next.angle
        canvas.rectangle(leftX, topY, leftX + next.dims[0], topY + next.dims[1], stroke, fill, opacity, angle);
    } else {
        console.warn('drawing a "', next.shape, '" shape not yet implemented! drawing nothing instead');
    }
    drawShapes(canvas, shapes.slice(1), stroke, fill, opacity);
}

/* demoing some of our functions */

var canvas1 = Draw(100, 100, true)

//draws a random square
var drawRandRect = function(canvas){
    drawShapes(canvas1, [
        {
            shape: 'rect',
            dims: [randomInteger(30), randomInteger(30)],
            x: randomInteger(100), // distance from left edge
            y: randomInteger(100), // distance from top edge
            angle: randomInteger(90) // angle is in degrees
        }
    ], "white", "cyan", 0.5)
}

loadImage(canvas1, "assets/beach.png")
//repeat(100, drawRandRect)



Infer({ method: 'MCMC', samples: 200, model: drawRandRect })
/*drawShapes(canvas1, [
    {
        shape: 'rect',
        dims: [20, 20],
        x: 90, // distance from left edge
        y: 60, // distance from top edge
        angle: 35 // angle is in degrees
    },
    {
        shape: 'rect',
        dims: [20, 10],
        x: 30,
        y: 55,
        angle: 0
    }
], "white", "cyan", 1.0)*/

var canvas2 = Draw(100, 100, false)
loadImage(canvas2, "assets/beach.png")

display('Distance to original: ' + canvas2.distance(canvas1))


// a generative modeling demo

var model = function() {
  // generate data
  var die1 = randomInteger(6) + 1; // random integer from 1 to 6
  var die2 = randomInteger(6) + 1;
  
  // constrain the data
  condition(die1 + die2 == 8)

  // for the sake of this model, we only care about one of our variables (the value of one of our dice)
  return die1;
}
// infer generated values that match the constraint 
var roll = Infer({ model: model });
// visualize: inference recognizes that for the dice to sum to 8, the first die must have rolled a 2,3,4,5 or 6
viz(roll);





// 1. define the problem

// what shape? what position? what color?
// can shapes overlap? should shapes be opaque (base off how we see the world)?

// approaches:
// start with shapes, put them in the right place, then color them
// find the right positions, find the right shapes, then color them
// find the right colors, find the positions of the color groupings, then find the right shapes

// how to find colors:
// from image ("bottom-up"):
// average color in region (average for each channel (RGB))
// could also pick the color in the middle/or edge of the region
// from expectation ("top-down"):
// have set of colors and choose closest match
// combination? = extract color from image, then match it to a color we know

// how to find position/shape:
// random position, random shape
// but can nudge the model (like give it a hint for shape): take central point in region, branch out in different directions to find edges

// how to find shape:
// group by similar colors
// pick a pixel, go all four directions, find sharp change in color (contrast) to find edges, then approximate the edges into shapes (same as above, but mapping outlines to edges first)



// 2. develop model based on the problem definition
// 3. visualize the model
