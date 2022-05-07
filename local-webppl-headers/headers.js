module.exports = function(env) {

  const paper = require('paper-jsdom-canvas')
  const { createCanvas, loadImage: canvasLoadImage } = require('canvas')
  const path = require('path')

  // adapted from https://probmods.org/assets/js/draw.js
  function DrawObject(width, height) {
    this.canvas = createCanvas(width, height) // , 'svg')
    this.paper = new paper.PaperScope();
    this.paper.setup(this.canvas);
    this.paper.view.viewSize = new this.paper.Size(width, height);
    this.redraw();
  }
  
  DrawObject.prototype.newPath = function(strokeWidth, opacity, color){
    var path = new this.paper.Path();
    path.strokeColor = color || 'black';
    path.strokeWidth = strokeWidth || 8;
    path.opacity = opacity || 0.6;
    return path;
  };
  
  DrawObject.prototype.newPoint = function(x, y){
    return new this.paper.Point(x, y);
  };
  
  DrawObject.prototype.circle = function(x, y, radius, stroke, fill){
    var point = this.newPoint(x, y);
    var circle = new this.paper.Path.Circle(point, radius || 50);
    circle.fillColor = fill || 'black';
    circle.strokeColor = stroke || 'black';
    this.redraw();
  };
  
  DrawObject.prototype.rectangle = function(x1, y1, x2, y2, stroke, fill, opacity){
    var rect = new this.paper.Path.Rectangle(this.newPoint(x1,y1), this.newPoint(x2, y2));
    rect.fillColor = (fill == 'none' ? new paper.Color(1,1,1,0) : (fill || 'white'));
    rect.strokeColor = stroke || 'black';
    rect.opacity = opacity || 1;
    this.redraw();
  };
  
  DrawObject.prototype.polygon = function(x, y, n, radius, stroke, fill){
    var point = this.newPoint(x, y);
    var polygon = new this.paper.Path.RegularPolygon(point, n, radius || 20);
    polygon.fillColor = fill || 'white';
    polygon.strokeColor = stroke || 'black';
    polygon.strokeWidth = 4;
    this.redraw();
  };
  
  DrawObject.prototype.line = function(x1, y1, x2, y2, strokeWidth, opacity, color){
    var path = this.newPath(strokeWidth, opacity, color);
    path.moveTo(x1, y1);
    path.lineTo(this.newPoint(x2, y2));
    this.redraw();
  };
  
  DrawObject.prototype.squiggle = function(x1, y1, hx1, hy1, x2, y2, hx2, hy2, strokeWidth, opacity, color){
    var firstSegment = new this.paper.Segment({
        point: [x1,y1],
        handleOut: [hx1,hy1]
    });
    var secondSegment = new this.paper.Segment({
        point: [x2,y2],
        handleIn: [hx2,hy2]
    });
    var path = new this.paper.Path({
        segments: [firstSegment, secondSegment],
        strokeColor: 'black'
    });
    path.strokeColor = color || 'black';
    path.strokeWidth = strokeWidth || 8;
    path.opacity = opacity || 0.6;
    this.redraw();
  };
  
  DrawObject.prototype.redraw = function(){
    this.paper.view.draw();
  };
  
  DrawObject.prototype.toArray = function(){
    var context = this.paper.view.getContext();
    var imgData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return imgData.data;
  };
  
  DrawObject.prototype.distanceF = function(f, cmpDrawObject){
    if (!((this.canvas.width == cmpDrawObject.canvas.width) &&
          (this.canvas.height == cmpDrawObject.canvas.height))){
      console.log(this.canvas.width, cmpDrawObject.canvas.width,
                  this.canvas.height, cmpDrawObject.canvas.height);
      throw new Error("Dimensions must match for distance computation!");
    }
    var thisImgData = this.toArray();
    var cmpImgData = cmpDrawObject.toArray();
    return f(thisImgData, cmpImgData);
  };
  
  DrawObject.prototype.distance = function(cmpDrawObject){
    var df = function(thisImgData, cmpImgData) {
      var distance = 0;
      for (var i=0; i<thisImgData.length; i+=4) {
        var col1 = [thisImgData[i], thisImgData[i+1], thisImgData[i+2], thisImgData[i+3]];
        var col2 = [cmpImgData[i], cmpImgData[i+1], cmpImgData[i+2], cmpImgData[i+3]];
        distance += euclideanDistance(col1, col2);
      };
      return distance;
    };
    return this.distanceF(df, cmpDrawObject)
  };
  
  DrawObject.prototype.destroy = function(){
    this.paper = undefined;
    this.canvas = undefined;
  }
  
  function Draw(s, k, a, width, height){
    return k(s, new DrawObject(width, height));
  }


  // did not include https://probmods.org/assets/js/box2d.js since we don't need it right now (for shapes-vision-utopic.wppl)

  // adapted/modified from draw.js
  DrawObject.prototype.rectangle = function (x1, y1, x2, y2, stroke='black', fill='white', opacity=1, angle=0, strokeWidth=1) {
      var rect = new this.paper.Path.Rectangle(this.newPoint(x1, y1), this.newPoint(x2, y2));
      rect.fillColor = (fill == 'none' ? new paper.Color(1, 1, 1, 0) : fill);
      rect.strokeColor = stroke;
      rect.strokeWidth = strokeWidth;
      rect.opacity = opacity;
      rect.rotate(angle, (x1 + x2) / 2, (y1 + y2) / 2); // rotate about the center of the rectangle
      this.redraw();
  };
  DrawObject.prototype.circle = function (x, y, radius, stroke='black', fill='black', opacity=1, strokeWidth=1) {
      var point = this.newPoint(x, y);
      var circle = new this.paper.Path.Circle(point, radius);
      circle.fillColor = (fill == 'none' ? new paper.Color(1, 1, 1, 0) : fill);
      circle.strokeColor = stroke;
      circle.strokeWidth = strokeWidth;
      circle.opacity = opacity;
      this.redraw();
  };
  DrawObject.prototype.triangle = function (x1, y1, x2, y2, x3, y3, stroke='black', fill='white', opacity=1, strokeWidth=1) {
      var tri = new this.paper.Path();
      tri.add(this.newPoint(x1, y1));
      tri.add(this.newPoint(x2, y2));
      tri.add(this.newPoint(x3, y3));
      tri.closed = true;
      tri.fillColor = (fill == 'none' ? new paper.Color(1, 1, 1, 0) : fill);
      tri.strokeColor = stroke;
      tri.strokeWidth = strokeWidth;
      tri.opacity = opacity;
      this.redraw();
  };

  // modified from draw.js to have raster image fill the canvas
  function loadImage(s, k, a, drawObject, url, fill) {
      // Synchronous loading - only continue with computation once image is loaded
      canvasLoadImage(url).then((imageObj) => {
        var raster = new drawObject.paper.Raster(imageObj);
        raster.onLoad = function() {
          raster.position = drawObject.paper.view.center;
          raster.fitBounds(drawObject.paper.view.bounds, fill);
          drawObject.redraw();
          resumeTrampoline(function() { return k(s) });
        };
      }).catch((err) => {
        throw err;
      })
  }

  // from dippl.org/examples/vision.html, used by the DrawObject.prototype.distance function
  function euclideanDistance(v1, v2){
      var i;
      var d = 0;
      for (i = 0; i < v1.length; i++) {
          d += (v1[i] - v2[i])*(v1[i] - v2[i]);
      }
      return Math.sqrt(d);
  };

  // formula from https://stackoverflow.com/a/596243
  function getLuminosity([r,g,b,a]) {
      // ignore alpha; should always be 100% for images, which is what we're detecting edges in
      return (0.299*r + 0.587*g + 0.114*b);
  }

  // adapted from https://codepen.io/taylorcoffelt/pen/eYNZvZ
  function detectEdges(s, k, a, drawObject, threshold=0.2) {
      var height = drawObject.canvas.height;
      var width = drawObject.canvas.width;
      var imageData = drawObject.toArray();
      function getPixel(x,y) {
          var start = (x + y * width) * 4;
          return imageData.slice(start, start + 4);
      }

      // debugger;
      var points = drawObject.canvas.getContext('2d').createImageData(width, height);
      for(y=0;y<height;y++) {
          for(x=0;x<width;x++){
              pixel = getLuminosity(getPixel(x,y));

              left = getLuminosity(getPixel(x-1,y));
              right = getLuminosity(getPixel(x+1,y));
              top = getLuminosity(getPixel(x,y-1));
              bottom = getLuminosity(getPixel(x,y+1));

              //Compare it all.
              var index = (x + y * width) * 4;
              if(/*x == 0 || x == width-1 || y == 0 || y == height-1
                  ||*/ pixel>left+threshold
                  || pixel<left-threshold
                  || pixel>right+threshold
                  || pixel<right-threshold
                  || pixel>top+threshold
                  || pixel<top-threshold
                  || pixel>bottom+threshold
                  || pixel<bottom-threshold) {
                  value = 0;
              } else {
                  value = 255;
              }
              points.data[index + 0] = value;
              points.data[index + 1] = value;
              points.data[index + 2] = value;
              points.data[index + 3] = value;
              points.data[index + 3] = 255;
          }
      }
      return k(s, points);
  }

  DrawObject.prototype.setImageData = function(imageData) {
      this.canvas.getContext('2d').putImageData(imageData, 0, 0);
  }

  // added for nodejs
  const mkdirp = require('mkdirp');
  const cwd = process.cwd();
  let outputFolder = cwd;
  function setOutputFolder(s, k, a, destFolderPath) {
    outputFolder = path.join(cwd, destFolderPath);
    return k(s, outputFolder);
  }
  function saveCanvas(s, k, a, drawObject, filename=drawObject.filename) {
    const destFilePath = path.join(outputFolder, filename);
    mkdirp(outputFolder);
    drawObject.paper.view.exportImage(destFilePath, function cb() {
      console.log('Saved image to ' + destFilePath);
      resumeTrampoline(function() { return k(s) });
    });
  }

  return {
      Draw,
      loadImage,
      detectEdges,
      setOutputFolder,
      saveCanvas
  }
}