import React, { MutableRefObject, useEffect, useRef } from 'react';
import { firestore } from './Firebase/firebase';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import './App.css';
function App() {

  let localStream:any = null;
  let remoteStream:any = null;
  let webcamVideo = useRef<any>();
  let remoteVideo = useRef<any>(); 
  const callInput = useRef<any>();
  const hangupButton = useRef<any>();
  

  const servers = {
    iceServers: [
      {
        urls: ['stun:stun.rapidnet.de:3478'],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = new RTCPeerConnection(servers);

  // 1. Setup media sources
  const webCamButton = async() =>{
    localStream = await navigator.mediaDevices.getUserMedia({
      video:true,
      audio:{
        echoCancellation:true,
        noiseSuppression:true,
        autoGainControl:true,
      }});
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track:any)=>{
      pc.addTrack(track,localStream);
    });

    // Pull tracks from remote tracks stream , add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track:any)=>{
        remoteStream.addTrack(track);
      })
    }

    webcamVideo.current.srcObject = localStream;
    remoteVideo.current.srcObject = remoteStream;

  }


  // 2. Create an offer
  const callButton = async () =>{
    // Reference Firestore collections for signaling
    const callDoc = await addDoc(collection(firestore,'calls'),{});
    const offerCandidates = collection(callDoc,'offerCandidates');
    const answerCandidates = collection(callDoc,'answerCandidates');
    callInput.current.value = callDoc.id;

    // console.log(callDoc,offerCandidates)
  

    // Get candidates for caller, save to db
    pc.onicecandidate = async (event)=>{
      event.candidate && await addDoc(offerCandidates,event.candidate.toJSON());
      console.log(event.candidate)
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    console.log(offerDescription);
    await pc.setLocalDescription(offerDescription);

    const offer ={
      sdp : offerDescription.sdp,
      type : offerDescription.type,
    };
    
    await setDoc(callDoc,{offer});

    // Listen for remote server
    onSnapshot(callDoc,(snapshot)=>{
      const data = snapshot.data();
      console.log(data);
      if(!pc.currentRemoteDescription && data?.answer){
        const answerDescription = new RTCSessionDescription(data.answer);
        console.log('answerDescription',answerDescription);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    onSnapshot(answerCandidates,(snapshot)=>{
      snapshot.docChanges().forEach((change)=>{
        console.log(change);
        if(change.type === 'added'){
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

    hangupButton.current.disabled = false;
    
  }

  // 3. Answer the call with the unique ID
  const answerButton = async()=>{
    const callId = callInput.current.value;
    const callDoc = doc(firestore,'calls',callId);
    const answerCandidates = collection(callDoc,'answerCandidates');
    const offerCandidates = collection(callDoc,'offerCadidates');

    pc.onicecandidate = async (event) =>{
      event.candidate && await addDoc(answerCandidates,event.candidate.toJSON());
    }

    const callData:any = (await getDoc(callDoc)).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type : answerDescription.type,
      sdp : answerDescription.sdp,
    };

    await updateDoc(callDoc,{answer});

    onSnapshot(offerCandidates,(snapshot)=>{
      snapshot.docChanges().forEach((change)=>{
        console.log(change);
        if(change.type === 'added'){
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      })
    })
    
  }


  const hangup =()=>{
    if(pc){
      pc.close();
    }

    if (localStream) {
      localStream.getTracks().forEach((track:any) => {
        track.stop(); // Stop all tracks
      });
      localStream = null;
    }
    webcamVideo.current.srcObject =  null;
    remoteVideo.current.srcObject = null;
  }

  return (
    <div>
      <div className='videobox'>
        <span>
          <h3>
            Local Stream
          </h3>
          <video id='webcamVideo' autoPlay playsInline ref={webcamVideo}></video>
        </span>
        <span>
          <h3>
            Remote Stream
          </h3>
          <video id="remoteVideo" autoPlay playsInline ref={remoteVideo}></video>
        </span>
      </div>
      <div>
        <button onClick={webCamButton}> Start Webcam</button>
      </div>
      <div>
        <h2>
          2. Create a new Call
        </h2>
        <button id='callButton' onClick={callButton}>Create Call (offer)</button>
      </div>
      <div>
        <h2>
          3. Join a Call
        </h2>
        <p>Answer the call from a different browser window or device</p>
        <input type="text" id='callInput' ref={callInput}/>
        <button id='anserButton' onClick={answerButton}>Answer</button>
      </div>
      <div>
        <h2>
          4. Hangup
        </h2>
        <button id='hangupButton' ref={hangupButton} onClick={hangup}>Hangup</button>
      </div>
      
    </div>
  );
}

export default App;
