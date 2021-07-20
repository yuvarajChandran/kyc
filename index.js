const app = require('express')();
const fileUpload = require('express-fileupload');
const cors = require("cors");
const mysql = require('mysql');
var url = require('url');
var filessystem = require('fs');
const http = require('http');
const unzipper = require('unzipper');
var parser = require('xml2json-light');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
let hostsocketid='';
let clientsocketid='';
let callerid='';
let latitude='';
let longitude='';

const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  }
});

app.use(fileUpload());
app.use(cors());

//MySQL details
var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kyc_app',
  multipleStatements: true
});

mysqlConnection.connect((err)=> {

  if(!err)
      console.log('Connection Established Successfully');
  else
      console.log('Connection Failed!'+ JSON.stringify(err,undefined,2));
});

app.post('/upload', (req, res) => {

  let passcode=req.body.passcode;
  if (req.files === null) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  const file = req.files.file;
  const fullpath=`${__dirname}/client/public/uploads/${file.name}`;
  file.mv(`${__dirname}/client/public/uploads/${file.name}`, err => {
	
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    (async () => {

      try {
        const directory = await unzipper.Open.file(fullpath);
        const extracted = await directory.files[0].buffer(passcode);
        
        let xml=extracted.toString();
        var json=parser.xml2json(xml); 

        var OfflinePaperlessKyc=json.OfflinePaperlessKyc;
        var UidData=OfflinePaperlessKyc.UidData;
        var Poi=UidData.Poi;
        var Pht=UidData.Pht;

        var dob=Poi.dob;
        var gender=Poi.gender;
        var name=Poi.name;
        var email=Poi.e;
        var mobile=Poi.m;
        var Poa=UidData.Poa;
      
        var Poa=UidData.Poa;
        var careof=Poa.careof;
        var country=Poa.country;
        var dist=Poa.dist;
        var house=Poa.house;
        var landmark=Poa.landmark;
        var loc=Poa.loc;
        var pc=Poa.pc;
        var po=Poa.po;
        var state=Poa.state;
        var street=Poa.street;
        var address=careof+" ,"+house+" ,"+street+" ,"+loc+" ,"+landmark+" ,"+po+" ,"+state+" ,"+pc;

        var sql = "update memberkyc set aadhar_name='"+name+"',aadhar_gender='"+gender+"', aadhar_email='"+email+"', aadhar_mobile='"+mobile+"', aadhar_dob='"+dob+"',aadhar_photo='"+Pht+"', aadhar_address='"+address+"' where referenceno='5946c8bf997534bbbade9e91a24e8899'";
        mysqlConnection.query(sql, function (err, result) {
          if (err) throw err;
          console.log(result.affectedRows + " record(s) updated");
        });

        filessystem.unlinkSync(fullpath);

        var obj={};
        obj['status']=true;
        obj['fileName']=file.name;
        res.json(obj);

      } catch(e) {

        var obj={};
        obj['status']=false;
        obj['error']=e.message;
        res.json(obj);

        console.log(e);
      }
      
    })();
  });
  
});

app.post('/saveocrdata', (req, res) => {

  const referenceno=req.body.referenceno;
  var memberid=getmemberid(referenceno);
  var dir =`${__dirname}/client/public/uploads/${memberid}`;
  //var dir =`C:/xampp/htdocs/kyc/uploads/${memberid}`;
  if (!filessystem.existsSync(dir))
  {
    filessystem.mkdirSync(dir);
  }

  const latitude=req.body.latitude;
  const longitude=req.body.longitude;
  const data=JSON.parse(req.body.data);  
  //const video_blob = req.files.file;
  //for(var d=0;d<data.length;d++) {

      var type=data[0].type;
      var number=data[0].type;
      var status=data[0].status;
      var image=data[0].image;
      var imagefilename='';
      if(image !="") {
        imagefilename=Math.random()+".png";
        console.log(imagefilename);
        var base64Data =image.replace(/^data:image\/png;base64,/, "");
        require("fs").writeFile(dir+"/"+imagefilename, base64Data, 'base64', function(err) {
          console.log(err);
        });
      }

      console.log("type===="+type);
      console.log("status==="+status);
      console.log("number==="+number);
 // } 

      console.log("referenceno====="+referenceno);
      console.log("latitude====="+latitude);
      console.log("longitude====="+longitude);
  //console.log("video-blob===="+video_blob);
  
  let now_local = new Date();
  let newdt=GetFormattedDate(now_local);
  console.log(newdt);
  var sql = "insert into memberverification(referenceno, type, identitynumber,unixtimestamp, filename, createdOn) values('"+referenceno+"','PAN','"+number+"','"+Math.random().toString().slice(2,11) +"','"+imagefilename+"','"+newdt+"');";
  mysqlConnection.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) updated");
  });
  res.send({data:true});
});

function GetFormattedDate(date) {
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  var day  = ("0" + (date.getDate())).slice(-2);
  var year = date.getFullYear();
  var hour =  ("0" + (date.getHours())).slice(-2);
  var min =  ("0" + (date.getMinutes())).slice(-2);
  var seg = ("0" + (date.getSeconds())).slice(-2);
  return year + "-" + month + "-" + day + " " + hour + ":" +  min + ":" + seg;
}

