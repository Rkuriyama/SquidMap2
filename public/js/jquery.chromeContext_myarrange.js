(function ($) {
  var cctxId = 0;
  
  $.fn.chromeContext = function (options) {
    var menu = $('<div class="cctx"/>');
    var l = options.items.length;
    var i;
    
    for (i = 0; i < l; i++) {
      var item = options.items[i];
      var el = $('<div/>');
      
      if (item.separator) {
        el.addClass('cctx-separator');
      } else {
        el.addClass('cctx-item');
        el.text(item.title);
        console.log(item.onclick);
        el.bind('click', item.onclick);
      }
      
      menu.append(el);
    }
    
    menu.attr('data-cctxId', cctxId);
    
    $('body').append(menu);
    
    this
      .attr('data-cctxId', cctxId)
      .on('contextmenu', function (e) {
        var menu = $('.cctx[data-cctxId="'+ $(this).attr('data-cctxId') +'"]');
        
        e.preventDefault();
                
        menu
          .css('top', e.clientY)
          .css('left', e.clientX)
          .show();
      })
      .parents()
        .on('click', function () {
          $('.cctx:visible').hide();
        });
    
    cctxId++;


    return this;
  };
}( jQuery ));