var express = require('express');
var app = express();
var http = require('http').Server(app);
var NodeCache = require( "node-cache" );

var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');

var cache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

/* room service loader */
var roomServicePath = __dirname + '/src/protos/RoomService.proto';
var roomServicePackageDefinition = protoLoader.loadSync(
  roomServicePath,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);
var roomServicePackage = grpc.loadPackageDefinition(roomServicePackageDefinition).com.huytran.grpcdemo.generatedproto;
var roomService = new roomServicePackage.RoomService(
  'localhost:6565',
  grpc.credentials.createInsecure()
);

/* contract service loader */
var contractServicePath = __dirname + '/src/protos/ContractService.proto';
var contractServicePackageDefinition = protoLoader.loadSync(
  contractServicePath,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);
var contractServicePackage = grpc.loadPackageDefinition(contractServicePackageDefinition).com.huytran.grpcdemo.generatedproto;
var contractService = new contractServicePackage.ContractService(
  'localhost:6565',
  grpc.credentials.createInsecure()
);

/* user service loader */
var userServicePath = __dirname + '/src/protos/UserService.proto';
var userServicePackageDefinition = protoLoader.loadSync(
  userServicePath,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);
var userServicePackage = grpc.loadPackageDefinition(userServicePackageDefinition).com.huytran.grpcdemo.generatedproto;
var userService = new userServicePackage.UserService(
  'localhost:6565',
  grpc.credentials.createInsecure()
);

// init server
const server = app.listen(3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

// config
app.use(express.static(__dirname + '/src'));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// url api
app.get('/login', function (req, res) {
  if (cache.get("token") ===  undefined) {
    res.sendFile(__dirname + '/src/login.html');
  } else {
    res.redirect('/');
  }
});

app.get('/', function (req, res) {
  if (cache.get("token") ===  undefined) {
    res.redirect('/login');
  } else {
    res.sendFile(__dirname + '/src/index.html');
  }
});

app.get('/room', function (req, res) {
  if (cache.get("token") ===  undefined) {
    res.redirect('../login');
  } else {
    res.sendFile(__dirname + '/src/room.html');
  }
});

app.get('/contract', function (req, res) {
  if (cache.get("token") ===  undefined) {
    res.redirect('/login');
  } else {
    res.sendFile(__dirname + '/src/contract.html');
  }
});

app.get('/user', function (req, res) {
  if (cache.get("token") ===  undefined) {
    res.redirect('/login');
  } else {
    res.sendFile(__dirname + '/src/user.html');
  }
});

// data api
app.post('/getRoom', function (req, res) {
  var token = cache.get('token');
  var metadata = new grpc.Metadata();
  metadata.add("Authorization", token)

  var message = {}

  roomService.getAllRoomForAdmin(message, metadata, function (err, response) {
    if (!err) {
      res.json({ roomList: response.room });
    } else {
      res.redirect('/login')
    }
  })
})

app.post('/getContract', function (req, res) {
  var token = cache.get('token');
  var metadata = new grpc.Metadata();
  metadata.add("Authorization", token)

  var message = {}

  contractService.getAllContractForAdmin(message, metadata, function (err, response) {
    if (!err) {
      res.json({ contractList: response.contract });
    } else {
      res.redirect('/login')
    }
  })
})

app.post('/getUser', function (req, res) {
  var token = cache.get('token');
  var metadata = new grpc.Metadata();
  metadata.add("Authorization", token)

  var message = {}

  userService.getAllUserForAdmin(message, metadata, function (err, response) {
    if (!err) {
      res.json({ userList: response.user });
    } else {
      res.redirect('/login')
    }
  })
})

app.post('/loginForAdmin', function (req, res) {
  var message = {
    name: req.body.name,
    password: req.body.password
  }

  userService.loginForAdmin(message, function (err, response) {
    if (err) {
      res.json({ resultCode: -1 });
    } else {
      cache.set("token", response.token)
      res.json({ resultCode: 0 });
      // res.redirect("/");
    }
  })
})

app.post('/logout', function(req, response) {
  var message = {};

  userService.logout(message, function(req, res) {
    cache.set("token", "");
    response.redirect("/login");
  })
})