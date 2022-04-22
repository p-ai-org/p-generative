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

var drawShapes = function(canvas, shapes, outlinesOnly) {
    if (shapes.length == 0) { return []; }
    var next = shapes[0];
    var fill = outlinesOnly ? 'white' : next.fill;
    var stroke = outlinesOnly ? 'black' : next.stroke;
    var opacity = outlinesOnly ? 1.0 : next.opacity;
    if (next.shape === 'rect') {
        var leftX = next.x - next.dims[0]
        var topY = next.y - next.dims[1]
        canvas.rectangle(leftX, topY, leftX + next.dims[0], topY + next.dims[1], stroke, fill, opacity, next.angle);
    } else if (next.shape === 'circle') {
      canvas.circle(next.x, next.y, next.radius, stroke, fill, opacity);
    } else if (next.shape === 'tri') {
      canvas.triangle(next.xs[0], next.ys[0], next.xs[1], next.ys[1], next.xs[2], next.ys[2], stroke, fill, opacity);
    } else {
        console.warn('drawing a "', next.shape, '" shape not yet implemented! drawing nothing instead');
    }
    drawShapes(canvas, shapes.slice(1), outlinesOnly);
}



var makeRandShapes = function(n, shapes) {
  if (n == 0) return shapes
  
  var shapeType = ['rect', 'circle', 'tri'][randomInteger(3)]
  if (shapeType === 'rect') {
    var newShapes = shapes.concat([
        {
            shape: shapeType,
            dims: [randomInteger(30), randomInteger(30)],
            x: randomInteger(100), // distance from left edge
            y: randomInteger(100), // distance from top edge
            angle: randomInteger(90), // angle is in degrees
            fill: "cyan",
            stroke: "white",
            opacity: 1.0
        }
    ])
    return makeRandShapes(n - 1, newShapes)
  }
  
  if (shapeType === 'circle') {
    var newShapes = shapes.concat([
        {
            shape: shapeType,
            radius: randomInteger(25),
            x: randomInteger(100), // distance from left edge
            y: randomInteger(100), // distance from top edge
            fill: "cyan",
            stroke: "white",
            opacity: 1.0
        }
    ])
    return makeRandShapes(n - 1, newShapes)
  }
  
  if (shapeType === 'tri') {
    var newShapes = shapes.concat([
        {
            shape: shapeType,
            xs: [randomInteger(100), randomInteger(100), randomInteger(100)], // distance from left edge
            ys: [randomInteger(100), randomInteger(100), randomInteger(100)], // distance from top edge
            fill: "cyan",
            stroke: "white",
            opacity: 1.0
        }
    ])
    return makeRandShapes(n - 1, newShapes)
  }
}

var targetimage = Draw(100, 100, true)
loadImage(targetimage, "assets/beach.png")

// Starting point for edge detection: find raw edges in the image
var edges = Draw(100, 100, true)
edges.setImageData(detectEdges(targetimage, 4)) // TODO: infer the right threshold based on how much contrast is in the image overall?
//

var sampleDiversity = 1000
var distanceNoise = 0.001
    
// this inference loop should be run twice as two different versions: one for finding outlines, and one for finding colors
var findShapes = function() {
  var shapes = makeRandShapes(10, [])
  var canvas1 = Draw(100, 100, true)
  
  var outlinesOnly = false
  drawShapes(canvas1, shapes, outlinesOnly)
  var score = -(canvas1.distance(targetimage) + gaussian(0, distanceNoise))
//   display(score)
  factor(score/sampleDiversity)
  
  return canvas1
}

var bestcanvas = Infer({ method: 'MCMC', samples: 100, model: findShapes })





/* demoing some of our functions */

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

/*
var canvas2 = Draw(100, 100, false)
loadImage(canvas2, "assets/beach.png")

display('Distance to original: ' + canvas2.distance(canvas1))
*/


/*
// a generative modeling demo
var model = function() {
    // generate data
    var die1 = randomInteger(6) + 1; // random integer from 1 to 6
    var die2 = randomInteger(6) + 1;

    // constrain the data
    //   condition(die1 + die2 == 8)

    //   factor(-Infinity) // => 10^-inf = 0
    //   factor(0) // => 0 => 10^0 = 1

    //   factor(-100.0/(die1 + die2))
    factor(Math.pow(.94, -(die1 + die2)))

    // for the sake of this model, we only care about one of our variables (the value of one of our dice)
    return die1;
}
// infer generated values that match the constraint 
var roll = Infer({ model: model });
// visualize: inference recognizes that for the dice to sum to 8, the first die must have rolled a 2,3,4,5 or 6
viz(roll);
*/

// notes moved to notion fifth and sixth meeting notes
