// (function ($) {
//          .ejsにおいて、socketを定義している。   
// }(jQuery))


$(function(){

                $.fn.OnDraggable = function () {
                        $(this).draggable({containment:'#view',
                                                    start:function(e,ui){
                                                        // console.log(ui.position);
                                                        // console.log($(ui.helper).data('w_id'));
                                                        socket.emit('c2s_broadcast', {
                                                            act: 'drag_start',
                                                            x:ui.position.left,
                                                            y:ui.position.top,
                                                            id:$(ui.helper).data('w_id')
                                                        });
                                                    },
                                                    drag:function(e,ui){
                                                        // console.log(ui.position);
                                                        // console.log($(ui.helper).data('w_id'));
                                                        socket.emit('c2s_broadcast', {
                                                            act: 'drag',
                                                            x:ui.position.left,
                                                            y:ui.position.top,
                                                            id:$(ui.helper).data('w_id')
                                                        });

                                                    },
                                                    stop:function(e,ui){
                                                        // console.log(ui.position);
                                                        // console.log($(ui.helper).data('w_id'));
                                                        socket.emit('c2s_broadcast', {
                                                            act: 'drag_stop',
                                                            x:ui.position.left,
                                                            y:ui.position.top,
                                                            id:$(ui.helper).data('w_id')
                                                        });
                                                    }
                                                });
                  return $();
               };
                var drag = false;
                var weapon_id = 0;
                var remote_draw = false;
                var layer_length = 0;
                var now_canvas = 0;

                var canvases = [];
                var ctxs = [];

                var map_src_list = ['walleye.png','saltspray.png','urchin.png','blackbelly.png','arowana.png','mackerel.png','kelp.png','bluefin.png','moray.png','triggerfish.png','flounder.png','hammerhead.png','alfonsino.png','mahi-mahiA.png','mahi-mahiB.png','piranha.png','ancho-v.png'];

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

                })

                $("#sidebar").tabs();
                $("#weapon_list > li").draggable({ 
                        opacity: 0.7,
                        zIndex: 99,
                        helper: "clone",
                        containment: "window"
                 });

                $("#view").droppable({
                    accept:'li.origin',
                    drop:function(e,u){
                        console.log(u.position);
                        console.log($(this).position());
                        var x = u.position.left - $(this).position().left + 12;
                        var y = u.position.top - $(this).position().top + 10;

                        obj = $(u.draggable[0].innerHTML).appendTo(this).css({
                            position:'absolute',
                            top:y + 'px',
                            left:x + 'px'
                        }).data('w_id', weapon_id).attr('id', 'weapon_'+weapon_id).addClass('copy weapon').OnDraggable();

                        weapon_id++;

                        socket.emit('c2s_broadcast',{
                            act:'add_w',
                            weapon:$(u.draggable[0].innerHTML).attr('src'),
                            x:x,
                            y:y
                        });
                    }
                });


                $("#view").on('dblclick', '.copy', function(e){
                        e.stopPropagation();
                        var num = $(this).attr('id');
                        // console.log(num);
                        $(this).remove();
                        socket.emit('c2s_broadcast', {
                            act:'delete_w',
                            id: num
                        });
                    });




        		var canvas = document.getElementById('draw_area0');
                canvases[0] = document.getElementById('draw_area0');
        		var ctx = canvas.getContext('2d');
                ctxs[0] = canvases[0].getContext('2d');
        		ctx.lineWidth = 2;
        		ctx.strokeStyle = '#9eala3';




                $('.psize').on('click',function(){
                    $(this).siblings('.psize.on').removeClass('on');
                    $(this).addClass('on');
                    ctx.lineWidth = $(this).data('size');
                });


                $('#map_select_menu').change(function(event) {
                    var value = map_src_list[$(this).val()];
                    $('#view').css('background-image', 'url("/img/map/'+value+'")').data('mapnum',$(this).val());
                    console.log(value);
                    socket.emit('c2s_broadcast', {
                        act: 'change_map',
                        src: $(this).val()
                    });
                });


        		var down = false;

