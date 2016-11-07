$(function(){
                var drag = false;
                var weapon_id = 0;
                var remote_draw = false;

                var socket = io().connect('http://localhost:3000');
                socket.on('connect', function(data){
                    console.log('connect session:');
                });



                $("#sidebar").tabs();
                $("#weapon_list > li").draggable({ 
                        opacity: 0.7,
                        helper: "clone",
                        containment: "window"
                 });


                $("#view").droppable({
                    accept:'li.origin',
                    drop:function(e,u){
                        obj = u.draggable.children().clone().css({
                            width: '24',
                            height: '20',
                            border: '1px solid gray',
                            "border-radius": '5px',
                        }).data('w_id', weapon_id).attr('id', 'weapon_'+weapon_id);
                        weapon_id++;

                        socket.emit('c2s_broadcast',{
                            act:'add_w',
                            weapon:obj.attr('src')
                        });

                        obj.appendTo(this).addClass('copy')
                            .draggable({container:'#view',
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
                    }
                });


                $("#view").on('dblclick', '.copy', function(e){
                        e.stopPropagation();
                        var num = $(this).attr('id');
                        console.log(num);
                        $(this).remove();
                        socket.emit('c2s_broadcast', {
                            act:'delete_w',
                            id: num
                        });
                    });

        		var canvas = document.getElementById('draw_area');
        		var ctx = canvas.getContext('2d');
        		ctx.lineWidth = 2;
        		ctx.strokeStyle = '#9eala3';


        		var down = false;
        			$('canvas').click(function(event) {
        				event.stopPropagation();
        			});
        			$('canvas').on('mousedown', function(e) {
                        if(e.which != 1 || remote_draw) return;
                        var rect = e.target.getBoundingClientRect() ;
        				e.stopPropagation();
        				console.log('hi');
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
                            gCO: ctx.globalCompositeOperation
                        });
        			});
        			$('canvas').on('mousemove', function(e){
                        var rect = e.target.getBoundingClientRect() ;

                        if(!down || drag) return;
        				e.stopPropagation();

        				ctx.lineTo(e.clientX - rect.left , e.clientY - rect.top);
        				ctx.stroke();
                        socket.emit('c2s_broadcast',{
                            act: "move",
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                        });
        			});
        			$('canvas').on('mouseup', function(e) {
                        console.log('up')
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
                            y: e.clientY - rect.top
                        });
        			});
        		$('canvas').chromeContext({
        			items: [
                        {
                            title:'×',
                            onclick:function(){}
                        },
                        {
                            separator: true
                        },
        				{
        					title: 'ペン',
        					onclick: function(){ctx.globalCompositeOperation = 'source-over';}
        				},
        				{
        					title: '消しゴム',
        					onclick: function(){ctx.globalCompositeOperation = 'destination-out';}
        				},
        				{
        					title: '移動',
        					onclick: function(){}
        				}
        			]
        		});

                $('.color').on('click', function(e){
                    var color = $(this).css('background-color');
                    ctx.strokeStyle = color;
                    $(this).siblings('.on').removeClass('on');
                    $(this).addClass('on');
                    console.log(color);
                });

                $('#undo').button({text:false,icons:{primary:"ui-icon-arrowreturnthick-1-w"}});
                $('#redo').button({text:false,icons:{primary:"ui-icon-arrowreturnthick-1-e"}})

                socket.on('s2c_broadcast', function(data) {

                    switch (data.act) {
                        case "down":
                            console.log("d_remote: " + data.x, data.y);
                            remote_draw = true;
                            ctx.strokeStyle = data.color;
                            ctx.globalCompositeOperation = data.gCO;
                            ctx.beginPath();
                            ctx.moveTo(data.x, data.y);
                            break;
                        case "move":
                            if (!remote_draw) return;
                            console.log("m_remote: " + data.x, data.y);
                            ctx.lineTo(data.x, data.y);
                            ctx.stroke();
                            break;

                        case "up":
                            if (!remote_draw) return;
                            console.log("u_remote: " + data.x, data.y);
                            ctx.lineTo(data.x, data.y);
                            ctx.stroke();
                            ctx.closePath();
                            remote_draw = false;
                            break;

                        case 'add_w':
                            var src = data.weapon;
                            var obj = $('<img src="'+src+'"  height="40" width="48">').css({
                                width: '24',
                                height: '20',
                                border: '1px solid gray',
                                "border-radius": '5px',
                            }).data('w_id', weapon_id).attr('id', 'weapon_'+weapon_id);
                            weapon_id++;
                            obj.appendTo('#view').addClass('copy').draggable({container:'#view',
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
                        break;

                         case "drag_start":
                             $("#weapon_"+data.id).draggable('denable');
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
                            console.log(data);
                            $('#' +data.id).remove();
                            break;
                    }
                });


           	});