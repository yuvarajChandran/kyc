import React, { useContext, useEffect, useState, useRef,useLayoutEffect } from "react";
import VideoContext from "../../context/VideoContext";
import "./Video.css";
import { Card, Modal, Button, Input, notification, Avatar } from "antd";
import $ from "jquery";
import VideoIcon from "../../assests/video.svg";
import { io } from "socket.io-client";
import VideoOff from "../../assests/video-off.svg";
import Msg_Illus from "../../assests/msg_illus.svg";
import userImage from "../../user.png";
import { useParams } from 'react-router';
import Msg from "../../assests/msg.svg";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";
import { socket } from "../../context/VideoState";
import { Row,Col} from 'react-bootstrap';
import {Tabs, Tab} from 'react-bootstrap-tabs';
import axios from 'axios';
import FileUpload from '../FileUpload';
import AadharData from '../AadharData';
import Header from "../Header/Header";
import * as faceapi from 'face-api.js';

const { Search } = Input;
var key='';
var value='';
const params = {}
window.location.search.substr(1).split('&').forEach(pair => {
  [key, value] = pair.split('=')
  params[key] = value
})

var clienttype='host';
var hostflag=false;
var clientflag=false;
if(params.type != undefined || params.type !='')
  clienttype=params.type;

if(clienttype == 'host') {
  hostflag=true;
  clientflag=false;
}

if(clienttype == 'client') {
  clientflag=true;
  hostflag=false;
}

