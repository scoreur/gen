
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
