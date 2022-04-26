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

var drawShapes = function(canvas, shapeAndColorData) {
  var shapes = shapeAndColorData[0];
  var colorings = shapeAndColorData[1];
  
  if (shapes.length == 0) { return; }

  var next = shapes[0];
  var coloring = colorings[0];

  var fill = coloring ? coloring.fill : 'rgba(0,0,0,0)';
  var stroke = coloring ? coloring.stroke : 'black';
  var opacity = coloring ? coloring.opacity : 1.0;
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
  drawShapes(canvas, [shapes.slice(1), colorings.slice(1)]);
}

var rbgFix = function(value) {
  if(value > 255) return 255
  if (value < 0) return 0
}

var makeColors = function(n, colors) {
  if (n == 0) return colors
  
  var redVal = [255, 200, 235, 120, 0][randomInteger(5)] 
  var greenVal = [0, 100, 235, 120, 50][randomInteger(5)]
  var blueVal = [0, 10, 235, 190, 255][randomInteger(5)]
  
  var colorString = "rgb("+redVal+","+greenVal+","+blueVal+")"
  var color = colorString

  
  //var color = ["red", "blue", "cyan", "green", "yellow", "white", "pink", "black", "orange"][randomInteger(8)]
  return makeColors(n - 1, colors.concat([{
    fill: color,
    stroke: color,
    opacity: 1.0
  }]))
                    
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
            angle: randomInteger(90) // angle is in degrees
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
            y: randomInteger(100) // distance from top edge
        }
    ])
    return makeRandShapes(n - 1, newShapes)
  }
  
  if (shapeType === 'tri') {
    var newShapes = shapes.concat([
        {
            shape: shapeType,
            xs: [randomInteger(100), randomInteger(100), randomInteger(100)], // distance from left edge
            ys: [randomInteger(100), randomInteger(100), randomInteger(100)] // distance from top edge
        }
    ])
    return makeRandShapes(n - 1, newShapes)
  }
}
    
// our inference loop is run twice as two different versions: once for finding outlines (findOutlines), and one for finding colors (findShapeColors)
// we are doing these two inference steps independently rather than jointly to model how the brain has lower-level processing before higher-level processing


var outliner = function(trueEdges) {
  var sampleDiversity = 10000
  var distanceNoise = 0.001

  var counter = []
  var showEveryN = 15
  var findOutlines = function() {
    var numShapes = randomInteger(11) // 10
    var shapes = makeRandShapes(numShapes, [])

    var show = counter.length % showEveryN == 0
    var canvas1 = Draw(100, 100, show)
    
    // condition inference using edges data (integrating lower-level contrast information)
    var shapeColors = repeat(numShapes, function() {return undefined}) // dummy
    drawShapes(canvas1, [shapes, shapeColors])
    var score = -(canvas1.distance(trueEdges)) // + gaussian(0, distanceNoise))
  //   display(score)
    factor(score/sampleDiversity)

    counter.push(1)
    
    return [shapes, shapeColors]
  }
  return findOutlines
}

var painter = function(targetimage, bestOutlines) {
  var sampleDiversity = 10000
  var distanceNoise = 0.001

  var counter = []
  var showEveryN = 15
  var findShapeColors = function() {
    // var shapes = makeRandShapes(numShapes, [])
    
    // // condition inference using outlines data (integrating outlines, based on lower-level contrast information)
    // observe(bestOutlines, [shapes, repeat(numShapes, function() {return undefined})])

    var shapes = sample(bestOutlines)[0] // TODO: is conditioning here conditioning this? (does it need to?)

    var show = counter.length % showEveryN == 0
    var canvas1 = Draw(100, 100, show)

    // condition inference using target image data (integrating lower-level color information)
    var numShapes = shapes.length
    var shapeColors = makeColors(numShapes, [])
    drawShapes(canvas1, [shapes, shapeColors])
    var score = -(canvas1.distance(targetimage)) // + gaussian(0, distanceNoise))
  //   display(score)
    factor(score/sampleDiversity)

    counter.push(1)
    
    return [shapes, shapeColors]
  }
  return findShapeColors
}

// Run:

// load input image
var targetimage = Draw(100, 100, true)
var imagePath = "assets/beach.png"
loadImage(targetimage, imagePath)

// 1. Find outlines

// place outlines onto image based on edges detected by contrast changes
var trueEdges = Draw(100, 100, true)
var edgePixels = detectEdges(targetimage, 2.5)
trueEdges.setImageData(edgePixels) // TODO: infer the right threshold based on how much contrast is in the image overall?

var bestOutlines = Infer({ method: 'MCMC', samples: 400, model: outliner(trueEdges) })

// sample from the resulting distribution a few times to assess how specific the results are (assess variance)
drawShapes(Draw(100, 100, true), sample(bestOutlines))
drawShapes(Draw(100, 100, true), sample(bestOutlines))
drawShapes(Draw(100, 100, true), sample(bestOutlines))

// show the true edges again for comparison
Draw(100, 100, true).setImageData(edgePixels)

// 2. Find colors

// fill in the shapes
var bestColoredShapes = Infer({ method: 'MCMC', samples: 500, model: painter(targetimage, bestOutlines) })

// sample from the resulting distribution a few times to assess how specific the results are (assess variance)
drawShapes(Draw(100, 100, true), sample(bestColoredShapes))
drawShapes(Draw(100, 100, true), sample(bestColoredShapes))
drawShapes(Draw(100, 100, true), sample(bestColoredShapes))

// show the target image again for comparison
loadImage(Draw(100, 100, true), imagePath)

// show the true edges again for comparison
Draw(100, 100, true).setImageData(edgePixels)




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
