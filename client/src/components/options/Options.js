import React, { useState, useContext, useEffect, useRef } from "react";
import { Input, Button, Tooltip, Modal, message } from "antd";
import Phone from "../../assests/phone.gif";
import Teams from "../../assests/teams.mp3";
import * as classes from "./Options.module.css";
import { CopyToClipboard } from "react-copy-to-clipboard";
import VideoContext from "../../context/VideoContext";
import Hang from "../../assests/hang.svg";

import {
  TwitterIcon,
  TwitterShareButton,
  WhatsappShareButton,
  WhatsappIcon,
  FacebookIcon,
  FacebookShareButton,
} from "react-share";

import {
  UserOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

import { socket } from "../../context/VideoState";

const Options = () => {

  const [idToCall, setIdToCall] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const Audio = useRef();

  const {
    call,
    callAccepted,
    myVideo,
    userVideo,
    stream,
    name,
    setName,
    callEnded,
    me,
    callUser,
    leaveCall,
    answerCall,
    otherUser,
    setOtherUser,
    leaveCall1,
  } = useContext(VideoContext);

  useEffect(() => {

    if (isModalVisible) {
      Audio?.current?.play();
    } else Audio?.current?.pause();
  }, [isModalVisible]);

  const showModal = (showVal) => {
    setIsModalVisible(showVal);
  };

  const handleCancel = () => {

    setIsModalVisible(false);
    leaveCall1();
    window.location.reload();
  };

  useEffect(() => {

    if (call.isReceivingCall && !callAccepted) {
      setIsModalVisible(true);
      setOtherUser(call.from);
    } else setIsModalVisible(false);
  }, [call.isReceivingCall]);


  useEffect(() => {

    /*if(stream) {
      const queryParams = new URLSearchParams(window.location.search);
      const id = queryParams.get('id');
      if(id !=null) {
          setIdToCall(id);                    
      }        
    } */
    
  }); 

  return (
    <div className="options_layer">
      <div style={{ marginBottom: "0.5rem" }}>
        {callAccepted && !callEnded ? (
          <Button
            variant="contained"
            onClick={leaveCall}
            className={classes.hang}
            tabIndex="0"
          >
            <img src={Hang} alt="hang up" style={{ height: "15px" }} />
            &nbsp; Hang up
          </Button>
        ) : (

          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={() => {
              if (name.length) callUser(idToCall);
              else message.error("Please enter your name to call!");
            }}
            className="Options_hang__2DAHh"
            tabIndex="0"
          >
            Call
          </Button>

        )}
      </div>

      {call.isReceivingCall && !callAccepted && (
        <>
          <audio src={Teams} loop ref={Audio} />
          <Modal
            title="Incoming Call"
            visible={isModalVisible}
            onOk={() => showModal(false)}
            onCancel={handleCancel}
            footer={null}
          >
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <h1>
                {call.name} is calling you:{" "}
                <img
                  src={Phone}
                  alt="phone ringing"
                  className={classes.phone}
                  style={{ display: "inline-block" }}
                />
              </h1>
            </div>
            <div className={classes.btnDiv}>
              <Button
                variant="contained"
                className={classes.answer}
                color="#29bb89"
                icon={<PhoneOutlined />}
                onClick={() => {
                  answerCall();
                  Audio.current.pause();
                }}
                tabIndex="0"
              >
                Answer
              </Button>
              <Button
                variant="contained"
                className={classes.decline}
                icon={<PhoneOutlined />}
                onClick={() => {
                  setIsModalVisible(false);
                  Audio.current.pause();
                }}
                tabIndex="0"
              >
                Decline
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Options;
