
// all fabric.js drawing meta functions
var drawingWidth = 100;
var drawingHeight = 100;

// 'canvas' is the main canvas drawing object
const options = {
    fireRightClick: true,
    stopContextMenu: true
};
var canvas = new fabric.Canvas('canvas', options); // create a wrapper around native canvas element (with id="c")
canvas.backgroundColor = new fabric.Pattern({ source: 'img/grid.svg' });

// fabric extension
fabric.Canvas.prototype.getItem = function (id) {
    var object = null,
        objects = this.getObjects();

    for (var i = 0, len = this.size(); i < len; i++) {
        if (objects[i]._id && objects[i]._id === id) {
            object = objects[i];
            break;
        }
    }

    return object;
};


// **** 
// MOUSE EVENTS
//*****


canvas.on('mouse:wheel', function (opt) {
    // zooming
    var delta = opt.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
});


var newObj, isDown, origX, origY;

canvas.on('mouse:down', function (opt) {
    var evt = opt.e;
    // for PANNING
    if (evt.altKey === true) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
    }
    else {   //regular non-alt left mouse-down
        if(opt.button === 1) {
            console.log("left click");
            switch (active_tool) {
                case 'pointer':

                    break;

                case 'rectangle':
                    isDown = true;
                    var pointer = canvas.getPointer(opt.e);
                    origX = pointer.x;
                    origY = pointer.y;
                    // var pointer = canvas.getPointer(opt.e);
                    newObj = new fabric.Rect({
                        left: origX,
                        top: origY,
                        originX: 'left',
                        originY: 'top',
                        width: pointer.x - origX,
                        height: pointer.y - origY,
                        angle: 0,
                        fill: active_color,
                        transparentCorners: false
                    });
                    canvas.add(newObj);
                    break;

            

                case 'circle':
                    isDown = true;
                    var pointer = canvas.getPointer(opt.e);
                    origX = pointer.x;
                    origY = pointer.y;
                    // var pointer = canvas.getPointer(opt.e);
                    newObj = new fabric.Circle({
                        left: origX,
                        top: origY,
                        originX: 'left',
                        originY: 'top',
                        radius: pointer.x - origX,
                        angle: 0,
                        fill: active_color,
                        transparentCorners: false
                    });
                    canvas.add(newObj);
                    break;

                default:
                    break;
            }
        }
        
        else if(opt.button === 3) {
            console.log("right click", opt.target);
            var id = opt.target._id;
            console.log("ID:", id);
            var obj = canvas.getItem(opt.target._id);
            console.log("obj:", obj);
            canvas.setActiveObject(obj);
            canvas.renderAll();
        }
    }

});

canvas.on('mouse:move', function (opt) {
    if (this.isDragging) {
        console.log("panning", opt.e)
        var e = opt.e;
        var vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
    }

    switch (active_tool) {
        case 'pointer':

            break;

        case 'rectangle':
            if (!isDown) return;
            var pointer = canvas.getPointer(opt.e);
            if (origX > pointer.x) {
                newObj.set({ left: Math.abs(pointer.x) });
            }
            if (origY > pointer.y) {
                newObj.set({ top: Math.abs(pointer.y) });
            }
            newObj.set({ width: Math.abs(origX - pointer.x) });
            newObj.set({ height: Math.abs(origY - pointer.y) });
            canvas.renderAll();
            break;

        case 'circle':
            if (!isDown) return;
            var pointer = canvas.getPointer(opt.e);
            if (origX > pointer.x) {
                newObj.set({ left: Math.abs(pointer.x) });
            }
            if (origY > pointer.y) {
                newObj.set({ top: Math.abs(pointer.y) });
            }
            var width = Math.abs(origX - pointer.x);
            var height = Math.abs(origY - pointer.y);
            newObj.set({
                radius: width / 2,
                scaleX: 1,
                scaleY: (height / width)
            });
            canvas.renderAll();
            break;

        default:
            break;
    }
});


canvas.on('mouse:up', function (opt) {
    var evt = opt.e;
    if (evt.altKey === true) {
        // if we were panning, on mouse up we want to recalculate new interaction
        // for all objects, so we call setViewportTransform
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
    }
    else {   //regular non-alt mouse-up
        switch (active_tool) {
            case 'pointer':

                break;

            case 'rectangle':
                isDown = false;
                saveNewItem(newObj);
                break;

            case 'note':
                var pointer = canvas.getPointer(opt.e);
                origX = pointer.x;
                origY = pointer.y;
                var defaultText = "\nNote\n";
                newObj = new fabric.Textbox(defaultText, {
                    fontFamily: 'sans-serif',
                    fontSize: '20',
                    textAlign: 'center',
                    left: origX,
                    top: origY,
                    width:250,
                    width:250,
                    backgroundColor: active_color
                });
                canvas.add(newObj);
                setTool("Pointer");
                saveNewItem(newObj);
                break;

            case 'circle':
                isDown = false;
                saveNewItem(newObj);
                break;

            case 'text':
                var pointer = canvas.getPointer(opt.e);
                origX = pointer.x;
                origY = pointer.y;
                newObj = new fabric.IText('Edit text...', {
                    fontFamily: 'sans-serif',
                    fontSize: '20',
                    left: origX,
                    top: origY,
                });
                canvas.add(newObj);
                setTool("Pointer");
                saveNewItem(newObj);
                break;


            default:
                break;
        }
    }
});



