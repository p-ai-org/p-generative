var seed = randomInteger(1000000000)
// seed 805225545 for watermelon
util.seedRNG(seed)
display('seed is ' + seed)

var drawShapes = function(canvas, shapeAndColorData) {
  var shapes = shapeAndColorData.shapes;
  var colorings = shapeAndColorData.shapeColors;

  if (shapes.length == 0) { return; }

  var next = shapes[0];
  var coloring = colorings[0];

  var fill = coloring ? coloring.fill : 'white'; // 'rgba(1,1,1,0)'; // transparent
  var stroke = coloring ? 'rgba(1,1,1,0)' : 'black';
  var opacity = coloring ? coloring.opacity : 1.0;

  var outlineThickness = 1;
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
  drawShapes(canvas, { shapes: shapes.slice(1), shapeColors: colorings.slice(1) });
}

var rgbFix = function(value) {
  if (value > 255) return 255
  if (value < 0) return 0
  return value
}

var makeColors = function(n, colors, getStandard) {
  if (n == 0) return colors

  var redVal = [0, 60, 120, 200, 255][randomInteger(5)]
  var noisedRedVal = rgbFix(redVal + (getStandard ? 0 : uniform(-50, 50)))

  var greenVal = [0, 50, 100, 140, 235][randomInteger(5)]
  var noisedGreenVal = rgbFix(greenVal + (getStandard ? 0 : uniform(-50, 50)))

  var blueVal = [0, 60, 120, 200, 255][randomInteger(5)]
  var noisedBlueVal = rgbFix(blueVal + (getStandard ? 0 : uniform(-50, 50)))
  
  if (getStandard) {
    return [redVal, greenVal, blueVal];
  }

  var colorString = "rgb("+noisedRedVal+","+noisedGreenVal+","+noisedBlueVal+")"
  var color = colorString

  //var color = ["red", "blue", "cyan", "green", "yellow", "white", "pink", "black", "orange"][randomInteger(8)]
  return makeColors(n - 1, colors.concat([{
    fill: color,
    stroke: color,
    opacity: 1.0
  }]))
}

var getStandardColors = function() {
    var colors = []
    Infer({ method: 'enumerate', model() {
      var color = makeColors(1, [], true)
  //     display(util.prettyJSON(color))
      var colorString = "rgb("+color[0]+","+color[1]+","+color[2]+")"
      // var stroke = colorString
      // var fill = colorString
      // Draw(25, 25, true).rectangle(0, 0, 25, 25, stroke, fill, 1.0, 0, 30)
      colors.push(colorString)
    }})
    return colors 
  }
var drawSwatchGrid = function(colors, rows, cols) {
    var width = 200
    var height = 200
    var swatchWidth = width / cols
    var swatchHeight = height / rows
    var shapeColors = mapIndexed(function(i, color) {
      return {
        fill: color,
        stroke: color,
        opacity: 1.0
      }
      // canvas.rectangle(x*swatchWidth, y*swatchHeight, swatchWidth, swatchHeight, stroke, fill, 1.0, 0, 30)
    }, colors)
    display(colors.length)
    var shapes = mapIndexed(function(i, color) {
      var x = i % cols
      var y = Math.floor(i / cols)
      return {
        // x: x*swatchWidth + swatchWidth/2,
        // y: y*swatchHeight + swatchHeight/2,
        // shape: 'circle'
        // radius: swatchWidth/2,
  
        x: swatchWidth + x*swatchWidth,
        y: swatchHeight + y*swatchHeight,
        dims: [swatchWidth, swatchHeight],
        shape: 'rect'
      }
    }, colors)
    drawShapes(Draw(width, height, true), { shapes, shapeColors })
  }
  drawSwatchGrid(getStandardColors(), 25, 5)