////////////////////////////////////////////////////////// CANVAS 描写処理
        			$('canvas').click(function(event) {
        				event.stopPropagation();
        			});
        		$('#view').on('mousedown','canvas', function(e) {
                        if(e.which != 1 || remote_draw) return;
                        var rect = e.target.getBoundingClientRect() ;
        				e.stopPropagation();
        				down = true;
        				ctx.beginPath();
	        // 				ctx.arc(e.clientX - rect.left , e.clientY - rect.top, 0.7, 0, 2*Math.PI, false);
	 						 // ctx.fill();
        				ctx.moveTo(e.clientX - rect.left , e.clientY - rect.top);
                        socket.emit('c2s_broadcast',{
                            act: "down",
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            color: ctx.strokeStyle,
                            lineWidth:ctx.lineWidth,
                            gCO: ctx.globalCompositeOperation,
                            layer:now_canvas
                        });
        			});
        		$('#view').on('mousemove','canvas', function(e){
                        var rect = e.target.getBoundingClientRect() ;

                        if(!down || drag) return;
        				e.stopPropagation();

        				ctx.lineTo(e.clientX - rect.left , e.clientY - rect.top);
        				ctx.stroke();
                        socket.emit('c2s_broadcast',{
                            act: "move",
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            layer:now_canvas
                        });
        			});
        		$('#view').on('mouseup','canvas', function(e) {
                        var rect = e.target.getBoundingClientRect() ;
        				e.stopPropagation();
        				if(!down) return;
        				ctx.lineTo(e.clientX - rect.left , e.clientY - rect.top);
        				ctx.stroke();
        				ctx.closePath();
        				down = false;
                        socket.emit('c2s_broadcast',{
                            act: "up",
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            layer:now_canvas
                        });
        			});
/////////////////////////////////////////////////////////////////////////////
                $('.tools').on('click',function(){
                    $(this).siblings('.tools.on').removeClass('on');
                    $(this).addClass('on');

                    switch($(this).data('tool')){
                        case 'pen':
                            ctx.globalCompositeOperation = 'source-over';
                            break;
                        case 'eraser':
                            ctx.globalCompositeOperation = 'destination-out';
                            break;
                        // case 'save':
                        //     var content = JSON.stringify(ViewData());
                        //     var blob = new Blob([ content ], { "type" : "text/plain" });

                        //         document.getElementById("save_a").href = window.URL.createObjectURL(blob);
                        //     break;
                    }
                });

                $('.color').on('click', function(e){
                    var color = $(this).css('background-color');
                    ctx.strokeStyle = color;
                    $(this).siblings('.color.on').removeClass('on');
                    $(this).addClass('on');
                });

                // $('#undo').button({text:false,icons:{primary:"ui-icon-arrowreturnthick-1-w"}});
                // $('#redo').button({text:false,icons:{primary:"ui-icon-arrowreturnthick-1-e"}})


