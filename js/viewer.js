
//
// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
//



//
// Disable workers to avoid yet another cross-origin issue (workers need
// the URL of the script to be loaded, and dynamically loading a cross-origin
// script does not work).
//
// PDFJS.disableWorker = true;

//
// In cases when the pdf.worker.js is located at the different folder than the
// pdf.js's one, or the pdf.js is executed via eval(), the workerSrc property
// shall be specified.
//
// PDFJS.workerSrc = '../../build/pdf.worker.js';




/**
 * Returns scale factor for the canvas. It makes sense for the HiDPI displays.
 * @return {Object} The object with horizontal (sx) and vertical (sy)
                    scales. The scaled property is set to false if scaling is
                    not required, true otherwise.
 */
function getOutputScale(ctx) {
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                          ctx.mozBackingStorePixelRatio ||
                          ctx.msBackingStorePixelRatio ||
                          ctx.oBackingStorePixelRatio ||
                          ctx.backingStorePixelRatio || 1;
  var pixelRatio = devicePixelRatio / backingStoreRatio;
  return {
    sx: pixelRatio,
    sy: pixelRatio,
    scaled: pixelRatio !== 1
  };
}

var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 5,
    wrapper = document.getElementById('canvas-wrapper'),
    canvas = document.getElementById('the-canvas');

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    var ratio = 8;
    var viewport = page.getViewport(scale);
    
    //console.log(viewport.width,viewport);
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = "100%"; //(ratio * 100) + "%";
    canvas.style.height = "100%"; //(ratio * 100) + "%";
    //canvas.style.transform = "scale(" + 1/ratio + ', ' + 1/ratio + ")" ;
    //canvas.style.transformOrigin = "0% 0%";
    //wrapper.style.width = Math.floor(viewport.width/ratio) + 'pt';
    //wrapper.style.height = Math.floor(viewport.height/ratio)+ 'pt';

    
    
    
    
    

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    };
    var renderTask = page.render(renderContext);



    // Wait for rendering to finish
    renderTask.promise.then(function () {
      pageRendering = false;
      
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  // Update page counters
  $('#page_num').html(pageNum);
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

/**
 * Displays previous page.
 */
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}
$('#prev').on('click', onPrevPage);

/**
 * Displays next page.
 */
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}
$('#next').on('click', onNextPage);

/**
 * Asynchronously downloads PDF.
 */
function load_pdf(pdfurl){
  PDFJS.getDocument(pdfurl).then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    pageNum = 1;
    $('#page_count').html(pdfDoc.numPages);
  // Initial/first page rendering
    renderPage(pageNum);
  });
}

/**
 * Render Score
 */

var ScoreRenderer = function(c, p){
  // migrate to vexflow
  this.c = document.getElementById(c);
  this.r = new Vex.Flow.Renderer(this.c, Vex.Flow.Renderer.Backends.CANVAS);
  this.ctx = this.r.getContext();
  this.geo = {system_width:820,system_height:80,system_interval:30,left_padding:25,top_padding:10};
  this.layout = {measure_per_system:4};
  this.r.resize(1000,800);


  if(typeof p != 'undefined'){
    this.p = new fabric.StaticCanvas(p, {
      width: $('.canvas-wrapper').width(),
      height: $('.canvas-wrapper').height(),
      backgroundColor: 'rgba(240,250,240, 5)'
    });
  }
};
ScoreRenderer.prototype.old_render = function(score){
  var s = this.s = new ScoreObj(score);
  var nSystems = Math.ceil(s.melody.length/this.layout.measure_per_system);
  this.sys = [];
  for(var i=0;i<nSystems;++i){
    this.sys.push(new fabric.Rect({
      width:480,
      height:50,
      left:0,
      top:0,
      fill:'rgb(240,240,240)'
    }));
  }
  var top_padding = 30;
  var left_padding = 25;
  var system_dis = 30;
  this.c.clear();
  for(var i=0;i<nSystems;++i){
    this.sys[i].set({top:top_padding+(50+system_dis)*i, left:left_padding});
    this.c.add(mds.sys[i]);

  }
  this.c.renderAll();
  console.log('rendered');

};

var dur_mapper = ["16","8","8d","4","4","4d","4dd","2","2","2","2","2d","2d","2dd","2ddd","1"];
function dur_map(dur){
  dur = (dur*4) >>> 0;
  return dur_mapper[dur-1];
}
// m-th measure
ScoreRenderer.prototype.newStave = function(m){
  var i = m % this.layout.measure_per_system;
  var j = (m / this.layout.measure_per_system) >>> 0;
  var w = this.geo.system_width / this.layout.measure_per_system;
  var x = this.geo.left_padding + i * w;
  var y = this.geo.top_padding + j * (this.geo.system_height + this.geo.system_interval);
  //console.log(x,y,w);
  if(i % this.layout.measure_per_system == 0){
    return new Vex.Flow.Stave(x, y, w).addClef('treble');
  }else{
    return new Vex.Flow.Stave(x, y, w);
  }

};

ScoreRenderer.prototype.render = function(score){
  this.r.resize(1000,800);
  var ctx = this.ctx;
  var w = (this.geo.system_width / this.layout.measure_per_system * 0.9) >>> 0;
  var s = this.s = new ScoreObj(score);
  console.log(s)
  this.sys = [];
  for(var i=0;i < s.melody.length; ++i){
    var stave = this.newStave(i);
    var dur_tot = 0;
    var notes = s.melody[i].map(function(e){

      dur_tot += e[0];
      var duration =  dur_map(e[0]/s.ctrl_per_beat);
      var keys = [];
      if(typeof e[1] == 'number'){
        e[1] = [e[1]];
      }
      e[1].forEach(function(e1){
        if(key == undefined){

          var key = MG.pitchToKey(e1);
          //console.log('render', e1, key)
          if(typeof key != 'undefined'){
            keys.push(key.join('/'));
          }
        }
      });
      if(keys.length <= 0){
        keys.push('Bb/4'); // rest
        duration += 'r';
      }
      //console.log(duration, keys);
      var res = new Vex.Flow.StaveNote({keys:keys, duration: duration, auto_stem: true});
      if(duration.substr(-1)=='d'){
        res.addDotToAll();
        if(duration.substr(-2,1)=='d'){
          res.addDotToAll();
        }
      }
      return res;
    });


    // Create a voice in 4/4
    var num_beats = (dur_tot/s.ctrl_per_beat)>>>0;
    var voice = new Vex.Flow.Voice({
      num_beats: num_beats,
      beat_value: s.time_sig[1],
      resolution: Vex.Flow.RESOLUTION
    });

    // Add notes to voice
    voice.addTickables(notes);

    // Format and justify the notes to 500 pixels

    var formatter = new Vex.Flow.Formatter().
    joinVoices([voice]).format([voice], w-5);

    this.sys.push({voices:[voice],stave:stave});

  }

  this.sys.forEach(function(e){
    e.stave.setContext(ctx).draw();
    e.voices.forEach(function(v){v.draw(ctx, e.stave);});
  });

};