var makeRandShapes = function(n, shapes, targetImage, prevScore, sampleDiversity) { 
  // categorical distribution of the shape type is 
  var rectP = uniform(0, 1)
  var circleP = uniform(0, 1-rectP)
  var triP = uniform(0, 1-rectP-circleP)
  var shapeType = categorical({ ps: [rectP, circleP, triP], vs: ['rect', 'circle', 'tri'] })

  // x is distance from left edge, y is distance from top edge
  var x = uniform(-5, imgWidth+5)
  var y = uniform(-5, imgHeight+5)
  
  var dim1 = uniform(0, imgWidth+10)
  var dim2 = shapeType === 'circle' ? dim1 : uniform(0, imgHeight+10)

  var dim1b = shapeType === 'tri' ? ((flip() ? -1 : 1) * uniform(0, imgWidth+10)) : 0
  var dim2b = shapeType === 'tri' ? ((flip() ? -1 : 1) * uniform(0, imgHeight+10)) : 0
  
  // while we can get all we need from just between 0 and 90,
  // allowing for values between 0 and 360 gives the model a bit more flexibility to be able to rotate by changing just one parameter
  var angle = shapeType === 'rect' ? uniform(0, 90) : 0
  
//   var createShape = mem(function(type, n) {
//     return Infer({ method: 'forward', samples: 30, model() {
//   var x = xTrue + uniform(-dim1True/3, dim1True/3)
//   var y = yTrue + uniform(-dim2True/3, dim2True/3)

//   var dim1 = dim1True + uniform(-dim1True/4, dim1True/4)
//   var dim2 = dim2True + uniform(-dim2True/4, dim2True/4)

//   var dim1b = shapeType === 'tri' ? dim1bTrue + uniform(-dim1True/2, dim1True/2) : 0
//   var dim2b = shapeType === 'tri' ? dim2bTrue + uniform(-dim2True/2, dim2True/2) : 0

//   var angle = shapeType === 'rect' ? angleTrue + uniform(-20, 20) : 0

  const newShape = (
    shapeType === 'rect' ?
    { shape: shapeType, dims: [dim1, dim2], x, y, angle }
    : shapeType === 'circle' ?
    { shape: shapeType, radius: dim1/2, x, y }
    : shapeType === 'tri' ?
    {
      shape: shapeType,
      xs: [x - dim1/2, x + dim1/2, x+dim1b/2],
      ys: [y - dim2/2, y + dim2/2, y+dim2b/2]
      // the third component gives the triangle three degrees of variability for each axis
    }
    : null)
//     }
// })
//   })

//   var shapeCreator = createShape(shapeType)
  var newShapes = shapes.concat([newShape])

//   if (targetImage) {
//     var show = true // flip(0.05)
//     var generatedImage = Draw(imgWidth, imgHeight, show)
//     generatedImage.rectangle(0,0,imgWidth,imgHeight,'white','white')
//     var shapeColors = repeat(newShapes.length, function() {return undefined}) // dummy
//     drawShapes(generatedImage, { shapes: newShapes, shapeColors })

//     var newScore = -targetImage.distance(generatedImage)/sampleDiversity;
//     if (!show) generatedImage.destroy()
//     if (newScore == prevScore) {
//       factor(-Infinity) // prevent completely hidden shapes
//     } else {
//       factor(newScore - prevScore)
//     }
//     return (n==1) ? {shapes: newShapes, shapeType} : makeRandShapes(n - 1, newShapes, targetImage, newScore, sampleDiversity)
//   }

  return (n==1) ? {shapes: newShapes, shapeType} : makeRandShapes(n - 1, newShapes)
}

// our inference loop is run once, for finding shapes and colors (findShapeColors)
// we are doing this inference step jointly for sake of illustration of what could maybe be possible (because it looks nicer)

var painter = function(targetimage) {
  var sampleDiversity = 10000
//   var distanceNoise = 0.001

  var counter = []
  var showEveryN = 100
  var findShapeColors = function() {
    var numShapes = randomInteger(20)
    var randShapes = makeRandShapes(numShapes, [])
    var shapes = randShapes.shapes
    var shapeType = randShapes.shapeType
    var shapeColors = makeColors(numShapes, [])
    
    // condition inference using target image data (integrating lower-level color information)
    var show = counter.length % showEveryN == 0
    var canvas1 = Draw(imgWidth, imgHeight, show)
    drawShapes(canvas1, { shapes, shapeColors })
    var score = -(canvas1.distance(targetimage)) // + gaussian(0, distanceNoise))
//       display(score)
    factor(score/sampleDiversity)

    if (!show) {
      canvas1.destroy()
    }

    counter.push(1)

    return {shapes, shapeColors}
  }
  return findShapeColors
}

// Run:

// load input image
var imgWidth = 50
var imgHeight = 50
var targetimage = Draw(imgWidth, imgHeight, true)
var imagePath = 'assets/geometric1.png'
loadImage(targetimage, imagePath, true) // third param is "fill" (if false, image is contained, if true, image fills bounds)

// Find shapes and colors

// fill in the shapes
var bestColoredShapes = Infer({ method: 'MCMC', samples: 10000, model: painter(targetimage) })
// samples should not be a multiple of showEveryN, since it might be causing the canvas to be destroyed and then Draw tries to connect to that one

display('done!')

// TODO: scale up all outputs?

// sample from the resulting distribution a few times to assess how specific the results are (assess variance)
var finalResultCanvas = Draw(imgWidth, imgHeight, true)
var finalResultSamples = repeat(10, function() {
  var s = sample(bestColoredShapes)
  var shapeColors = map(function(color) {
    // change opacity
    return {
      fill: color.fill,
      stroke: color.stroke,
      opacity: 1/10
    }
  }, s.shapeColors)
  var shapes = s.shapes
  drawShapes(finalResultCanvas, { shapes, shapeColors })
})

// show the target image again for comparison
loadImage(Draw(imgWidth, imgHeight, true), imagePath)

// // show the true edges again for comparison
// Draw(imgWidth, imgHeight, true).setImageData(edgePixels)