////////////////////////////////////////////////////////////////// s2c_broadcast 受信処理




                socket.on('s2c_broadcast', function(data) {
                    switch (data.act) {
                        case "down":
                            // console.log("d_remote: " + data.x, data.y);
                    // console.log(ctxs);
                            remote_draw = true;
                            ctxs[data.layer].save();
                            ctxs[data.layer].lineWidth = data.lineWidth;
                            ctxs[data.layer].strokeStyle = data.color;
                            ctxs[data.layer].globalCompositeOperation = data.gCO;
                            ctxs[data.layer].beginPath();
                            ctxs[data.layer].moveTo(data.x, data.y);
                            break;
                        case "move":
                            if (!remote_draw) return;
                            // console.log("m_remote: " + data.x, data.y);
                            ctxs[data.layer].lineTo(data.x, data.y);
                            ctxs[data.layer].stroke();
                            break;

                        case "up":
                            if (!remote_draw) return;
                            // console.log("u_remote: " + data.x, data.y);
                            ctxs[data.layer].lineTo(data.x, data.y);
                            ctxs[data.layer].stroke();
                            ctxs[data.layer].closePath();
                            remote_draw = false;
                            ctxs[data.layer].restore();


                            break;

                        case 'add_w':
                            var src = data.weapon;
                            var obj = $('<img class="weapon" src="'+src+'">').css({
                                position:'absolute',
                                left:data.x,
                                top:data.y
                            }).data('w_id', weapon_id).attr('id', 'weapon_'+weapon_id);
                            weapon_id++;
                            obj.appendTo('#view').addClass('copy').OnDraggable();
                        break;

                         case "drag_start":
                             $("#weapon_"+data.id).draggable('disable');
                             $("#weapon_"+data.id).css({
                                 left: data.x,
                                 top: data.y
                             });
                            break;

                         case "drag":
                             $("#weapon_"+data.id).css({
                                 left: data.x,
                                 top: data.y
                             });
                            break;

                         case "drag_stop":
                             $("#weapon_"+data.id).css({
                                 left: data.x,
                                 top: data.y
                             });
                             $("#weapon_"+data.id).draggable('enable');
                            break;

                        case "delete_w":
                            // console.log(data);
                            $('#' +data.id).remove();
                            break;
                         
                        case "add_layer":
                            layer_length++;
                            if(data.layer == layer_length){
                                 $('#addlayer').before('<tr id="layer'+layer_length+'" class="layer layer_s" data-layer="'+layer_length+'"><td>layer'+layer_length+'</td><td class="see" data-view="true">○</td></tr>');
                                 $('#view canvas').last().after('<canvas id="draw_area'+layer_length+'" width="800" height="600"></canvas>');
                                 canvases[layer_length] = document.getElementById('draw_area'+layer_length+'');
                                 ctxs[layer_length] = canvases[layer_length].getContext('2d');
                            }
                            break;
                       case "delete_layer":
                             if (data.layer == layer_length) {layer_length--;};
                             $('#draw_area' + data.layer ).remove(); 
                             $('#layer'+ data.layer).remove();
                       break;

                       case "change_layer_opacity":
                            $('#draw_area' + data.layer ).css('opacity',data.opacity);
                            if (data.layer == now_canvas) {
                                 $slider.slider('value', data.opacity*100);
                            };
                            break;

                        case "sort_layer":
                            $.each(data.result, function(index, val) {
                                var num = $('#'+val).data('layer');
                                $('#draw_area'+num).appendTo('#view');
                                $('#addlayer').before($('#layer'+num));
                            });
                            break;

                        case "change_map":
                            $('#map_select_menu').val(data.src);
                            var src = map_src_list[data.src];
                            $('#view').css('background-image', 'url("/img/map/'+src+'")').data('mapnum',data.src);
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
                                $('canvas').last().after($('#draw_area'+num));
                            });
                            socket.emit('c2s_broadcast',{
                                act:'sort_layer',
                                result:result
                            });
                            // console.log(result);
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
                    if ($(this).data('view') == 'true') {
                        $(this).data('view','false').text('×');
                        $('#draw_area'+num+'').css('opacity', '0');
                    }else{
                        $(this).data('view','true').text('○');
                        $('#draw_area'+num+'').css('opacity', '1');
                    }
                });

                $('#addlayer').on('click', function(event) {
                    event.preventDefault();
                    layer_length++;
                    $(this).before('<tr id="layer'+layer_length+'" class="layer layer_s" data-layer="'+layer_length+'"><td>layer'+layer_length+'</td><td class="see" data-view="true">○</td></tr>');
                    $('canvas').last().after('<canvas id="draw_area'+layer_length+'" width="800" height="600"></canvas>');
                    canvases[layer_length] = document.getElementById('draw_area'+layer_length+'');
                    ctxs[layer_length] = canvases[layer_length].getContext('2d');

                    socket.emit('c2s_broadcast',{
                            act: "add_layer",
                            layer:layer_length
                        });
                });
                $('#deletelayer').on('click',function(event){
                    event.preventDefault();
                    var now_canvas = $('.layer.on').data('layer')
                    if(now_canvas != 0 ){
                        if(now_canvas == layer_length){
                            layer_length--;
                        }
                        canvases[now_canvas] = null;
                        $('#draw_area' + now_canvas ).remove(); 
                        $('.layer.on').remove();
                        socket.emit('c2s_broadcast',{
                            act: "delete_layer",
                            layer:now_canvas
                        });
                    }else{

                    }
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
                        list:[],
                        canvases:[
                        ],
                        weapons:[
                        ],
                        map:$('#view').data('mapnum')
                    }
                    $('.layer').each(function(index, el) {
                        var num = $(el).data('layer');
                        data.list.push(num);
                    });

                    $.each(data.list, function(index, val) {
                        data.canvases[index] = {
                            num:val,
                            image:canvases[val].toDataURL(),
                            opacity:$('#draw_area'+val).css('opacity')
                        }
                    });

                    $('.weapon').each(function(index, el) {
                        data.weapons.push({
                            id : $(el).data('w_id'),
                            src : $(el).attr('src'),
                            pos : $(el).position(),
                        });
                    });
                    // console.log(data);
                    return data;
                }


                socket.on('canvas_data', function(data){
                    /////mapを読み込む
                            $('#map_select_menu').val(data.map);
                    var map_src = map_src_list[data.map];
                    $('#view').css('background-image', 'url("/img/map/'+map_src+'")').data('mapnum',data.map);
                    /////レイヤーリスト&キャンバスの作成.
                    var max_layer_length = 0;
                    $.each(data.list, function(index, val) {
                        if (val != 0) {
                            if (max_layer_length <= val) {max_layer_length = val;};
                            $('#addlayer').before('<tr id="layer'+val+'" class="layer layer_s" data-layer="'+val+'"><td>layer'+val+'</td><td class="see" data-view="true">○</td></tr>');
                            $('canvas').last().after('<canvas id="draw_area'+val+'" width="800" height="600"></canvas>');
                        };
                        canvases[val] = document.getElementById('draw_area'+val+'');
                        ctxs[val] = canvases[val].getContext('2d');
                    });
                    layer_length = max_layer_length;
                    /////canvasnのロード
                    $.each(data.canvases,function(index, val) {
                        var image = new Image();
                        image.src = val.image;
                        image.onload = function(){
                            ctxs[val.num].drawImage(image,0,0);
                        }
                        $('#draw_area'+val.num).css('opacity', val.opacity);
                    });
                    /////ブキの追加
                    $.each(data.weapons, function(index, val) {
                            var obj = $('<img class="weapon" src="'+val.src+'">').css({
                                left:val.pos.left,
                                top:val.pos.top
                            }).data('w_id', val.id).attr('id', 'weapon_'+val.id);
                            weapon_id++;
                            obj.appendTo('#view').addClass('copy').OnDraggable();
                    });
                });

///////////////////////////////////////////////////////////////合流機能end



                function ChangeCanvas(num){
                    var lineWidth = ctx.lineWidth;
                    var color = ctx.strokeStyle;
                    var gCO = ctx.globalCompositeOperation;
                    now_canvas = num;
                    // console.log('draw_area'+num+'')
                    canvas = document.getElementById('draw_area'+num+'');
                    // console.log(canvas);
                    ctx = canvas.getContext('2d');
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = color;
                    ctx.globalCompositeOperation = gCO;
                    $slider.slider('value', $('#draw_area'+num+'').css('opacity')*100);
                }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

});