const URL=global.URL;
const Video = ({clientDataObj}) => {

  const { call, callAccepted, myVideo, userVideo, stream, name, setName, callEnded, me, callUser,setClientDetails,
    leaveCall, answerCall, sendMsg: sendMsgFunc, msgRcv, chat, setChat, userName, myVdoStatus,
    userVdoStatus, updateVideo, myMicStatus, userMicStatus, updateMic, clientName, clientPAN,
    clientLatitude, clientLongitude, client_address,userPANStatus,progressbarPercentage,clientVideoHeight,currentTab,aadharUploadStatus,curentcallerType
  } = useContext(VideoContext);

  const [sendMsg, setSendMsg] = useState("");
  const [host_flag, setHostflag] = useState(false);
  const [client_flag, setClientflag] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clientAadharData, setclientAadharData] = useState("");
  const [client_data_flag, set_client_dataflag] = useState(true); 
  const [makecallflag, setmakecallflag] = useState(false); 

  const [aadhardataflag, setaadhardataflag] = useState("hide"); 

  const [clientId, setclientId] = useState(''); 
  const [client_firstname,setclient_firstname] = useState("");
  const [client_lastname, setclient_lastname] = useState("");
  const [client_email, setclient_email] = useState("");
  const [client_mobile, setclient_mobile] = useState("");
  const [client_pan, setclient_pan] = useState("");
  const [client_aadhar, setclient_aadhar] = useState("");
  const [client_passport, setclient_passport] = useState("");
  const [client_VideoHeight,setclient_VideoHeight] = useState(clientVideoHeight);
  

  useEffect(() => {
    if(curentcallerType =="client") {      
      setClientDetails(clientDataObj);
    }
  },[curentcallerType]);

  useEffect(() => {
    setclient_VideoHeight(clientVideoHeight);
  },[clientVideoHeight]);

  
  useEffect( async() => {

    var clientid=params.id;
    setclientId(clientid);
    const formData=new FormData();		        						
    formData.append("referenceno",clientid);	
    const response = await axios.post('/clientbasicdetails', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });  

    var responsedata=response.data;              
    var rowdata=responsedata.rows;
    if(rowdata.length > 0) {

        setclient_firstname(rowdata[0].firstname);
        setclient_lastname(rowdata[0].lastname);
        setclient_email(rowdata[0].email);
        setclient_mobile(rowdata[0].mobile);
        setclient_pan(rowdata[0].pan);
        setclient_aadhar(rowdata[0].aadhar);
        setclient_passport(rowdata[0].passport);
    }
    else {
      set_client_dataflag(false);
    }

  },[client_data_flag]);

  const captureFace = () => {

      alert("Inside VideoState");
    /*******************Face Detection******************/      
       var localvideo=document.getElementById('localVideo');
        console.log("localvideo");
        console.log(localvideo);
        if ( localvideo === null ) return;

        const canvas = faceapi.createCanvasFromMedia(localvideo);
        canvas.id ="faceapicanvas";
        canvas.style.border = "2px solid red";
        document.body.append(canvas)  
        const displaySize = { width: localvideo.width, height: localvideo.height }  
        faceapi.matchDimensions(canvas, displaySize)  

        setInterval(async () => {
          
          const detections = await faceapi.detectAllFaces(localvideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
          
          console.log("====detections=====");
          console.log(detections);
          console.log("====detections=====");

          //const resizedDetections = faceapi.resizeResults(detections, displaySize)
          //canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
          //faceapi.draw.drawDetections(canvas, resizedDetections)
          //extractFaceFromBox(localvideo, detections[0].detection.box)
          //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
          //faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        
        }, 100)

        var outputImage = document.getElementById('outputImage')
        async function extractFaceFromBox(inputImage, box) { 
      
          var xaxis=box.x;
          var yaxis=box.y;    
              
          var boxwidth=box.width;
          var boxheight=box.height;        
          const regionsToExtract = [
              new faceapi.Rect(xaxis , yaxis , boxwidth , boxheight)
          ]
                      
          let faceImages = await faceapi.extractFaces(inputImage, regionsToExtract)
          if(faceImages.length == 0){
              console.log('Face not found')
          }
          else
          {
              faceImages.forEach(cnv =>{      
                  outputImage.src = cnv.toDataURL();      
              })
          }   
      }                   

  }

  const firstComponent = () => {

      return (<Tabs >
        <Tab label="Questions">
            <Row>
                <Col md='12' className="mgt-10"> 
                    <label>1. Please Enter Your PAN Number</label>
                </Col>
                <Col md='12' className="mgt-10"> 
                    <input type="text" class='form-control'></input>
                </Col>
             </Row>
             <Row>
                <Col md='12' className="mgt-10"> 
                    <label>2. Please Enter Your Name as per PAN Card</label>
                </Col>
                <Col md='12' className="mgt-10"> 
                    <input type="text" class='form-control'></input>
                </Col>
             </Row>
          </Tab>
          <Tab label="Check List">
             <Row>
                <Col md='12' className="mgt-10"> 
                    <label> <input type="checkbox"/> Do you have the Original PAN Card</label>
                </Col>
                <Col md='12' className="mgt-10"> 
                    <label> <input type="checkbox"/> Did your PAN is Linked to Income Tax Department</label>
                </Col>
             </Row>
          </Tab>
      </Tabs>)    
  }

  const secondComponent = () => {

    return (<Tabs>
      <Tab label="Questions">
          <Row>
              <Col md='12' className="mgt-10"> 
                  <label>1. Please Enter Your Aadhar Number</label>
              </Col>
              <Col md='12' className="mgt-10"> 
                  <input type="text" class='form-control'></input>
              </Col>
           </Row>
           <Row>
              <Col md='12' className="mgt-10"> 
                  <label>2. Please Enter Your Name as per Aadhar Card</label>
              </Col>
              <Col md='12' className="mgt-10"> 
                  <input type="text" class='form-control'></input>
              </Col>
           </Row>
        </Tab>
        <Tab label="Check List">
           <Row>
              <Col md='12' className="mgt-10"> 
                  <label> <input type="checkbox"/> Do you have the Original Aadhar Card</label>
              </Col>              
           </Row>
        </Tab>
        <Tab label="Aadhar Data" className="aadhardataflag">
            <AadharData />
        </Tab>
    </Tabs>)    
  }

  const finalComponent = () => {

    return (<Tabs >
      <Tab label="Questions">
          <Row>
              <Col md='12' className="mgt-10"> 
                  <label>1. Please Enter Your Passport Number</label>
              </Col>
              <Col md='12' className="mgt-10"> 
                  <input type="text" class='form-control'></input>
              </Col>
           </Row>
           <Row>
              <Col md='12' className="mgt-10"> 
                  <label>2. Please Enter Your Name as per Passport </label>
              </Col>
              <Col md='12' className="mgt-10"> 
                  <input type="text" class='form-control'></input>
              </Col>
           </Row>
        </Tab>
        <Tab label="Check List">
           <Row>
              <Col md='12' className="mgt-10"> 
                  <label> <input type="checkbox"/> Do you have the Original Passport</label>
              </Col>
           </Row>
        </Tab>
    </Tabs>)    

  }
  

  const [steps, setSteps] = useState([
    { key: 'firstStep', label: 'PAN Card', isDone: true, component: firstComponent},
    { key: 'secondStep', label: 'Aadhar Card', isDone: false, component: secondComponent},
    { key: 'finalStep', label: 'Passport', isDone: false, component: finalComponent}
  ]);

  const [activeStep, setActiveStep] = useState(steps[currentTab]);
  const handleNext = () => {
    if (steps[steps.length - 1].key === activeStep.key) {
      alert('You have completed all steps.');
      return;
    }

    const index = steps.findIndex(x => x.key === activeStep.key);
    setSteps(prevStep => prevStep.map(x => {
      if (x.key === activeStep.key) x.isDone = true;
      return x;
    }))
    setActiveStep(steps[index + 1]);
  }

  const handleBack = () => {
    const index = steps.findIndex(x => x.key === activeStep.key);
    if (index === 0) return;

    setSteps(prevStep => prevStep.map(x => {
      if (x.key === activeStep.key) x.isDone = false;
      return x;
    }))
    setActiveStep(steps[index - 1]);
  }

  socket.on("msgRcv", ({ name, msg: value, sender }) => {
    
    let msg = {};
    msg.msg = value;
    msg.type = "rcv";
    msg.sender = sender;
    msg.timestamp = Date.now();
    setChat([...chat, msg]);    
  });

  const dummy = useRef();

  useEffect(() => {
    if (dummy?.current) dummy.current.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const showModal = (showVal) => {
    setIsModalVisible(showVal);
  };

  const onSearch = (value) => {
    if (value && value.length) sendMsgFunc(value);
    setSendMsg("");
  };

  useEffect(() => {
    if (msgRcv.value && !isModalVisible) {
      notification.open({
        message: "",
        description: `${msgRcv.sender}: ${msgRcv.value}`,
        icon: <MessageOutlined style={{ color: "#108ee9" }} />,
      });
    }
  }, [msgRcv]);


  useEffect(() => {
    setActiveStep(steps[currentTab])
  }, [currentTab]);


  const fetchData = async () => {
      const response = await axios.get('/getprocesssteps');
      return  response;
  }

  useEffect(() => {

   /* fetchData().then(processstepdata => {
      console.log(processstepdata);    
      var stepArray=[];
      var obj={};
      obj['key']="firstStep";
      obj['label']="PAN Card";
      obj['isDone']=true;
      obj['component']="firstComponent";
      stepArray.push(obj);

      var obj1={};
      obj1['key']="secondStep";
      obj1['label']="Aadhar Card";
      obj1['isDone']=true;
      obj1['component']="secondComponent";
      stepArray.push(obj1);
      setSteps(stepArray);
    }) */

  },[]);

  return (
    <div>
      <Header/>      
      {hostflag && (
        <Row className="pd-10">   
            <Col md="4" className="video-avatar-container_receiver call-window">    

              {!callAccepted  && (
                <div className="align-center">
                  <div  className='messagelayer'>
                    Client Video
                  </div>
                  <div className="userImage">
                    <img src={userImage} width="250px" />
                  </div>
                </div>
              )}

              {callAccepted && !callEnded && userVideo && (
                  <div style={{width:'100%'}}>   
                  <div  className='messagelayer'>                           
                    <div class='progress-bar progress-bar-warning progress-bar-striped active' 
                        role='progressbar' 
                        aria-valuenow={progressbarPercentage} 
                        aria-valuemin='0' 
                        aria-valuemax='100' 
                        style={{width:progressbarPercentage+'%'}}>
                        {progressbarPercentage}%
                    </div>
                    <div id="messagelayer"></div>
                  </div>   
                  <div className="card2" style={{ textAlign: "center" }} id="video2">                                        
                            <span className="overlay_outer">
                              <canvas className="overlay"></canvas>
                            </span> 
                          </div>  

                        <video id="localVideo"  width="350" height="400"
                          playsInline
                          ref={userVideo}
                          autoPlay
                          className="video-active"
                          style={{
                            opacity: `${userVdoStatus ? "1" : "0"}`,
                          }}
                        />
                       <span className="callerName">{userName || call.name} </span>                        
                    </div>
                    )}


          </Col>

          <Col md="2" className="pdl-10">            
            <Row>
              <Col md="12" className="client_faceimage">
                {stream ? (
                      <div
                        style={{ textAlign: "center" }}              
                        id={callAccepted && !callEnded ? "video1" : "video3"}
                      >                                  
                        <div className="video-avatar-container">                                        
                          <video playsInline muted ref={myVideo} id="first_video" autoPlay className="video-active"
                            style={{ opacity: `${myVdoStatus ? "1" : "0"}`,
                              transform: "scaleX(-1)",
                            }}
                          />
                        </div>
                        <div className="iconsDiv" style={{display:'none'}}>
                          <div
                            className="icons"
                            onClick={() => {
                              updateMic();
                            }}
                            tabIndex="0"
                          >
                            <i className={`fa fa-microphone${myMicStatus ? "" : "-slash"}`}
                              style={{ transform: "scaleX(-1)" }}
                              aria-label={`${myMicStatus ? "mic on" : "mic off"}`}
                              aria-hidden="true" ></i>
                          </div>

                          {callAccepted && !callEnded && (
                            <div className="icons"
                              onClick={() => { setIsModalVisible(!isModalVisible); }}
                              tabIndex="0" >
                              <img src={Msg} alt="chat icon" />
                            </div>
                          )}

                          <Modal title="Chat" footer={null} visible={isModalVisible} onOk={() => showModal(false)} 
                          onCancel={() => showModal(false)} style={{ maxHeight: "100px" }} >
                            {chat.length ? (
                              <div className="msg_flex">
                                {chat.map((msg) => (
                                  <div className={msg.type === "sent" ? "msg_sent" : "msg_rcv"} >
                                    {msg.msg}
                                  </div>
                                ))}
                                <div ref={dummy} id="no_border"></div>
                              </div>
                            ) : (
                              <div className="chat_img_div">
                                <img src={Msg_Illus} alt="msg_illus" className="img_illus" />
                              </div>
                            )}
                            <Search placeholder="your message" allowClear className="input_msg" enterButton="Send 🚀"
                              onChange={(e) => setSendMsg(e.target.value)} value={sendMsg} size="large" onSearch={onSearch} />
                          </Modal>

                          <div className="icons" onClick={() => updateVideo()} tabIndex="0">
                            {myVdoStatus ? (
                              <img src={VideoIcon} alt="video on icon" />
                            ) : (
                              <img src={VideoOff} alt="video off icon" />
                            )}
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div className="bouncing-loader">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    )}
              </Col>

              <Col md="12" className="pd-20 client_faceimage">
                  <img src="usericon.jpg" id="outputImage" height='110'/>
                  {userPANStatus && (
                       <input type="button" className="btn btn-danger capturefacebtn" value="Capture Face" onClick={captureFace} />
                  )}                 
              </Col>  

              <Col md="12" className="pd-10 mgt-5 client_faceimage">
                  <div id='pan_1_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas></canvas>
                    <img src="" style={{display:'none'}} height='110'/> 
                  </div>
                  <div id='pan_2_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas></canvas>
                    <img src="" height='110' style={{display:'none'}} />
                  </div>
                  <div id='pan_3_layer' className="mgt-10">
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
                  <div id='pan_4_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
                  <div id='pan_5_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
                  <div id='pan_6_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
                  <div id='pan_7_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
                  <div id='pan_8_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>                  
                  <div id='pan_9_layer' className="mgt-10" style={{display:'none'}}> 
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
                  <div id='pan_10_layer' className="mgt-10" style={{display:'none'}}>
                    <canvas style={{display:'none'}}></canvas>
                    <img src="" height='110' />
                  </div>
              </Col>
          </Row>            
      </Col>

      <Col md="6" className="pdl-10">
      
      <div className="row pd-10 pdt-0">        
        <div className="tabs_layer">
            <div className="box">
              <div className="steps">
                <ul className="nav">
                  {steps.map((step, i) => {
                    return <li key={i} className={`${activeStep.key === step.key ? 'active' : ''} ${step.isDone ? 'done' : ''}`}>
                      <div><span>{step.label}</span></div>
                    </li>
                  })}
                </ul>
              </div>
            <div className="step-component">
           {activeStep.component()}
        </div>
        <div className="btn-component mgt-20">
          <input type="button" className="btn btn-danger" value="Back" onClick={handleBack} disabled={steps[0].key === activeStep.key} />
          <input type="button" className="btn btn-danger" value={steps[steps.length - 1].key !== activeStep.key ? 'Next' : 'Submit'} onClick={handleNext} />
        </div>
      </div>
    </div>

        </div>
      </Col>
    </Row>   
    )}


   {clientflag && (
      <div class="video-container">
        {stream ? (
            <div
              className={ !userPANStatus ? 'video-container-absolute' : ''}
            >
              
            {callAccepted && !callEnded && userVideo && (
              <div className="progress-bar-client-layer">
                <div class='progress progress-bar-client'>

                    <div class='progress-bar progress-bar-warning progress-bar-striped active' 
                        role='progressbar' 
                        aria-valuenow={progressbarPercentage} 
                        aria-valuemin='0' 
                        aria-valuemax='100' 
                        style={{width:progressbarPercentage+'%'}}>
                        {progressbarPercentage}%
                    </div>
                </div>
              </div>
            )}

            {callAccepted && !callEnded && userVideo && !userPANStatus && (
                <span className="overlay_client_outer">
                  <canvas className="overlay_client"></canvas>
                </span>  
            )}

                <video
                  playsInline
                  muted
                  ref={myVideo}
                  id="client_video"
                  autoPlay
                  className="video-active"
                  height={client_VideoHeight+'%'}
                  style={{
                    opacity: `${myVdoStatus ? "1" : "0"}`
                  }}
                />
                
                {userPANStatus  && !callEnded && userVideo &&  !aadharUploadStatus && (
                  <FileUpload />
                )}

            </div>
          ) : (
            <div className="bouncing-loader">
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}     

          {callAccepted && !callEnded && userVideo && (
                    <div>
                        <video id="host_video"
                          playsInline
                          ref={userVideo}
                          autoPlay
                          className="video-active"
                          style={{
                            opacity: `${userVdoStatus ? "1" : "0"}`,
                          }}
                        />
                       <span className="callerName">{userName || call.name} </span>                        
                </div>
            )}     
      </div>
    )}
  </div>
  );
};

export default Video;
