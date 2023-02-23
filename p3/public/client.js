const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})

const form = document.getElementById('messageBox');
const messageInput = document.getElementById('message');
const messagePanel = document.querySelector(".messagePanel")

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

socket.on('recieveMessage',(data)=>{
  add(`${data.from}: ${data.message}`,'left')
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

form.addEventListener('submit',(event)=>{
  event.preventDefault();
  const message = messageInput.value;
  add(`You: ${message}`,'right');
  socket.emit('sentMessage',message);
  messageInput.value = "";
})

const add = (message,position)=>{
  const box = document.createElement("div");
  box.innerHTML = message;
  box.classList.add('message');
  box.classList.add(position);
  messagePanel.append(box); 
}

