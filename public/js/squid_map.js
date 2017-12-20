$(function(){

                $.fn.OnDraggable = function () {
                        $(this).draggable({containment:'#view',
                            start:function(e,ui){
                                console.log(ui.position);
                                socket.emit('c2s_broadcast', {
                                    act: 'drag_start',
                                    x:ui.position.left,
                                    y:ui.position.top,
                                    id:$(ui.helper).data('id')
                                });
                            },
                            drag:function(e,ui){
                                socket.emit('c2s_broadcast', {
                                    act: 'drag',
                                    x:ui.position.left,
                                    y:ui.position.top,
                                    id:$(ui.helper).data('id')
                                });

                            },
                            stop:function(e,ui){
                                socket.emit('c2s_broadcast', {
                                    act: 'drag_stop',
                                    x:ui.position.left,
                                    y:ui.position.top,
                                    id:$(ui.helper).data('id')
                                });
                            }
                    });
                  return $();
               };
                var drag = false;
                var weapon_id = 0;
                var remote_draw = [0,0,0,0];
                var layer_length = 4;
                var now_canvas = 0;
                var canvas_size = {
                    width:$('.canvas')[0].width,
                    height:$('.canvas')[0].height
                }

                var num_of_magnets = 8;

                console.log(canvas_size);

                var canvases = [];
                var ctxs = [];

                var map_src_list = ['walleye.png','saltspray.png','urchin.png','blackbelly.png','arowana.png','mackerel.png','kelp.png','bluefin.png','moray.png','triggerfish.png','flounder.png','hammerhead.png','alfonsino.png','mahi-mahiA.png','mahi-mahiB.png','piranha.png','ancho-v.png'];

                var map_name_src = [
                    {
                        name:"ガンガゼ音楽堂",
                        thumbnail:"/img/thumnail/gangaze.png",
                        src:"/img/map/gangaze.jpg"
                    },
                    {
                        name:"モズク農園",
                        thumbnail:"/img/thumnail/mozuku.jpg",
                        src:"/img/map/mozuku.jpg"
                    },
                    {
                        name:"ホッケ埠頭",
                        thumbnail:"/img/thumnail/hokke.png",
                        src:"/img/map/hokke.jpg"
                    },
                    {
                        name:"エンガワ河川敷",
                        thumbnail:"/img/thumnail/engawa.jpg",
                        src:"/img/map/engawa.jpg"
                    },
                    {
                        name:"フジツボスポーツクラブ",
                        thumbnail:"/img/thumnail/hujitsubo.png",
                        src:"/img/map/hujitsubo.jpg"
                    },
                    {
                        name:"モズク農園",
                        thumbnail:"/img/thumnail/mozuku.jpg",
                        src:"/img/map/mozuku.jpg"
                    },
                    {
                        name:"チョウザメ造船所",
                        thumbnail:"/img/thumnail/chouzame.png",
                        src:"/img/map/chouzame.jpg"
                    },
                    {
                        name:"海女美術大学",
                        thumbnail:"/img/thumnail/amabi.png",
                        src:"/img/map/amabi.jpg"
                    },
                    {
                        name:"タチウオパーキング",
                        thumbnail:"/img/thumnail/tachiuo.png",
                        src:"/img/map/tachiuo.jpg"
                    },
                    {
                        name:"コンブトラック",
                        thumbnail:"/img/thumnail/konbu.png",
                        src:"/img/map/konbu.jpg"
                    },

                ];

                var $slider = $('#layer_opacity').slider({
                    min:0,
                    max:100,
                    range:'max',
                    value:100,
                    slide: function(event,ui){
                        $('#draw_area'+now_canvas).css('opacity', ui.value/100);
                        socket.emit('c2s_broadcast',{
                            act:'change_layer_opacity',
                            layer:now_canvas,
                            opacity:ui.value/100
                        });
                    }

                });

                $('#pen_size').slider({
                    min:1,
                    max:30,
                    step:1,
                    value:4,
                    slide: function(event,ui){
                        ctx.lineWidth = ui.value;
                        $(this).children('.sentence').text(ui.value);
                    }
                }).children('.sentence').text('4');

                $("#sidebar").tabs();
                $("#weapon_list > li").draggable({ 
                        opacity: 0.7,
                        zIndex: 99,
                        helper: "clone",
                        containment: "window"
                 });

                $('[name="rule"]').change(function(event) {
                    console.log($(this).val());
                    socket.emit('c2s_broadcast',{
                        act:'select_rule',
                        rule:$(this).val()
                    });
                });

                $('.layer_tag').dblclick(function() {
                    $that = $(this);
                    $that.css( 'display', 'none');
                    $('#'+$that.attr('id') + '-edit')
                        .val( $that.text())
                        .css( 'display', '')
                        .focus();
                });
                $('.layer_tag_edit').blur(function() {
                    $that = $(this);
                    $that.css( 'display', 'none');
                    $('#'+$that.attr('name'))
                        .text($that.val())
                        .css( 'display', '');
                    socket.emit('c2s_broadcast',{
                        act:'change_layer_name',
                        target:$that.attr('name'),
                        name:$that.val()
                    });
                });


                $('.canvas').each(function(index, el) {
                    var index = $(this).data('id');
                    canvases[index] = this;
                    ctxs[index] = canvases[index].getContext('2d');
                    ctxs[index].lineCap="round";
                });
        		var canvas = canvases[0];
        		var ctx = ctxs[0];

        		var down = false;

////////////////////////////////////////////////////////// CANVAS 描写処理
/////////////////////////////////////////////////////////////////////////// ペン機能

            var function_for_canvas = {
                    'mousedown.pen touchstart.pen': function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        if((e.type == 'mousedown' && e.which != 1) || remote_draw[now_canvas]) return;
                        var rect = e.target.getBoundingClientRect() ;
                        down = true;
                        var X = (e.type == 'touchstart')?event.touches[0].clientX:e.clientX;
                        var Y = (e.type == 'touchstart')?event.touches[0].clientY:e.clientY;
                        ctx.beginPath();
            //              ctx.arc(e.clientX - rect.left , e.clientY - rect.top, 0.7, 0, 2*Math.PI, false);
                             // ctx.fill();
                        ctx.moveTo(X - rect.left , Y - rect.top);
                        socket.emit('c2s_broadcast',{
                            act: "down",
                            x: X - rect.left,
                            y: Y - rect.top,
                            color: ctx.strokeStyle,
                            lineWidth:ctx.lineWidth,
                            gCO: ctx.globalCompositeOperation,
                            layer:now_canvas
                        });
                    },
                    'mousemove.pen touchmove.pen' : function(e){
                        if(e.type == 'touchstart'){
                            console.log(event.touches.length );
                            if(event.touches.length > 1) return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        var rect = e.target.getBoundingClientRect() ;
                        if(!down || drag) return;
                        var X = (e.type == 'touchmove')?event.touches[0].clientX:e.clientX;
                        var Y = (e.type == 'touchmove')?event.touches[0].clientY:e.clientY;

                        ctx.lineTo(X - rect.left , Y - rect.top);
                        ctx.lineCap="round";
                        ctx.stroke();
                        socket.emit('c2s_broadcast',{
                            act: "move",
                            x: X - rect.left,
                            y: Y - rect.top,
                            layer:now_canvas
                        });
                    },
                    'mouseup.pen touchend.pen' : function(e){
                        if(e.type == 'touchstart'){
                            console.log(event.touches.length );
                            if(event.touches.length > 1) return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        var rect = e.target.getBoundingClientRect() ;
                        if(!down) return;
                        var X = (e.type == 'touchend')?event.changedTouches[0].clientX:e.clientX;
                        var Y = (e.type == 'touchend')?event.changedTouches[0].clientY:e.clientY;

                        ctx.lineTo(e.clientX - rect.left , e.clientY - rect.top);
                        // ctx.lineCap="round";
                        ctx.stroke();
                        ctx.closePath();
                        down = false;
                        socket.emit('c2s_broadcast',{
                            act: "up",
                            x: X - rect.left,
                            y: Y - rect.top,
                            layer:now_canvas
                        });
                    }
                };


                $('.canvas').on(function_for_canvas);

///////////////////////////////////////////////////////////////////////////// アイコンドラッグ機能
                for (var i = 0; i < num_of_magnets; i++) {
                    var magnet = '<div id="magnet_'+i+'" id="magnet_'+i+'" class="magnet" data-id="'+i+'" style="positiion:absolute"><img src="img/weapon/squid_ico_pink.png" class="magnet_image"></div>';
                    $(magnet).appendTo('#view').css({
                        left:i*24 + 'px',
                        top:0
                    });
                };

                $('.magnet').draggable({containment:'#view',
                            start:function(e,ui){
                                $(this).children('.magnet_image').css({
                                    'height':'40px',
                                    'width':'48px'
                                });
                                socket.emit('c2s_broadcast', {
                                    act: 'drag_start',
                                    x:ui.position.left,
                                    y:ui.position.top ,
                                    id:$(ui.helper).data('id')
                                });
                            },
                            drag:function(e,ui){
                                socket.emit('c2s_broadcast', {
                                    act: 'drag',
                                    x:ui.position.left,
                                    y:ui.position.top,
                                    id:$(ui.helper).data('id')
                                });

                            },
                            stop:function(e,ui){
                                $(this).children('.magnet_image').css({
                                    'height':'20px',
                                    'width':'24px',
                                    'left':'0'
                                });
                                socket.emit('c2s_broadcast', {
                                    act: 'drag_stop',
                                    x:ui.position.left,
                                    y:ui.position.top,
                                    id:$(ui.helper).data('id')
                                });
                            }
                }).css('position','absolute');
/////////////////////////////////////////////////////////////////////////////
                $('.tools').on('click',function(e){
                    $(this).siblings('.tools.on').removeClass('on');
                    $(this).addClass('on');

                    switch($(this).data('tool')){
                        case 'pen':
                            ctx.globalCompositeOperation = 'source-over';
                            break;
                        case 'eraser':
                            ctx.globalCompositeOperation = 'destination-out';
                            break;
                        case 'save':
                            var image_ctx = $('#draw_area-1')[0].getContext('2d');
                            var map = new Image;
                            $(map).load(function(event){
                                back = $(event.target)[0];
                                var size_ratio = (back.height > back.width)? $('#draw_area-1')[0].height/back.height:$('#draw_area-1')[0].width/back.width;
                                console.log(back.height > back.width);
                                image_ctx.drawImage(back,($('#draw_area-1')[0].width-map.width * size_ratio)/2,0,map.width * size_ratio,map.height * size_ratio);
                                var i = 0;
                                $.each(canvases,function(index, el) {
                                    var image = new Image;
                                    image.onload = function(){
                                        image_ctx.globalAlpha = $(this).css('opacity');
                                        image_ctx.drawImage(image,0,0);
                                        i++;
                                        if(i == canvases.length){
                                            document.getElementById("save_a").href = image_ctx.canvas.toDataURL().replace('image/png','applicatipn/octed-stream');
                                            $('#save_a')[0].click();
                                        }
                                    }
                                    image.src = el.toDataURL();
                                });
                            });
                            $(map).attr(
                                "src",map_name_src[$('#view').data('mapnum')].src
                            );
                            break;
                    }
                });

                $('.color').on('click', function(e){
                    var color = $(this).css('background-color');
                    ctx.strokeStyle = color;
                    $(this).siblings('.color.on').removeClass('on');
                    $(this).addClass('on');
                    $('#pen_color').css('background-color', color);
                });


////////////////////////////////////////////////////////////////// s2c_broadcast 受信処理




                socket.on('s2c_broadcast', function(data) {
                    switch (data.act) {
                        case "down":
                            remote_draw[data.layer] = true;
                            ctxs[data.layer].save();
                            ctxs[data.layer].lineWidth = data.lineWidth;
                            ctxs[data.layer].strokeStyle = data.color;
                            ctxs[data.layer].globalCompositeOperation = data.gCO;
                            ctxs[data.layer].beginPath();
                            ctxs[data.layer].moveTo(data.x, data.y);
                            break;
                        case "move":
                            if (!remote_draw[data.layer]) return;
                            ctxs[data.layer].lineTo(data.x, data.y);
                            ctxs[data.layer].stroke();
                            break;

                        case "up":
                            if (!remote_draw[data.layer]) return;
                            // console.log("u_remote: " + data.x, data.y);
                            ctxs[data.layer].lineTo(data.x, data.y);
                            ctxs[data.layer].stroke();
                            ctxs[data.layer].closePath();
                            remote_draw[data.layer] = false;
                            ctxs[data.layer].restore();


                            break;
                         case "drag_start":
                             $("#magnet_"+data.id).draggable('disable');
                             $("#magnet_"+data.id).css({
                                 left: data.x,
                                 top: data.y
                             });
                            break;

                         case "drag":
                             $("#magnet_"+data.id).css({
                                 left: data.x,
                                 top: data.y
                             });
                            break;

                         case "drag_stop":
                             $("#magnet_"+data.id).css({
                                 left: data.x,
                                 top: data.y
                             });
                             $("#magnet_"+data.id).draggable('enable');
                            break;

                        case "change_layer_opacity":
                            $('#draw_area' + data.layer ).css('opacity',data.opacity);
                            if (data.layer == now_canvas) {
                                 $slider.slider('value', data.opacity*100);
                            };
                            break;

                        case 'change_visibility_of_canvas':
                            if(data.turn){
                                $('#layer'+data.num+'').find('.see').removeClass('off');
                                $('#draw_area'+data.num+'').css('visibility','visible');
                            }else{
                                $('#layer'+data.num+'').find('.see').addClass('off');
                                $('#draw_area'+data.num+'').css('visibility','hidden');
                            }
                        break;

                        case "clear_rect":
                            ctxs[data.num].clearRect(0,0,canvas_size.width,canvas_size.height);
                            break;


                        case "sort_layer":
                            $.each(data.result, function(index, val) {
                                var num = $('#'+val).data('layer');
                                $('#draw_area'+num).appendTo('#view');
                                $('#addlayer').before($('#layer'+num));
                            });
                            break;

                        case "change_map":
                            var num = data.num;
                            $this = $(".map[data-num='"+num+"']");
                            $(".map").removeClass('active');
                            $this.addClass('active');
                            $('#view').css('background-image', 'url('+map_name_src[num].src+')').data('mapnum',num);
                        break;

                        case "change_layer_name":
                            console.log('#'+data.target);
                            $('#'+data.target).text(data.name);
                        break;

                        case "select_rule":
                            console.log(data.rule);
                            $('[name="rule"]').val(data.rule);
                        break;
                    }
                });

                socket.on('s2c_emit',function(data){
                    switch(data.act){
                        case 'new_member':
                            $('#member_list > li').remove();
                            $.each(data.name, function(index, val) {
                                $('<li id="_'+val+'_">'+val+'</li>').appendTo('#member_list');
                            });
                            if(data.name.length == 1){
                                if(localStorage.getItem(room) != null){
                                    if(confirm('同じ名前の部屋データが残っています。復元しますか？')){
                                        var data = localStorage.getItem(room);
                                        if(data != null){
                                            Sync(JSON.parse(data));
                                        }
                                    }
                                    localStorage.removeItem(room);
                                }
                            }
                            break;
                        case 'disconnect_member':
                            $('#_'+data.name+'_').remove();
                            break;
                    }
                });

//////////////////////////////////////////////// Layer /////////////////////////////////
                $('#layer_list').sortable({
                    "items":"tr.layer_s",
                    update: function(e, ui) {
                            var result = $('#layer_list').sortable('toArray');
                            $.each(result, function(index, val) {
                                var num = $('#'+val).data('layer');
                                $('.canvas').last().after($('#draw_area'+num));
                            });
                            socket.emit('c2s_broadcast',{
                                act:'sort_layer',
                                result:result
                            });
                        }
                });

                $('#layer_list').on('click','.layer',function(){
                    $(this).siblings('.on').removeClass('on');
                    $(this).addClass('on');

                    var num = $(this).data('layer');
                    ChangeCanvas(num);
                });

                $('#layer_list').on('click','.see',function(){
                    var num = $(this).parent('.layer').data('layer');
                    if (!$(this).hasClass('off')) {
                        $(this).addClass('off');
                        $('#draw_area'+num+'').css('visibility', 'hidden');
                    }else{
                        $(this).removeClass('off');
                        $('#draw_area'+num+'').css('visibility', 'visible');
                    }
                    socket.emit('c2s_broadcast',{
                        act:'change_visibility_of_canvas',
                        num:num,
                        turn:!$(this).hasClass('off')
                    });
                });

                $('#layer_list').on('click','.clear_rect',function(){
                    var num = $(this).parent('.layer').data('layer');
                    ctxs[now_canvas].clearRect(0,0,canvas_size.width,canvas_size.height);
                            socket.emit('c2s_broadcast',{
                                act:'clear_rect',
                                num:num
                            });
                });

////////////////////////////////////////////////////////////////// 合流機能start

                socket.on('new_member', function(name){
                    var value = {
                        name:name,
                        data:ViewData()
                    }
                    socket.emit('canvas_data',value);
                });

                function ViewData(){
                    var data = {
                        layer:[],
                        canvases:[
                        ],
                        magnets:[
                        ],
                        map:$('#view').data('mapnum'),
                        rule:$('[name="rule"]').val()
                    }
                    $('.layer').each(function(index, el) {
                        var name = $(el).find('span').text();
                        data.layer.push(name);
                    });

                    $.each(canvases, function(index, val) {
                        data.canvases[index] = {
                            num:index,
                            image:val.toDataURL(),
                            opacity:$('#draw_area'+index).css('opacity')
                        }
                    });

                    $('.magnet').each(function(index, el) {
                        data.magnets.push({
                            id : $(el).data('id'),
                            pos : {
                                    top:$(el).css('top'),
                                    left:$(el).css('left')
                                }
                        });
                    });
                    return data;
                }


                socket.on('canvas_data', function(data){
                    Sync(data);
                });

                function Sync(data){
                    console.log(data);
                    /////rule同期
                    $('[name="rule"]').val(data.rule);
                    /////mapを読み込む
                    var num = data.map;
                    $this = $(".map[data-num='"+num+"']");
                    $(".map").removeClass('active');
                    $this.addClass('active');

                    $('#view').data('num',num).css('background-image', 'url('+map_name_src[num].src+')').data('mapnum',num);
                    /////canvasnの同期
                    $.each(data.canvases,function(index, val) {
                        var image = new Image();
                        image.src = val.image;
                        image.onload = function(){
                            ctxs[val.num].drawImage(image,0,0);
                        }
                        $('#draw_area'+val.num).css('opacity', val.opacity);
                        if (val.opacity == 0) {
                            $('#layer'+val.num).children('.see').data('view',false);
                        };
                    });
                    /////magnetの位置同期
                    $.each(data.magnets, function(index, val) {
                            $('#magnet_'+val.id).css({
                                position:'absolute',
                                left:val.pos.left,
                                top:val.pos.top
                            });
                    });
                    //////レイヤー名の反映
                    $.each(data.layer, function(index, val) {
                        $('#layer_tag'+index).text(val);
                    });
                }


///////////////////////////////////////////////////////////////合流機能end
                function ChangeCanvas(num){
                    var lineWidth = ctx.lineWidth;
                    var color = ctx.strokeStyle;
                    var gCO = ctx.globalCompositeOperation;
                    now_canvas = num;
                    // console.log('draw_area'+num+'')
                    canvas = canvases[num]
                    // console.log(canvas);
                    ctx = ctxs[num];
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = color;
                    ctx.globalCompositeOperation = gCO;
                    $slider.slider('value', $('#draw_area'+num+'').css('opacity')*100);
                }
/////////////////////////////////////////////////////////////////// localstorageのunload処理

    $(window).unload(function(){
        var data = ViewData();
        localStorage.setItem( room, JSON.stringify(data) );
    });


///////////////////////////////////////////////////////////////////// footer操作
                $('#footer').click(function(){
                    if($(this).hasClass('hidden')){
                        $(this).removeClass('hidden');
                    }else{
                        $(this).addClass('hidden');
                    }
                });

                $('input[name=mode]:radio').change(function(e){
                    var val = $('input[name=mode]:checked').attr('id');
                    $('.mode_sentence').removeClass('active');
                    $('label[for='+val+']').addClass('active');
                    $('.canvas').off('.pen');
                    switch (val){
                        case'pen_mode':
                            $('.canvas').on(function_for_canvas);
                            break;

                        case 'move_mode':
                            break;
                    }
                })
//////////////////////////////////////////////////////////////////////// マップアイコン生成 & マップ変更処理
                $.each(map_name_src, function(index, val) {
                    $('<li class="map" data-num="'+index+'"><img src="'+val.thumbnail+'"><div class="map_name">'+val.name+'</div></li>').appendTo('#map_list').click(function(e){
                        var num = $(this).data('num');
                        $('.map').removeClass('active');
                        $(this).addClass('active');
                        $('#view').css('background-image', 'url('+val.src+')').data('mapnum',num);
                        socket.emit('c2s_broadcast', {
                            act: 'change_map',
                            num: num
                        });
                    });
                });
                $('.map').first().addClass('active');





});