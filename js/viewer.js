
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

(function(self) {

  var pdfDoc = null,
      pageNum = 1,
      pageRendering = false,
      pageNumPending = null,
      scale = 5,
      wrapper = document.getElementById('canvas-wrapper'),
      the_canvas = document.getElementById('the-canvas'),
      ctx = the_canvas.getContext('2d');
  var pdf_canvas_buffers = [];
  the_canvas.style.width = "100%"; //(ratio * 100) + "%";

  /**
   * Get page info from document, resize canvas accordingly, and render page.
   * @param num Page number.
   */
  function renderPage(num) {
    // TODO: limit buffer size
    console.log('pdf render page', num);
    pageRendering = true;
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
      var ratio = 8;
      var viewport = page.getViewport(scale);

      //console.log(viewport.width,viewport);
      var canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

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
        pdf_canvas_buffers[num - 1] = canvas;

        if (pageNumPending !== null) {
          // New page rendering is pending
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });


    });

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


  var pager = $('#pdf_pager');
  var UI = {
    prev: pager.find('.prev'),
    next: pager.find('.next'),
    page_num: pager.find('.page_num'),
    page_count: pager.find('.page_count')
  };

  /**
   * Displays previous page.
   */
  UI.prev.on('click', function () {
    if (pageNum <= 1) {
      return;
    }
    pageNum--;
    if (pdf_canvas_buffers[pageNum - 1] == null) {
      queueRenderPage(pageNum);
    }
    showPage(pageNum);
  });

  /**
   * Displays next page.
   */

  UI.next.on('click', function () {
    if (pageNum >= pdfDoc.numPages) {
      return;
    }
    pageNum++;
    if (pdf_canvas_buffers[pageNum - 1] == null) {
      queueRenderPage(pageNum);
    }
    showPage(pageNum); // should set Timeout
    if (pageNum + 1 < pdfDoc.numPages && pdf_canvas_buffers[pageNum] == null) {
      queueRenderPage(pageNum + 1); //pre rendering
    }
  });

  function showPage(num) {
    var canvas = pdf_canvas_buffers[num - 1];
    if (canvas == null) {
      console.log('null canvas');
      setTimeout(function () {
        showPage(num);
      }, 100);
      return false
    }
    the_canvas.width = canvas.width;
    the_canvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    // Update page counters
    UI.page_num.html(pageNum);
    return true;
  }

  /**
   * Asynchronously downloads PDF.
   */
  function load_pdf(pdfurl) {
    PDFJS.getDocument(pdfurl).then(function (pdfDoc_) {
      pdfDoc = pdfDoc_;
      pdf_canvas_buffers = [];
      pageNum = 1;
      UI.page_count.html(pdfDoc.numPages);
      // Initial/first page rendering
      renderPage(pageNum);
      showPage(pageNum);
      queueRenderPage(pageNum + 1);
    });
  }
  // export functionality
  self.load_pdf = load_pdf;

})(this);