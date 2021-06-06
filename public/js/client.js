// GLOBAL VARIABLES
var active_tool='pointer';


// Establish a Socket.io connection
const socket = io();
// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const client = feathers();

client.configure(feathers.socketio(socket));
// Use localStorage to store our login token
client.configure(feathers.authentication());

const uploadService = client.service('uploads');

/************
 * LOGIN SIGNUP
*/

// Show the login page
const showLogin = (error) => {
  console.log("showLogin", error);
  // $("#main").hide();
  $("#login").show();
  if (error) {
    doToast(error.message, true);
  }
};

// Shows the chat page
const showMain = async () => {
  console.log("showing MAIN")
  $("#login").hide();
  $("#main").show();

  // Find the latest 25 messages. They will come with the newest first
  const messages = await client.service('messages').find({
    query: {
      $sort: { createdAt: -1 },
      $limit: 25
    }
  });

  // We want to show the newest message last
  messages.data.reverse().forEach(addMessage);

  // Find all users
  const users = await client.service('users').find();

  // Add each user to the list
  users.data.forEach(addUser);
  $("#user_count").text(users.data.length);


  // Find all items
  const items = await client.service('items').find();
  // Add each item to the canvas
  items.data.forEach(addItem);

};


// Retrieve email/password object from the login/signup page
const getCredentials = () => {
  const user = {
    email: $('[name="email"]').val(),
    password: $('[name="password"]').val()
  };

  return user;
};

// Log in either using the given email/password or the token from storage
const login = async credentials => {
  console.log("Trying to Login", credentials)
  try {
    if (!credentials) {
      // Try to authenticate using an existing token
      await client.reAuthenticate();
    } else {
      // Otherwise log in with the `local` strategy using the credentials we got
      await client.authenticate({
        strategy: 'local',
        ...credentials
      });
    }

    // If successful, show the main page
    showMain();
  } catch (error) {
    // If we got an error, show the login page
    showLogin(error);
  }
};


// "Signup and login" button click handler
$('#btn_signup').on('click', async () => {
  // For signup, create a new user and then log them in
  const credentials = getCredentials();

  // First create the user
  await client.service('users').create(credentials);
  // If successful log them in
  await login(credentials);
});

// "Login" button click handler
$('#btn_login').on('click', async () => {
  const user = getCredentials();

  await login(user);
});

// "Logout" button click handler
$('#logout').on('click', async () => {
  await client.logout();

  // document.getElementById('app').innerHTML = loginHTML;
  $("#login").show();
});




/************
 * CHAT MESSAGES
*/


// "Send" message form submission handler
$('#message_entry').on('submit', async ev => {
  // This is the message text input field
  const input = document.querySelector('[name="text"]');

  ev.preventDefault();

  // Create a new message and then clear the input field
  await client.service('messages').create({
    text: input.value
  });

  input.value = '';
});


// Add a new user to the list
const addUser = user => {
  // console.log("addUser", user);
  var msg = '<li class="usr">';
  msg += '<img class="avatar" src="' + user.avatar + '"/>';
  msg += user.email;
  msg += '</li>';
  $("#users ul").append(msg);
};

// Renders a message to the page
const addMessage = message => {
  // console.log("addMessage", message);
  var msg = '<li class="msg">';
  msg += '<img class="avatar" src="' + message.user.avatar + '"/>';
  msg += message.text;
  msg += '</li>';
  $("#messages ul").append(msg);
};

// Listen to created events and add the new message in real-time
client.service('messages').on('created', addMessage);

// We will also see when new users get created in real-time
client.service('users').on('created', addUser);








// Renders an item to the page
const saveNewItem = item => {
  console.log("saving NewItem", item);
  canvas.remove(item);
  client.service('items').create(item);
  setTool('pointer');
};


// Renders an item to the page
const addItem = item => {
  console.log("addItem", item);
  if(item.type=='i-text'){
    drawTextItem(item);
  }else if(item.type=='textbox'){
    drawNoteItem(item);
  }else if(item.type=='image'){
    drawImageItem(item);
  }else{
    drawItem(item);
  }
};

// UPDATES an item on the page
const updateItem = item => {
  console.log("updateItem", item);
  updateCanvasObject(item);
};

// remove an item from the page
const removeItem = item => {
  console.log("removeItem", item);
  removeCanvasObject(item._id);
};


// We will also see when new users get created in real-time
client.service('items').on('created', addItem);

client.service('items').on('patched', updateItem);

client.service('items').on('updated', updateItem);

client.service('items').on('removed', removeItem);







// ******* 
// canvas hotkey listeners
// ******* 

var canvasWrapper = document.getElementById('drawing_container');
canvasWrapper.tabIndex = 1000;
canvasWrapper.addEventListener("keydown", function(e){
  // console.log("keypress", e);
  if(e.ctrlKey==true){
    switch (e.key) {
      case 'x':
          console.log("ctrlX");

          var obj = canvas.getActiveObject();
          if(typeof obj != 'undefined' && typeof obj != 'array'){
            console.log("trying to remove obj", obj);
            client.service('items').remove({id: obj._id});
          }
        break;
    
      default:
        break;
    }
  }
}, false);





// ******* 
// Menu Actions
// ******* 
$("#clear_canvas").on("click", function(){
  client.service('items').remove({all:true});
})



// ******* 
// Toolbar Actions
// ******* 
function setTool(tool){
  console.log("setting tool", tool);
  active_tool = tool;
  $("#toolbar .tool").removeClass("active");
  $("#toolbar .tool[data-tool='"+tool+"']").addClass("active");

  if(tool=='image'){
    pickAnImageFile();
    // $("#upload_area").addClass('active');
  // }else{
  //   $("#upload_area").removeClass('active');
  }
}
$("#toolbar .tool").on("click", function(){
  setTool($(this).attr("data-tool"));
})



