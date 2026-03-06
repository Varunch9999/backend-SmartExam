const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UP_DIR = path.join(__dirname,'..','uploads');
if(!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UP_DIR); },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname.replace(/\s+/g,'_'));
  }
});
const upload = multer({ storage });

router.post('/', upload.single('file'), (req,res)=>{
  if(!req.file) return res.status(400).json({ error: 'No file' });
  const rel = '/uploads/' + req.file.filename;
  res.json({ url: rel, path: req.file.path });
});

module.exports = router;
