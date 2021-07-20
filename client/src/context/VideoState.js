import React, { useState, useEffect, useRef } from "react";
import VideoContext from "./VideoContext";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import $ from "jquery";
import {createWorker} from "tesseract.js";
import * as faceapi from 'face-api.js';
import axios from 'axios';
import '../Config.js';

const URL=global.URL;
var latitude='', longitude='';
var callertype='host';
var callerid='';
var devicetype="mobile";
var lengthInMS=10000;
var recorder=null;
var overlaylayerheight="30";

var params = window.location.search.substr(1).split('&')
if ( params.length > 0 ) 
  callertype = params[0].split("=")[1];
if ( params.length > 1 ) 
  callerid = params[0].split("=")[1];

export const socket=io( URL, { query:{"type":callertype }});
var ocr_pan_image='';
var recordedBlob='';
var deferred = new $.Deferred();

const VideoState = ({ children}) => {

  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [chat, setChat] = useState([]);
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");
  const [userName, setUserName] = useState("");
  const [otherUser, setOtherUser] = useState("");
  const [myVdoStatus, setMyVdoStatus] = useState(true);
  const [userVdoStatus, setUserVdoStatus] = useState();
  const [myMicStatus, setMyMicStatus] = useState(false);
  const [userMicStatus, setUserMicStatus] = useState(false);
  const [msgRcv, setMsgRcv] = useState("");
  const [userPANStatus, setUserPANStatus] = useState(false);
  const [aadharUploadStatus, setaadharUploadStatus] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientPAN, setClientPAN] = useState("");
  const [clientLatitude, setClientlatitude] = useState("");
  const [clientLongitude, setClientlongitude] = useState("");
  const [client_address,setclient_address] = useState("");
  const [client_referenceno,setclient_referenceno] = useState("");

  const [progressbarPercentage,setProgressprogressbarPercentage] = useState(0);
  const [clientVideoHeight,setclientVideoHeight] = useState("100");
  const [curentcallerType, setcurentcallerType] = useState("");
  const [currentTab,setCurrentTab] = useState(0);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  useEffect( async() => {

    if(clientLatitude !="" && clientLatitude !="undefined" && clientLongitude !="" && clientLongitude !="undefined") {
      var addressurl="https://maps.googleapis.com/maps/api/geocode/json?latlng="+clientLatitude+","+clientLongitude+"&key=AIzaSyBuHfbIm3Oftgjfk2T4x93KZ9Fb25CXodk";
      var addressresp = await axios.get(addressurl);   
      var googledata=addressresp.data;
      var google_results=googledata.results;
      var google_formattedaddrs=google_results[5].formatted_address;
      setclient_address(google_formattedaddrs);

    }

  },[clientLatitude,clientLongitude]);

  useEffect(() => {

      setcurentcallerType(callertype);
      var deferred = new $.Deferred();  
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]).then(startVideo);

      function startVideo() {
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
              setStream(currentStream);   
              myVideo.current.srcObject = currentStream;
          });
      }
  
  socket.on("me", (id) => setMe(id)); 
  socket.on("endCall", () => { window.location.reload();});

  socket.on("callUser", ({ from, name: callerName, signal }) => {
    setCall({ isReceivingCall: true, from, name: callerName, signal });
  });

  socket.on("updateProgressbarRcv", ({percentage}) => {
    setProgressprogressbarPercentage(percentage);
  });

  socket.on("updateClientDatatoHostRcv", ({name,pan,latitude,longitude,referenceno}) => {

    setClientName(name);
    setClientPAN(pan);
    setClientlatitude(latitude);
    setClientlongitude(longitude);
    setclient_referenceno(referenceno);

    console.log("lat===="+latitude);
    console.log("long===="+longitude);
    console.log("referenceno===="+referenceno);
    
  });


  socket.on("updateUploadProgressbarRcv", ({percentage}) => {
    setProgressprogressbarPercentage(percentage);
  });


  socket.on("aadharuploadcompletedRcv", () => {
      setaadharUploadStatus(true);
      setclientVideoHeight(100);
  });

  socket.on("aadharuploaddoneRcv", () => {

    setaadharUploadStatus(true);
  });

  socket.on("updatePANStatusRcv", ({status}) => {
    setUserPANStatus(true);
  });
  
  socket.on("updateClientVideoHeightRcv", ({videoheight}) => {
    setclientVideoHeight("30");
  });

  socket.on("msgRcv", ({ name, msg: value, sender }) => {
    setMsgRcv({ value, sender });
    setTimeout(() => { setMsgRcv({});}, 2000);
  });
  
  socket.on("updateUserMedia", ({ type, currentMediaStatus }) => {
    console.log("updateUserMedia," + type + "," + currentMediaStatus)
    if (currentMediaStatus !== null || currentMediaStatus !== []) {
      switch (type) {
        case "video":
          setUserVdoStatus(currentMediaStatus);
          break;
        case "mic":
          setUserMicStatus(currentMediaStatus);
          break;
        default:
          setUserMicStatus(currentMediaStatus[0]);
          setUserVdoStatus(currentMediaStatus[1]);
          break;
      }
    }
  });
  }, []);

  const answerCall = async () => {

    setCallAccepted(true);    
    setOtherUser(call.from);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("answerCall", {
        signal: data,
        to: call.from,
        userName: name,
        type: "both",
        myMediaStatus: [myMicStatus, myVdoStatus],
      });
    });

    peer.on("stream", (currentStream) => {

      userVideo.current.srcObject = currentStream; 

      startRecording(userVideo.current.srcObject, lengthInMS).then(recordedChunks => {

          console.log("Started Recording");
          recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
          console.log("Successfully recorded " + recordedBlob.size + " bytes of " +
          recordedBlob.type + " media.");   

        }).catch(function () {
            deferred.reject('There is no access to your camera, have you denied it?');
        });
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
    
    /******************PAN Card Capture***************** */
      var video =$("#first_video");
      var pictureWidth = 780, pictureHeight = 400;
      var fxCanvas = null;
      var texture = null;
      var identitytype="";	
      var canvasWidth =450, canvasHeight =265;	      
      var present="";
      var message="";
      var devicetype="";
      var customer_pan="BQNPC1198P";

      var iterator=1;
      var idType = 0;
      //var idTypeA = ["pan", "aadhar", "passport" ];
      var idTypeA = ["pan"];
      identitytype = idTypeA[0];
      const totalIterations =3;
      var waitInSecs = 0;
      var results = [totalIterations];	
      var panExp = "";
      var imgData = null;

      async function saveocrdata() {		
	
        //var referenceno=$("#referenceno").html();			
        console.log("Enterd into saveocr");
        var referenceno="5946c8bf997534bbbade9e91a24e8899";		
        var data=[];
        var panobj={};
        panobj['status']="Verified";
        panobj['number']="BQNPC1198P";
        panobj['image']=ocr_pan_image;		
        panobj['name']="Yuvaraj";
        panobj['dob']="2000-10-10";
        panobj['address']="Indira Nagar";
        panobj['type']="PAN";
        data.push(panobj);
      

        console.log("======recordedBlob======");
        console.log(recordedBlob);
        console.log("======recordedBlob======");

        const formData=new FormData();		
        formData.append("data",JSON.stringify(data));							
        formData.append("referenceno",referenceno);			
        formData.append("video_blob",recordedBlob);	
        formData.append("latitude",latitude);
        formData.append("longitude",longitude);
  
        try {
          const response = await axios.post('/saveocrdata', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });    
          var responsedata=response.data;          
          if(responsedata.data) {
            
            $("#messagelayer").html("");
            setProgressprogressbarPercentage(0);
            setUserPANStatus(true);
            setCurrentTab(1);
            socket.emit("updateProgressbar", {to: otherUser, percentage:0});
            var panstatus=true;
            socket.emit("updatePANStatus", {to: otherUser,panstatus});
            socket.emit("updateClientVideoHeight", {to: otherUser,panstatus});    
          }
          else {
              // Error Message
          }

        } catch (err) {
          if (err.response.status === 500) {
            console.log('There was a problem with the server');
          } else {
            console.log(err.response.data.msg);
          }
        }
    
      }
    
      function wait(delayInMS) {
        return new Promise(resolve => setTimeout(resolve, delayInMS));
      }

      function startRecording(stream, lengthInMS) {

          recorder = new MediaRecorder(stream);		
          let data = [];

          recorder.ondataavailable = event => data.push(event.data);
          recorder.start();

          console.log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");
          let stopped = new Promise((resolve, reject) => {
          recorder.onstop = resolve;
          recorder.onerror = event => reject(event.name);
          });

          let recorded = wait(lengthInMS).then(
            () => recorder.state == "recording" && recorder.stop()
          );

          return Promise.all([ stopped, recorded])
          .then(() => data);
      }

      function setIntervalX(callback) 
      {
            var intervalID = window.setInterval(function () {
                if ( waitInSecs > 0)
                {
                    waitInSecs -= 2;
                    present = 0;
                    return;
                }
                
              callback(iterator) ;
              if ((iterator+ 1) > totalIterations) {
                  if ((idType+1) >= idTypeA.length )
                  {
                    window.clearInterval(intervalID);
                    $("#messagelayer").html("Please remove your card. OCR Processing is on....");
                }
                else
                {
                    identitytype = idTypeA[++idType];
                    var message="Please show your <b>"+idTypeA[idType].toUpperCase()+ " </b> in the specified area and hold it";
                    $("#messagelayer").html(message);
                    waitInSecs = 6;
                    overlaysetup();
                    iterator = 1;
                    imgData = null;
                }
              }
              else iterator++;
              
          }, 2000);

        }

        function step2() {
          $("#messagelayer").html("Please show your  "+identitytype.toUpperCase()+" in the specified area and hold it");
          setIntervalX(snapShot);
        }

        function overlaysetup() {          
            $(".overlay").css({"width":"100%","height":"100%"});
            $(".overlay_outer").css({"width":"25%","height":overlaylayerheight+"%","padding":"20px"});
        }

        async function snapShot(counter) 
        {	
            var canvaslayer=identitytype+"_"+counter+"_layer";
            var canvas=document.querySelector("#"+canvaslayer+" canvas");
            var img=document.querySelector("#"+canvaslayer+" img");
            var ctx = canvas.getContext('2d');

            var scale =1;
            canvas.width = canvasWidth * scale;
            canvas.height = canvasHeight * scale;
                
            var layerheight=$("#video2").height();

            var overlay_height=layerheight*(overlaylayerheight/100);
            var yaxisindex=layerheight-overlay_height;
            var videowidth=$("#localVideo").width();
            var videoheight=$("#localVideo").height();

            var x1=0;
            var y1=yaxisindex;
            var x2=videowidth;
            var y2=videoheight;

            console.log("yaxisindex====="+yaxisindex);

            ctx.filter = 'grayscale(100%) contrast(110%) brightness(220%)';
            ctx.drawImage(userVideo.current,0,yaxisindex,canvas.width,canvas.height,0,0,canvas.width,canvas.height);

            if (imgData === null )
              imgData = ctx.getImageData(0,0,canvas.width,canvas.height).data;		

            var imgData1 = ctx.getImageData(0,0,canvas.width,canvas.height).data;
            var present = checkCardPresense(canvas,imgData1);

            console.log("present===="+present);            
            if (!present )
            {
                iterator--;
                return;
            }
            $(img).attr('src',canvas.toDataURL());	
            processSnapShot(img, counter); 
          }

          function processSnapShot(img, it) 
          {
              var progresspercentage=((it/totalIterations)*100).toFixed(0);	

              setProgressprogressbarPercentage(progresspercentage);
              socket.emit("updateProgressbar", {to: otherUser, percentage:progresspercentage});
              work(img, it);

              async function work(im, it) {
          
                 // var worker =createWorker({
                    //logger: m => console.log(m)
                 // });

                  /* await worker.load();
                  await worker.loadLanguage('eng');
                  await worker.initialize('eng');
                  var result = await worker.recognize(im);
                  results[it-1] = result.data;
                  
                  console.log("=====OCR Data=====");
                  console.log(result.data);
                  await worker.terminate(idType);
                  console.log("=====OCR Data ENDS=====");
                
                  console.log("idType in work==="+idType);
              
                  var regularexp="";
                  var parts = "";
                  if(idType ==0)
                  {   
                      parts = customer_pan.match(/.{1,1}/g);
                  }
                  else if(idType ==1) 	
                  {
                      parts = customer_aadhar.match(/.{1,1}/g);
                  }
                  else if(idType ==2)  
                  {
                      parts = customer_passport.match(/.{1,1}/g);
                  }
                
                  var new_value = parts.join("|");								
                  regularexp= new RegExp(new_value,"ig");	
                  
                  /*if ( result.data.lines != undefined)
                  for(var j = result.data.lines.length - 1; j >= 0  ; j--) 
                      {
                      for(var k = 0; k < result.data.lines[j].words.length  ; k++) 
                          {
                              if ( result.data.lines[j].words[k])
                              {
                                  resLength = 0;
                                    var result1 = result.data.lines[j].words[k].text.match(regularexp);
                                  if (result1 != null) resLength = result1.length;
                                  if ( resLength > 6 )
                                  console.log("j..."+j+"--"+resLength+"...."+result1);
                                }
                          }
                          
                      } */
                      
                  console.log("Iterator========="+it+"=========="+totalIterations+"=============="+idType+"=================="+(idTypeA.length-1));
                      
                  if (it == totalIterations && idType == (idTypeA.length-1) ) 
                  {                    
                    var img=document.querySelector("#pan_2_layer img");
                    ocr_pan_image=$(img).attr('src');
                    console.log("Entered into Save");
                    saveocrdata();
                }
              }

              //waitingDialog.hide();
              //$("#"+ocrresultlayer).html(result.data);			  
              //worker.terminate();
          }
          
          function checkCardPresense(canvas, imgData1) {
          
              // compare the middle row pixles with original pixles to determine whether the card is in horizontally  and then vertically
              var j = Math.floor(canvas.height / 2);
              var totalMatched = 0;
              var tol = 20;
          
              for(var i = 0; i < canvas.width  ; i++) 
              {
                var s = 4 * j * canvas.width + 4 * i;  // calculate the index in the array
                if ( Math.abs(imgData[s] - imgData1[s]) < tol && Math.abs(imgData[s + 1] - imgData1[s + 1]) < tol
                  && Math.abs(imgData[s + 2] - imgData1[s + 2]) < tol && Math.abs(imgData[s + 3] - imgData1[s + 3]) < tol )  totalMatched++;
                /*else
                      {
                    console.log("j , s======="+j +"  ... "+s + " "+imgData[s]+ " "+ imgData1[s] + ", "+ imgData[s + 1] +" "+ imgData1[s + 1]
                      + ", "+ imgData[s + 2] +" "+ imgData1[s + 2] +", "+ imgData[s + 3] +" "+ imgData1[s + 3] );
                    if ( imgData1[s] < dark && imgData1[s + 1] < dark  && imgData1[s + 2] < dark )
                          imgData1[s] = imgData1[s+1] = imgData1[s=2] = 0;
                      }*/
              }
              
              if ( totalMatched > canvas.width * 0.7) 
                  return 0;			
            
              j = Math.floor(canvas.width / 2);
              totalMatched = 0;
          
              for(var i = 0; i < canvas.height  ; i++) 
              {
                var s = 4 * j * canvas.height + 4 * i;  // calculate the index in the array
                if ( Math.abs(imgData[s] - imgData1[s]) < tol && Math.abs(imgData[s + 1] - imgData1[s + 1]) < tol
                  && Math.abs(imgData[s + 2] - imgData1[s + 2]) < tol && Math.abs(imgData[s + 3] - imgData1[s + 3]) < tol )  totalMatched++;
              }
          
              console.log("totalMatched  === "+totalMatched+"======canvas height=="+canvas.height * 0.7)
              if ( totalMatched > canvas.height * 0.7) return 0;		
              return 1;
          
          }  

          const step1= (type) => {            
            identitytype=type;	
            overlaysetup();
            step2();
          }
        step1('pan');
      /***************************************************** */
  };

  const setClientDetails = (data) => {

    setUserName(data.name);
    setClientName(data.name);
    setName(data.name);
    setClientPAN(data.pan);
    setClientlatitude(data.latitude);
    setClientlongitude(data.longitude);
    setclient_referenceno(data.referenceno);

    console.log("data latitude==="+data.latitude);
    console.log("data longitude==="+data.longitude);

  }

  const callUser = async(id) => {

    
    const resp = await axios.get(URL+'getsocketid');
    var socketdt=resp.data;
    var id=socketdt.hostid;
    var clientsocketid=socketdt.clientid;
    setMe(clientsocketid);
    const peer = new Peer({ initiator: true, trickle: false, stream });
    setOtherUser(id);

    peer.on("signal", (data) => {
      socket.emit("callUser", { userToCall: id, signalData: data, from: clientsocketid, name,});
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;   
      client_overlaysetup();
    });

    socket.on("callAccepted", ({ signal, userName }) => {

      setCallAccepted(true);
      setUserName(userName);
      peer.signal(signal);

      socket.emit("updateMyMedia", {
        type: "pan", currentMediaStatus: [myMicStatus, myVdoStatus],
      });     

      socket.emit("updateClientDatatoHost", {
        to: id,
        name:clientName,
        pan:clientPAN,
        latitude:clientLatitude,
        longitude: clientLongitude,
        referenceno:client_referenceno
      });

    });    

    connectionRef.current = peer;
    function client_overlaysetup() {
        $(".overlay_client").css({"width":"100%","height":"100%"});
        $(".overlay_client_outer").css({"width":"90%","height":overlaylayerheight+"%","padding":"30px"});
    }

  };

  const updateVideo = () => {
    console.log("updateVideo")
    setMyVdoStatus((currentStatus) => {
      socket.emit("updateMyMedia", {
        type: "video", currentMediaStatus: !currentStatus,
      });
      stream.getVideoTracks()[0].enabled = !currentStatus;
      return !currentStatus;
    });
  };

  const updateMic = () => {
    setMyMicStatus((currentStatus) => {
      socket.emit("updateMyMedia", {
        type: "mic", currentMediaStatus: !currentStatus,
      });

      stream.getAudioTracks()[0].enabled = !currentStatus;
      return !currentStatus;
    });
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    socket.emit("endCall", { id: otherUser });
    window.location.reload();
  };

  const leaveCall1 = () => {
    socket.emit("endCall", { id: otherUser });
  };

  const sendMsg = (value) => {

    console.log("sending msg "+ value)
    socket.emit("msgUser", { name, to: otherUser, msg: value, sender: name });
    let msg = {};
    msg.msg = value;
    msg.type = "sent";
    msg.timestamp = Date.now();
    msg.sender = name;
    setChat([...chat, msg]);
  };

  useEffect(() => {    
      if(curentcallerType =="client") {
        callUser('');        
      }
  },[stream]);
  
  return (
    <VideoContext.Provider
      value={{ call, callAccepted, myVideo, userVideo, stream, name, setName, callEnded, me, callUser, leaveCall, setClientDetails,
        answerCall, sendMsg, msgRcv, chat, setChat, setMsgRcv, setOtherUser, leaveCall1, userName, myVdoStatus,
        setMyVdoStatus, userVdoStatus, setUserVdoStatus, updateVideo, myMicStatus, userMicStatus, updateMic,
        clientName, clientPAN, clientLatitude, clientLongitude, client_address,userPANStatus,progressbarPercentage,clientVideoHeight,currentTab,otherUser,aadharUploadStatus,curentcallerType
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export default VideoState;