// ******** color-picker
const color_presets = [
  'e8ecfb',
  'b997c7',
  '824d99',
  '4e78c4',
  '57a2ac',
  '7eb875',
  'd0b541',
  'e67f33',
  'ce2220',
  '521a13'
];

var active_color;

function setColor(color){
  active_color = color;
  $('#color_picker').css("background-color", active_color);
  localStorage.active_color = active_color;
}


function preDefineColorValues(picker, colors) {
  let pane = document.createElement('span'), c;
  for (let i = 0, j = colors.length; i < j; ++i) {
      c = document.createElement('span');
      c.title = '#' + colors[i];
      c.style.backgroundColor = '#' + colors[i];
      c.addEventListener('click', function(e) {
          picker.value.apply(picker, CP.HEX(this.title));
          e.stopPropagation();
      });
      pane.appendChild(c);
  }
  pane.className = 'color-pickers';
  picker.self.appendChild(pane);
}

const picker = new CP(document.querySelector('#color_picker'));

picker.on('change', function(r, g, b, a) {
  console.log("color change", r, g, b, a);
    var col = '';
    if (1 === a) {
      col = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    } else {
      col = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }
    
    setColor(col);
});

preDefineColorValues(picker, color_presets);





// ******** POPUP toolbar actions
function showPopupMenu(obj){
  $("#popup_toolbar").css("left", obj.aCoords.bl.x);
  $("#popup_toolbar").css("top", obj.aCoords.bl.y + $("#drawing_container").offset().top + 10);
  $("#popup_toolbar").css("display", "flex");
}
function hidePopupMenu(){
  $("#popup_toolbar").css("display", "none");
}









// ******** POPUP color-picker
function setObjectColor(color){
  // active_color = color;
  $('#popup_color_picker').css("background-color", color);
  updateActiveObjectStyle({fill: color});
  // localStorage.active_color = active_color;
}

const popup_picker = new CP(document.querySelector('#popup_color_picker'));

popup_picker.on('change', function(r, g, b, a) {
  console.log("color change", r, g, b, a);
    var col = '';
    if (1 === a) {
      col = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    } else {
      col = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }
    setObjectColor(col);
});

popup_picker.on('stop', function() {
  console.log("color change STOP");
  sendUpdatedItem(canvas._activeObject._id, canvas._activeObject)
});

preDefineColorValues(popup_picker, color_presets);




// ******** POPUP color-picker-BORDER
function setObjectColorBorder(color){
  // active_color = color;
  $('#popup_color_picker_border').css("border-color", color);
  updateActiveObjectStyle({stroke: color});
  // localStorage.active_color = active_color;
}

const popup_picker_border = new CP(document.querySelector('#popup_color_picker_border'));

popup_picker_border.on('change', function(r, g, b, a) {
  console.log("color change", r, g, b, a);
    var col = '';
    if (1 === a) {
      col = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    } else {
      col = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }
    setObjectColorBorder(col);
});

popup_picker_border.on('stop', function() {
  console.log("color change STOP");
  sendUpdatedItem(canvas._activeObject._id, canvas._activeObject)
});

preDefineColorValues(popup_picker_border, color_presets);





// ******* 
// FILE UPLOAD functions
// ******* 

  // Now with Real-Time Support!
  uploadService.on('created', function(file){
    console.log('Received file created event', file);
  });

  $("#upload_area").on('dragenter', function (e){
    e.preventDefault();
    // $(this).css('background', '#BBD5B8');
  });

  $("#upload_area").on('dragover', function (e){
    e.preventDefault();
  });

  $("#upload_area").on('drop', function (e){
    // $(this).css('background', '#D8F9D3');
    e.preventDefault();
    var image = e.originalEvent.dataTransfer.files;
    createFormData(image);
  });


  $("#upload_area").on('click', function (e){
    pickAnImageFile();
  });

  function pickAnImageFile(){
    var input = document.createElement('input');
      input.type = 'file';

      input.onchange = e => { 

        // getting a hold of the file reference
        var file = e.target.files[0]; 
    
        // setting up the reader
        var reader = new FileReader();
        // reader.readAsText(file,'UTF-8');
        reader.readAsDataURL(file,'UTF-8');
    
        // here we tell the reader what to do when it's done reading...
        reader.onload = readerEvent => {
          var content = readerEvent.target.result; // this is the content!
          console.log( "image content:", content );
          createFormData([content]);
        }
    
      }

      input.click();
  }

  function createFormData(image) {
    var formImage = new FormData();
    formImage.append('uri', image[0]);
    uploadFormData(formImage);
  }
  
  function uploadFormData(formData) {
    $.ajax({
    url: "/uploads",
    type: "POST",
    data: formData,
    contentType:false,
    cache: false,
    processData: false,
    beforeSend: function (xhr) {
      xhr.setRequestHeader ("Authorization", "Bearer " + localStorage.getItem('feathers-jwt'));
    },
    success: function(data){
      console.log("successful upload", data);
      if(data.id){
        var imageUrl = '/uploads/' + data.id;
        // var image="<img src='"+imageUrl+"'>"; 
        // $('#upload_area').append(image);

        createImage(imageUrl);
      }else{
        console.warn("no data.id returned");
      }
    }});
  }




// ******* 
// document ready?
// ******* 
$("document").ready(function(){
  // Call login right away If the user can already be authenticated
  login();
  
  // setup default color
  if(typeof localStorage.active_color != 'undefined'){
    setColor(localStorage.active_color);
  }else{
    setColor("rgb(0,0,0)"); //default
  }

  //resize the drawing canvas
  setTimeout(function(){
    resizeCanvas();
  },100);
})

