import Peer from 'peerjs';
import CodeMirror from 'codemirror';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket'; 
import { CodeMirrorBinding } from 'y-codemirror';
import 'codemirror/mode/javascript/javascript.js';

const myPeer = new Peer(undefined,{
    host:'/',
    port:'3001'
  })
let stream;
window.addEventListener('load',()=>{
  const DisplayID = document.getElementById('UserID')
  const videoGrid = document.getElementById('video-grid')
  const form = document.getElementById('form')
  const userIdInput = document.getElementById('userId')
  const myVideo = document.createElement('video')
  const editorBox = document.getElementById('editor')

  myPeer.on('open',(id)=>{
    DisplayID.innerHTML=id 
})



async function init(){
  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
  addVideoStream(myVideo,stream)
}

function addVideoStream(Video,stream){
  Video.srcObject = stream
  Video.addEventListener('loadedmetadata',()=>{
    Video.play()
  })
  videoGrid.append(Video)
}
init()

form.addEventListener('submit',(e)=>{
  e.preventDefault();
  const userID = userIdInput.value; 
  userIdInput.value = '';
  connectToNewUser(userID,stream)
})

myPeer.on('call',call=>{
  call.answer(stream)
  const video = document.createElement('video')
  call.on('stream',userVideoStream=>{
    addVideoStream(video,userVideoStream)
  })
})


function connectToNewUser(id,stream){
  const call = myPeer.call(id,stream)
  const video = document.createElement('video')
  call.on('stream',userVideoStream=>{
    addVideoStream(video,userVideoStream)
  })
}

const ydoc = new Y.Doc()
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  '',
  ydoc
)

const ytext = ydoc.getText('codemirror')

const editor = CodeMirror(editorBox,{
  mode:'javascript',
  lineNumbers:true,
  theme:'midnight'
})

const binding = new CodeMirrorBinding(ytext,editor,provider.awareness)
})
