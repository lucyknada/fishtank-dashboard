const express = require('express');
const app = express();
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Jimp } = require("jimp");
const Motion = require('motion-detect').Motion;
const decode = require('im-decode');
app.use(cors());

const streams = [
    "https://myvip.global.ssl.fastly.net/9b249j7qlqu0fypg/index.m3u8",
    "https://myvip.global.ssl.fastly.net/d678xcnkn2slngkx/index.m3u8",
    "https://myvip.global.ssl.fastly.net/8e1arf44e86qa7ru/index.m3u8",
    "https://myvip.global.ssl.fastly.net/9f41r40060icglir/index.m3u8",
    "https://myvip.global.ssl.fastly.net/7d3e7e9s5qm5l1uf/index.m3u8",
    "https://myvip.global.ssl.fastly.net/b4e4iknxyd1u4g0c/index.m3u8",
    "https://myvip.global.ssl.fastly.net/8ac015orral0pm4c/index.m3u8",
    "https://myvip.global.ssl.fastly.net/b51399w8tr5qa0v1/index.m3u8",
    "https://myvip.global.ssl.fastly.net/580elsslerqmt28u/index.m3u8",
    "https://myvip.global.ssl.fastly.net/84485q0ve58ckwm2/index.m3u8",
    "https://myvip.global.ssl.fastly.net/8c8btla37r6nux8f/index.m3u8",
    "https://myvip.global.ssl.fastly.net/d578z2acldqyww5x/index.m3u8",
    "https://myvip.global.ssl.fastly.net/afacw5eipuyfsfny/index.m3u8",
    "https://myvip.global.ssl.fastly.net/3760543f053u6c5m/index.m3u8",
    "https://myvip.global.ssl.fastly.net/b65269ekvyvfkous/index.m3u8",
    "https://myvip.global.ssl.fastly.net/36708jd80gr91018/index.m3u8",
    "https://myvip.global.ssl.fastly.net/44daqjc6r1dfxd2e/index.m3u8",
    "https://myvip.global.ssl.fastly.net/68f8q4hl8cys37n2/index.m3u8",
    "https://myvip.global.ssl.fastly.net/0c0bun9tebd65k3j/index.m3u8",
    "https://myvip.global.ssl.fastly.net/9d5ckl8snb01ba6i/index.m3u8",
    "https://myvip.global.ssl.fastly.net/122bkgvyrj1f7pk4/index.m3u8",
    "https://myvip.global.ssl.fastly.net/f77b5hz939s8z89b/index.m3u8",
    "https://myvip.global.ssl.fastly.net/4fb8to1674q6ht0m/index.m3u8",
    "https://myvip.global.ssl.fastly.net/21aflvcz5puavd2e/index.m3u8"
];

app.get('/room/:number', async (req, res) => {
  const { number } = req.params;

  if (!Number.isInteger(parseInt(number))) {
    return res.status(400).send({ error: 'The requested number is not a number.' });
  }

  const outputPath = path.resolve(`./thumbnails/thumbnail-${number}.png`);
  const tempOutputPath = path.resolve(`./thumbnails/thumbnail-${number}-temp.png`);

  ffmpeg(streams[number])
    .screenshots({
      timestamps: [1], // Capture a thumbnail at 1 second into the video
      filename: `./thumbnails/thumbnail-${number}-temp.png`, // Generate a unique filename
      size: "240x128"
    })
    .on('end', async () => {
      if (fs.existsSync(outputPath)) {
        const motion = new Motion();
        const decoded_input = await new Promise((resolve) => {
          decode(fs.readFileSync(outputPath), function (err, rgbaArray) {
            resolve(rgbaArray)
          });
        })
        const decoded_temp = await new Promise((resolve) => {
          decode(fs.readFileSync(tempOutputPath), function (err, rgbaArray) {
            resolve(rgbaArray)
          });
        })

        const motion_detected = motion.detect(decoded_input, decoded_temp);
        if (!motion_detected) {
          try {
            const image = await Jimp.read(tempOutputPath);
            fs.renameSync(tempOutputPath, outputPath);
            await image.greyscale().brightness(0.2).write(tempOutputPath);
          } catch (err) {
            console.log(err)
          }
        }
      } else {
        fs.renameSync(tempOutputPath, outputPath);
        res.sendFile(outputPath, (err) => { });
        return
      }

      res.sendFile(tempOutputPath, (err) => { });
    })
    .on('error', (err) => {
      console.error('Error generating thumbnail:', err);
      res.status(500).send({ error: 'Error generating the thumbnail image.' });
    });
});

app.get('/cctv', function (req, res) {
  res.sendFile(__dirname + '/cctv.html');
});

app.get('/streams', (req, res) => {
  res.end(JSON.stringify(streams));
});

const port = 4444;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
