require('https://probmods.org/assets/js/draw.js')
require('')

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
    var context = drawObject.canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.onload = function() {
        var raster = new drawObject.paper.Raster(imageObj);
        raster.position = drawObject.paper.view.center;
        raster.fitBounds(drawObject.paper.view.bounds, fill);
        drawObject.redraw();
        resumeTrampoline(function() { return k(s) });
    };
    imageObj.src = url;
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