// MODIFIED OBJECT LISTENER
canvas.on('object:modified', function (ev) {
    console.log('object:modified', ev);
    // if it's multiple objects...
    if (ev.target._objects) {

        oldGroup = canvas.getActiveObjects();

        canvas.discardActiveObject();
        canvas.requestRenderAll();

        ev.target._objects.forEach(target => {
            sendUpdatedItem(target._id, target);
        });

        setTimeout(function () {

            if (oldGroup) {
                console.log("trying to reassemble oldGroup", oldGroup);
                var newGroup = [];
                oldGroup.forEach(target => {
                    newGroup.push(canvas.getItem(target._id));
                });

                console.log("and here's the NewGroup", newGroup);
                var selection = new fabric.ActiveSelection(newGroup, {
                    canvas: canvas
                });
                canvas.discardActiveObject();
                canvas.setActiveObject(selection);
                canvas.requestRenderAll();
            } else {
                console.log("No OldGroup");
            }
        }, 100);

    } else {
        sendUpdatedItem(ev.target._id, ev.target);
    }

});





function sendUpdatedItem(id, obj) {
    console.log("sendUpdatedItem", id, obj);
    client.service('items').update(id, obj);
}






function resizeCanvas() {
    drawingWidth = $("#drawing_container").width();
    drawingHeight = $("#drawing_container").height();
    console.log("drawing width/height", drawingWidth, drawingHeight);

    canvas.setDimensions({
        width: drawingWidth,
        height: drawingHeight
    });
}


function updateCanvasObject(item) {
    console.log("trying to UPDATE object", item._id);
    var obj = canvas.getItem(item._id);
    for (const [key, value] of Object.entries(item)) {
        console.log(key, value);
        obj[key] = value;
    }
    canvas.requestRenderAll();
}


function removeCanvasObject(id) {
    console.log("trying to remove object", id);
    canvas.forEachObject(function (obj) {
        if (obj._id && obj._id === id) canvas.remove(obj);
    });
}



function drawTextItem(item) {
    console.log("drawing Text item", item);
    
    var newDrawObj = new fabric.IText(item.text, item);
    if(newDrawObj.isLive==true){
        canvas.setActiveObject(newDrawObj);
        newDrawObj.enterEditing();
        newDrawObj.selectAll();
        newDrawObj.isLive=false;
    }

    if(newDrawObj){
        // "add" onto canvas
        canvas.add(newDrawObj);
    }
}



function drawNoteItem(item) {
    console.log("drawing Note item", item);
    
    var newDrawObj = new fabric.Textbox(item.text, item);
    if(newDrawObj.isLive==true){
        canvas.setActiveObject(newDrawObj);
        newDrawObj.enterEditing();
        newDrawObj.selectWord(1)
        // newDrawObj.selectAll();
        newDrawObj.selectAll;
        newDrawObj.isLive=false;
    }

    if(newDrawObj){
        // "add" onto canvas
        canvas.add(newDrawObj);
    }
}


function drawImageItem(item) {
    console.log("drawing Image item", item);
    
    fabric.Image.fromURL(item.src, function(newDrawObj){
        console.log("added image", newDrawObj);
        
        newDrawObj = Object.assign(newDrawObj, item);

        if(newDrawObj){
            // "add" onto canvas
            canvas.add(newDrawObj);
        }
    });

}

function drawItem(item) {
    console.log("drawing item", item);
    var newDrawObj=false;
    switch (item.type) {
        case 'rect':
            newDrawObj = new fabric.Rect(item);
            break;

        case 'circle':
            newDrawObj = new fabric.Circle(item);
            break;

            case 'i-text':
                newDrawObj = new fabric.IText(item);
                // if(newDrawObj.isLive==true){
                    //     canvas.setActiveObject(newDrawObj);
                    //     newDrawObj.enterEditing();
                    //     newDrawObj.selectAll();
                    //     newDrawObj.isLive=false;
                    // }
                    break;
                    

        default:
            break;
    }

    if(newDrawObj){
        // "add" onto canvas
        canvas.add(newDrawObj);
    }
}


function createImage(url){
    console.log("createImage", url)
    
    fabric.Image.fromURL(url, function(oImg) {
        console.log("new Image:", oImg);
        // scale image down, and flip it, before adding it onto canvas
        // oImg.scale(0.5).set('flipX', true);
        oImg.left = 100;
        oImg.top = 100;
        oImg.scaleToHeight(canvas.height / 4);
        canvas.add(oImg);

        saveNewItem(oImg);
    });
}


