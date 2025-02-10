// server.js
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu trữ file
  },
  filename: (req, file, cb) => {
    // Đặt tên file với định dạng <originalname>-<timestamp>.webm
    const timestamp = Date.now();
    const ext = '.webm';
    cb(null, `${path.parse(file.originalname).name}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 1000 * 1024 * 1024 } }); // Giới hạn kích thước });

app.use(express.static('public'));
app.use('/hls', express.static('hls'));
// Giới hạn kích thước băng thông cho body parser
app.use(express.json({ limit: '1055mb' })); // Giới hạn kích thước payload là 5MB
app.use(express.urlencoded({ limit: '1055mb', extended: true }));

// Endpoint để nhận video và khởi động stream
app.post('/upload', (req, res) => {
  const inputFilePath = path.join(__dirname, './uploads/one-piece.webm');

  exec(
    `ffmpeg -i ${inputFilePath} -c:v libx264 -c:a aac -strict experimental -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename hls/segment_%03d.ts hls/output.m3u8`,
    // ffmpeg -i ${inputFilePath} -c:v libx264 -c:a aac -strict experimental -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename "video/segment_%03d.ts" "video/output.m3u8"
    (error, stdout, stderr) => {
      // let output = fs.readFileSync('hls/output.m3u8').toString();

      // output = output.replace('#EXT-X-ENDLIST\n', '');

      // fs.writeFileSync('hls/output.m3u8', output);

      // Xoá tệp đã tải lên
      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).send('Error processing video');
      }

      res.send('Video uploaded and streaming started');
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
