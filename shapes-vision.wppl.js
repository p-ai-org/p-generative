// old comments block now in shapes-vision-notes.txt

var seed = randomInteger(1000000000)
// var seed = 464608
util.seedRNG(seed)
display('seed is ' + seed)

var drawShapes = function(canvas, shapeAndColorData) {
  var shapes = shapeAndColorData[0];
  var colorings = shapeAndColorData[1];
  
  if (shapes.length == 0) { return; }

  var next = shapes[0];
  var coloring = colorings[0];

  var fill = coloring ? coloring.fill : 'white'; // 'rgba(1,1,1,0)'; // transparent
  var stroke = coloring ? 'rgba(1,1,1,0)' : 'black';
  var opacity = coloring ? coloring.opacity : 1.0;

  var outlineThickness = 2;
  if (next.shape === 'rect') {
    var leftX = next.x - next.dims[0]
    var topY = next.y - next.dims[1]
    canvas.rectangle(leftX, topY, leftX + next.dims[0], topY + next.dims[1], stroke, fill, opacity, next.angle, outlineThickness);
  } else if (next.shape === 'circle') {
    canvas.circle(next.x, next.y, next.radius, stroke, fill, opacity, outlineThickness);
  } else if (next.shape === 'tri') {
    canvas.triangle(next.xs[0], next.ys[0], next.xs[1], next.ys[1], next.xs[2], next.ys[2], stroke, fill, opacity, outlineThickness);
  } else {
    console.warn('drawing a "', next.shape, '" shape not yet implemented! drawing nothing instead');
  }
  drawShapes(canvas, [shapes.slice(1), colorings.slice(1)]);
}

var rgbFix = function(value) {
  if (value > 255) return 255
  if (value < 0) return 0
  return value
}

var makeColors = function(n, colors) {
  if (n == 0) return colors
  
  var redVal = [255, 200, 235, 120, 0][randomInteger(5)]
  var noisedRedVal = rgbFix(redVal + gaussian(0, 10))
  
  var greenVal = [0, 100, 235, 120, 50][randomInteger(5)]
  var noisedGreenVal = rgbFix(greenVal + gaussian(0, 10))
  
  var blueVal = [0, 10, 235, 190, 255][randomInteger(5)]
  var noisedBlueVal = rgbFix(blueVal + gaussian(0, 10))
  
  var colorString = "rgb("+noisedRedVal+","+noisedGreenVal+","+noisedBlueVal+")"
  var color = colorString
  
  //var color = ["red", "blue", "cyan", "green", "yellow", "white", "pink", "black", "orange"][randomInteger(8)]
  return makeColors(n - 1, colors.concat([{
    fill: color,
    stroke: color,
    opacity: 1.0
  }]))
                    
}

var makeRandShapes = function(n, shapes, targetImage, prevScore, sampleDiversity) {
  if (n == 0) return shapes
  
  var rectP = uniform(0, 1)
  var circleP = uniform(0, 1-rectP)
  var triP = uniform(0, 1-rectP-circleP)
  var shapeType = categorical({ ps: [rectP, circleP, triP], vs: ['rect', 'circle', 'tri'] })
  var newShape =
    shapeType === 'rect' ?
    {
      shape: shapeType,
      dims: [randomInteger(30)+10, randomInteger(30)+10],
      x: randomInteger(120)-10, // distance from left edge
      y: randomInteger(120)-10, // distance from top edge
      angle: randomInteger(360) // angle is in degrees; while we can get all we need from just between 0 and 90,
      // allowing for values between 0 and 360 gives the model a bit more flexibility to be able to rotate by changing just one parameter
    }
    : shapeType === 'circle' ?
    {
      shape: shapeType,
      radius: randomInteger(15)+5,
      x: randomInteger(120)-10, // distance from left edge
      y: randomInteger(120)-10 // distance from top edge
    }
    : shapeType === 'tri' ?
    {
        shape: shapeType,
        xs: [randomInteger(120)-10, randomInteger(120)-10, randomInteger(120)-10], // distance from left edge
        ys: [randomInteger(120)-10, randomInteger(120)-10, randomInteger(120)-10] // distance from top edge
    }
    : null
  var newShapes = shapes.concat([newShape])

  if (targetImage) {
    var show = flip(0.05)
    var generatedImage = Draw(imgWidth, imgHeight, show)
    generatedImage.rectangle(0,0,imgWidth,imgHeight,'white','white')
    var shapeColors = repeat(newShapes.length, function() {return undefined}) // dummy
    drawShapes(generatedImage, [newShapes, shapeColors])

    var newScore = -targetImage.distance(generatedImage)/sampleDiversity;
    if (!show) generatedImage.destroy()
    if (newScore == prevScore) {
      factor(-Infinity) // prevent completely hidden shapes
    } else {
      factor(newScore - prevScore)
    }
    return makeRandShapes(n - 1, newShapes, targetImage, newScore, sampleDiversity)
  }

  return makeRandShapes(n - 1, newShapes)  
}
    