app.get('/getprocesssteps', (req, res) => {

  var resultset={};
  var stepquery="select id,step from process_steps;";
  var stepdata=getsqldata(stepquery);
  resultset['stepdata']=stepdata;

  var questionquery="select id,stepid,question from process_questions;";
  var questiondata=getsqldata(questionquery);
  resultset['questiondata']=questiondata;

  var checklistquery="select id,stepid,questionid,checklist from process_checklist;";
  var checklistdata=getsqldata(checklistquery);
  resultset['checklistdata']=checklistdata;
  res.send({resultset});

});

app.get('/getsocketid', (req, res) => {

  var obj={};
  obj['hostid']=hostsocketid;
  obj['clientid']=clientsocketid;
  res.send(obj);
  
});

app.get('/clientaadhardata', (req, res) => {

  var query="select aadhar_name,aadhar_gender,aadhar_email,aadhar_mobile,aadhar_dob,aadhar_photo,aadhar_address  from memberkyc where referenceno='5946c8bf997534bbbade9e91a24e8899'";
  mysqlConnection.query(query, (err, rows, fields) => {
  if (!err)   {  
    res.send({rows});
  }                 
   else  console.log(err);
  })  
});

app.post('/clientbasicdetails', (req, res) => {

  var referenceno=req.body.referenceno;
  var query="select m.firstname,m.lastname,m.email,m.mobile,m.pan,m.aadhar,m.passport,m.address from members m join memberkyc mk on mk.memberid=m.id  where mk.referenceno='"+referenceno+"'";
  mysqlConnection.query(query, (err, rows, fields) => {
  if (!err)   {  
    res.send({rows});
  }                 
   else  console.log(err);
  })  
});

app.post('/setlatlang', (req, res) => {

  latitude=req.latitude;
  longitude=req.longitude;
  callerid=req.callerid;

  console.log("latitude===="+latitude);
  console.log("longitude===="+longitude);
  console.log("callerid===="+callerid);  

});

app.get('/getlatlang', (req, res) => {
  var obj={};
  obj['latitude']=latitude;
  obj['longitude']=longitude;
  res.send(obj);
});



function getsqldata(sqlquery) {
  
  var sync = true;
  var data='';
  mysqlConnection.query(sqlquery, (err, rows, fields) => {
    if (!err) {
        data=rows;
        sync = false;
    }
    else{
        console.log(err);
    }
  })
  while(sync) {require('deasync').sleep(100);}
  return data;
}

function getmemberid(referenceno) {

    var query="select memberid as id from memberkyc where referenceno='"+referenceno+"'";
    var sync = true;
    var memberid='';
    mysqlConnection.query(query, (err, rows, fields) => {
    if (!err)   {      
      var mysqlrowdata = JSON.parse(JSON.stringify(rows[0]));
      console.log("memberid inside getdata func====="+mysqlrowdata.id);
      sync = false;
      memberid=mysqlrowdata.id;
    }                 
    else {
        console.log(err);
      }
    })
    while(sync) {require('deasync').sleep(100);}
    return memberid;
}

io.on("connection", (socket) => {

  let type=socket.handshake.query.type;
  if(type=="client")
    clientsocketid=socket.id;
  else hostsocketid=socket.id;

  console.log("hostsocketid===="+hostsocketid);
  console.log("clientsocketid===="+clientsocketid);

  socket.emit("me",socket.id);
  socket.on("disconnect", () => {
    socket.broadcast.emit("endCall");
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {

    io.to(userToCall).emit("callUser", {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on("aadharuploadcompleted",() => {
    console.log("=====aadharuploadcompleted====");
    socket.broadcast.emit("aadharuploadcompletedRcv");
  });

  socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
    socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
  });

  socket.on("updateProgressbar", ({to, percentage }) => {
    io.to(to).emit("updateProgressbarRcv", {percentage});
  });

  socket.on("updateClientDatatoHost", ({to, name,pan,latitude,longitude,referenceno }) => {

    console.log("======updateClientDatatoHost=====");
    console.log("======latitude===="+latitude);
    console.log("======longitude===="+longitude);
    console.log("======referenceno===="+referenceno);

    io.to(to).emit("updateClientDatatoHostRcv", {name,pan,latitude,longitude,referenceno});
  });

  

  socket.on("updateUploadProgressbar", ({to, percentage }) => {
    io.to(to).emit("updateUploadProgressbarRcv", {percentage});
  });

  socket.on("aadharuploaddone", ({to }) => {
    io.to(to).emit("aadharuploaddoneRcv");
  });
  
  socket.on("updatePANStatus", ({to, status }) => {
    io.to(to).emit("updatePANStatusRcv", {status});
  });



  socket.on("updateClientVideoHeight", ({to, videoheight }) => {
    io.to(to).emit("updateClientVideoHeightRcv", {videoheight});
  });

  

  socket.on("msgUser", ({ name, to, msg, sender }) => {
    io.to(to).emit("msgRcv", { name, msg, sender });
  });

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    io.to(data.to).emit("callAccepted", data);
  });

  socket.on("endCall", ({ id }) => {
    io.to(id).emit("endCall");
  });

});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
