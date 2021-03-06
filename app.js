const uuidv4 = require("uuid/v4");
const path = require("path");
const express = require("express");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

const cors = require("cors");

const bp = require("body-parser");
app.use(cors());
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());
app.use(require("morgan")("dev"));
var WebTorrent = require("webtorrent");
var client = new WebTorrent();
app.set("view engine", "ejs");

app.use(express.static("./views/pages"));

var api = "";

console.log(process.env.NODE_ENV);

if ((process.env.NODE_ENV = "production")) {
  api = "/remotetorrent";
}

app.get("/remotetorrent", (req, res) => {
  // make in prod /remotetorrent
  res.render("pages/share", {
    size: `11`,
    title: `11`,
    username: `11`,
    resurl: `11`
  });
});

app.post("/remotetorrent/download", (req, res) => {
  // make in prod /remotetorrent
  console.log(req.body);
  //   res.json(req.body);

  //NODE_ENV=production node app.js

  var downloadPath = path.resolve(__dirname, "./torrentfiles");

  if ((process.env.NODE_ENV = "production")) {
    downloadPath =
      "/home/batman/remotetorrentclient/remotetorrent/torrentfiles";
  }

  try {
    client.add(req.body.urltodown, { path: downloadPath }, function(torrent) {
      // Torrents can contain many files. Let's use the .mp4 file
      console.log("adding client");
      var sesisonid = uuidv4();

      var file = torrent.files;
      console.log(file[0].name);

      var fileInfoarr = [];

      torrent.files.forEach(element => {
        var temp = {
          name: element.name,
          size: element.length / 1024 / 1024
        };
        fileInfoarr.push(temp);
      });

      res.json({ fileInfo: fileInfoarr, uuid: sesisonid });

      torrent.on("error", err => {
        console.log("torrent error");
        console.log(err);
        io.emit("torrenterror" + sesisonid, { error: err });
      });

      torrent.on("download", function(bytes) {
        //   console.log("peers : " + torrent.numPeers);
        //   console.log("total downloaded: " + torrent.downloaded);
        //   console.log(
        //     "download speed: " + torrent.downloadSpeed / 1024 / 1024 + " mb "
        //   );
        console.log("progress: " + torrent.progress);

        io.emit("downloadprogress" + sesisonid, {
          downloadSpeed: torrent.downloadSpeed / 1024 / 1024 + " mb ",
          progress: torrent.progress
        });

        //downloadprogress
      });

      torrent.on("done", function() {
        console.log("torrent finished downloading");

        var paths = [];

        torrent.files.forEach(function(file) {
          console.log(file.path);
          paths.push({
            filepath: "http://54.197.16.19/static/" + file.path,
            name: file.name
          });
          // do something with file
        });

        io.emit("downloaded" + sesisonid, { path: paths });
      });

      torrent.on("noPeers", function(announceType) {
        console.log("no " + announceType);
      });

      // setInterval(() => {
      //   // console.log(" progress - " + torrent.progress);
      // }, 1000);
    });

    client.on("error", function(err) {
      console.log(err.message);
      res.json({ error: err.message });
      console.log("errrorrorrororororor1111");
    });
  } catch (error) {
    console.log("errrorrorrororororor");
  }
});

io.on("connection", function(socket) {
  console.log("User connected ");
});

http.listen(3000, () => {
  console.log("listning on " + 3000);
});
