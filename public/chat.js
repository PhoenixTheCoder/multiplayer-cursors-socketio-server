const socket = io.connect("https://multiplayer-cursors-socketio-server.foonixthecoder.repl.co");

socket.on("User Added", function(event) {
    $(`#${event.userID}:last`).remove();
    $(`.${event.userID}:last`).remove();
    $("#cursors").append(`<a id=${event.userID}  style="position: fixed; z-index: 999999;"><img style="" src="/cursor.png"></img>${event.user}</a>`);

    people.push(event);

    //$(`#${userID}`).remove();
    $("#list-item-content").append(`<h4 onclick="javascript:changeUserName(${event.userID});" class=${event.userID}>${event.user}</h4>`);

      $(`#${event.userID}`).css({ color: event.userColor });
      $(`.${event.userID}`).css({ color: event.userColor });

  }) 
  socket.on("User Removed", function(event) {
    $(`#${event.userID}`).remove();
    $(`.${event.userID}`).remove();
  })

socket.on("error", function(event) {
    let err = event.msg;
    alert(err);
    return;
  })

socket.on("close", function(event) {
    if (event.content.id) {
      if (event.content.id == userID) {
        let reason = "WebSocket Error: " + event.content.closemsg;
        alert(reason);
        console.log(reason);
        socket.close();
        return;
      }
    } else {
    let reason = "WebSocket Error: " + event.closemsg;
    alert(reason);
    console.log(reason);
    socket.close();
    return;
    }
  })

socket.on("Update Cursor", function(event) {
    try
      {
    if (event.userID == userID) $(`#${userID}`).remove();
    let cursor = document.getElementById(event.userID)
    if (cursor.style == null) return;
    cursor.style.left = event.cdt.x + "px";
    cursor.style.top = event.cdt.y + "px";
    } catch(e) {
    }
  })

socket.on("c", function(event) {
    var pointerX = -1;
    var pointerY = -1;
    document.onmousemove = function (evt) {
      pointerX = evt.clientX;
      pointerY = evt.clientY;
    }
    setInterval(pointerCheck, 1);

    function pointerCheck() {
      cursorData[username] = {
        x: pointerX,
        y: pointerY
      }
      wss.send(JSON.stringify({
        type: "Cursor Move",
        username: username,
        userID: userID,
        dt: {
          cursorData
        }
        }))
    }
  })

socket.on("recieveMsg", function(event) {
    let obj = {
      color: event.content.color,
      name: event.content.name,
      message: event.content.message,
      id: event.content.id
    }
    renderMessage(obj);
    const chatWindow = document.querySelector('.chat-window');
      chatWindow.scrollTop = chatWindow.scrollHeight;
      if (isActive == false && canNotify == true) {
      let audio = new Audio("https://www.myinstants.com/media/sounds/hell_AJWSn3e.mp3");
      audio.play();
      }
  })

  socket.on("Set userID", function(event) {
      userID = event.cUserID;
  })

socket.on("Login Declined", function(event) {
    alert(event.declineMsg);
    return;
  })

socket.on("Update Usercount", function(event) {
  if(event.count > 0) {
				$("#status").html('<span class="number">'+event.count+'</span> '+(event.count==1? 'person is' : 'people are')+' playing');
				document.title = "Cursors (" + event.count + ")";
			} else {
				document.title = "Multiplayer Cursors";
			}
  })

socket.on("clearchat", function(event) {
    const chatWindow2 = document.querySelector('.chat-window');
    chatWindow2.textContent = '';
  })


window.onload = function() {
  bgMusic = new Audio("https://multiplayer-cursor.foonixthecoder.repl.co/videoplayback.webm");
  //bgMusic.play();
  bgMusic.volume = 0.6;
}

function updateScroll(){
    var element = document.getElementsByClassName("chat-window");
    element.scrollTop = element.scrollHeight;
}


window.onbeforeunload = function () {
  if (!localStorage.username) {
   wss.send(JSON.stringify({
    type: "Remove User",
    usern: localStorage.username,
    userID: userID
  }))
  } else {
  wss.send(JSON.stringify({
    type: "Remove User",
    usern: username,
    userID: userID
  }))
  }
}

const chatWindow = document.querySelector('.chat-window')

function renderMessage(obj) {
  const div = document.createElement('div')
  div.classList.add('render-message')
  if (obj.message.includes("Server")) {
    div.innerText = obj.name + ": " + obj.message
    div.style = `color: white;`
    chatWindow.appendChild(div)
  } else {
    if (showIDs == true) {
      div.innerText = "[ " + obj.id + " ] " +  obj.name + ": " + obj.message
      div.style = `color: ${obj.color};`
      chatWindow.appendChild(div)
    } else {
      div.innerText = obj.name + ": " + obj.message
      div.style = `color: ${obj.color};`
      chatWindow.appendChild(div)      
    }
  }
}

const chat = document.getElementById('chat-form')
const input = document.getElementById('chat-input')

chat.addEventListener('submit', event => {
  event.preventDefault();
  
  if (!input.value.trim()) return;
  wss.send(JSON.stringify({ type: "chat", content: { name: username, msg: input.value, id: userID } }));
  input.value = ''
});


let muteMusic = document.getElementById("mute-music");

muteMusic.onclick = function() {
  if (muteBGMusic == true) {
    muteBGMusic = false;
    bgMusic.volume = 0;
  } else if (muteBGMusic == false) {
    muteBGMusic = true;
    bgMusic.volume = 0.6;
  }
}

let muteNotifi = document.getElementById("mute-notifications");

muteNotifi.onclick = function() {
  const div = document.createElement('div')
  if (canNotify == true) {
    canNotify = false;
    div.innerText = "Client: Notifications are disabled."
    div.style = `color: red;`
    chatWindow.appendChild(div)   
  } else if (canNotify == false) {
    canNotify = true
    div.innerText = "Client: Notifications are enabled."
    div.style = `color: green;`
    chatWindow.appendChild(div)   
  }
}

let chatId = document.getElementById("show-ids");


chatId.onclick = function() {
  const div = document.createElement('div')
  if (showIDs == true) {
    showIDs = false;
    div.innerText = "Client: Hiding user IDs in chat."
    div.style = `color: red;`
    chatWindow.appendChild(div)   
  } else if (showIDs == false) {
    showIDs = true
    div.innerText = "Client: Showing user IDs in chat."
    div.style = `color: green;`
    chatWindow.appendChild(div)   
  }
}


function openRoom(event) {
  
}

document.addEventListener("visibilitychange", event => {
  if (document.visibilityState == "visible") {
    isActive = true;
  } else {
    isActive = false;
  }
})
