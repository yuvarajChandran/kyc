import { useEffect } from "react";
import React from "react";
import Video from "./components/Video/Video";
import VideoState from "./context/VideoState";
import Options from "./components/options/Options";
class Home extends React.Component {
  
  render() {
      return (
        <VideoState>
          <div className="App" style={{ height: "100%", width: "100%" }}>
            <Video />
            <Options />
          </div>
        </VideoState>
      );
  }
}

export default Home;