// our inference loop is run twice as two different versions: once for finding outlines (findOutlines), and one for finding colors (findShapeColors)
// we are doing these two inference steps independently rather than jointly to model how the brain has lower-level processing before higher-level processing


var outliner = function(trueEdges) {
  var sampleDiversity = 10000
  // var distanceNoise = 0.001

  // var counter = []
  // var showEveryN = 100
  var findOutlines = function() {
    var numShapes = 15 // randomInteger(11)
    
    // inside makeRandShapes, conditioning inference using edges data (integrating lower-level contrast information)
    var shapes = makeRandShapes(numShapes, [], trueEdges, 0, sampleDiversity)
    var shapeColors = repeat(numShapes, function() {return undefined}) // dummy

    // var show = counter.length % showEveryN == 0
    // if (show) {
    //   var canvas1 = Draw(imgWidth, imgHeight, true)
    //   canvas1.rectangle(0,0,imgWidth,imgHeight,'white','white')
    //   drawShapes(canvas1, [shapes, shapeColors])
    // //   var score = -(canvas1.distance(trueEdges)) // + gaussian(0, distanceNoise))
    // // //   display(score)
    // //   factor(score/sampleDiversity)
    // }
    // // if not show, canvas is still being made inside makeRandShapes and factor is happening there

    // counter.push(1)
    
    return [shapes, shapeColors]
  }
  return findOutlines
}

var painter = function(targetimage, outlinesDist) {
  var sampleDiversity = 10000
  var distanceNoise = 0.001

  var counter = []
  var showEveryN = 100
  var findShapeColors = function() {
    
    // var shapes = makeRandShapes(numShapes, [])
    // condition inference using outlines data (integrating outlines, based on lower-level contrast information)
    // observe(outlinesDist, [shapes, repeat(numShapes, function() {return undefined})])
    
    var shapes = sample(outlinesDist)[0]
    // var shapes = foundOutlines[0]

    var show = counter.length % showEveryN == 0
    var canvas1 = Draw(imgWidth, imgHeight, show)

    // condition inference using target image data (integrating lower-level color information)
    var numShapes = shapes.length
    var shapeColors = makeColors(numShapes, [])
    drawShapes(canvas1, [shapes, shapeColors])
    var score = -(canvas1.distance(targetimage)) // + gaussian(0, distanceNoise))
  //   display(score)
    factor(score/sampleDiversity)

    if (!show) {
      canvas1.destroy()
    }

    counter.push(1)
    
    return [shapes, shapeColors]
  }
  return findShapeColors
}

// Run:

// load input image
var imgWidth = 50
var imgHeight = 50
var targetimage = Draw(imgWidth, imgHeight, true)
var imagePath = 'assets/beach.png'
loadImage(targetimage, imagePath)

// 1. Find outlines

// place outlines onto image based on edges detected by contrast changes
var trueEdges = Draw(imgWidth, imgHeight, true)
var edgeThreshold = 2 // higher threshold means less sensitive, i.e. less edges
var edgePixels = detectEdges(targetimage, edgeThreshold)
trueEdges.setImageData(edgePixels)

var outlines = Infer({ method: 'SMC', particles: 100, rejuvSteps: 0, model: outliner(trueEdges), onlyMAP: false })

// draw best outlines
var chooseABest = function(dist) {
  // approximate expectation
  var samples = repeat(100, function() {
    return sample(dist)
  })
  var sorted = sort(samples, gt, function(s) { return dist.score(s) })
  var best = sorted[0]
  return best
}
var bestOutlines = chooseABest(outlines)
// var bestOutlines = sample(outlines) // if onlyMap: true
drawShapes(Draw(imgWidth, imgHeight, true), bestOutlines)

// sample from the resulting distribution a few times to assess how specific the results are (assess variance)
drawShapes(Draw(imgWidth, imgHeight, true), sample(outlines))
drawShapes(Draw(imgWidth, imgHeight, true), sample(outlines))
drawShapes(Draw(imgWidth, imgHeight, true), sample(outlines))

// show the true edges again for comparison
Draw(imgWidth, imgHeight, true).setImageData(edgePixels)

// 2. Find colors

// fill in the shapes
var bestColoredShapes = Infer({ method: 'MCMC', samples: 501, model: painter(targetimage, outlines) })
// samples should not be a multiple of showEveryN, since it might be causing the canvas to be destroyed and then Draw tries to connect to that one

display('done!')

// TODO: scale up all outputs?

// sample from the resulting distribution a few times to assess how specific the results are (assess variance)
drawShapes(Draw(imgWidth, imgHeight, true), sample(bestColoredShapes))
drawShapes(Draw(imgWidth, imgHeight, true), sample(bestColoredShapes))
drawShapes(Draw(imgWidth, imgHeight, true), sample(bestColoredShapes))

// show the target image again for comparison
loadImage(Draw(imgWidth, imgHeight, true), imagePath)

// show the true edges again for comparison
Draw(imgWidth, imgHeight, true).setImageData(edgePixels)
