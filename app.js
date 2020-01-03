const uuidv4 = require("uuid/v4");

const express = require("express");

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

app.get("/remotetorrent", (req, res) => {
  res.render("pages/share", {
    size: `11`,
    title: `11`,
    username: `11`,
    resurl: `11`
  });
});

app.post("/remotetorrent/download", (req, res) => {
  console.log(req.body);
  //   res.json(req.body);

  client.add(req.body.urltodown, { path: "./torrentfiles" }, function(torrent) {
    // Torrents can contain many files. Let's use the .mp4 file

    var sesisonid = uuidv4();

    var file = torrent.files;
    console.log(file[0].name);
    res.json({ name: torrent.files[0].name, uuid: sesisonid });
    torrent.on("error", err => {
      console.log(err);
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
        paths.push({ filepath: file.path, name: file.name });
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
});

io.on("connection", function(socket) {
  console.log("User connected ");
});

http.listen(3000, () => {
  console.log("listning on " + 3000);
});
