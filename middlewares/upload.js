let multer = require('multer');

let storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!file.mimetype) return cb(new Error('Invalid file'), false);

  let ok = file.mimetype.indexOf('image/') === 0;
  if (!ok) return cb(new Error('Only image files are allowed'), false);

  cb(null, true);
}

let upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
