const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const formidable = require('formidable');

let id = 1;
let uploadedFiles = [];
let lastViewedFile = {
  id: '',
  name: '',
  path: '',
  size: 0,
  type: '',
  savedate: 0,
  icon: '/icons/file.png',
};

const typeToIconNameMap = {
  'image/jpeg': 'jpg.png',
  'image/png': 'png.png',
  'text/plain': 'txt.png',
  'text/html': 'html.png',
  default: 'file.png',
};

function getIconName(type) {
  return typeToIconNameMap[type] || typeToIconNameMap.default;
}

//#region AppInit
const app = express();
app.use(express.static('static'));
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));
app.engine(
  'hbs',
  hbs({
    defaultLayout: 'main.hbs',
    partialsDir: 'views/partials',
    extname: '.hbs',
    helpers: {
      ifEquals(arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      },
    },
  })
);
app.set('view engine', 'hbs');

app.get(['/', '/filemanager'], (req, res, next) => {
  const context = { files: uploadedFiles };
  res.render('filemanager', context);
});

app.get(['/info', '/info/:fileId'], (req, res, next) => {
  let file = uploadedFiles.find((file) => file.id == req.params.fileId);
  if (file) {
    lastViewedFile = file;
  } else {
    file = lastViewedFile;
  }
  const context = { fileInfo: file };
  res.render('info', context);
});

app.get('/upload', (req, res, next) => {
  const context = {};
  res.render('upload', context);
});

app.post('/upload', (req, res, next) => {
  let form = formidable({});
  form.keepExtensions = true;
  form.multiples = true;

  form.uploadDir = __dirname + '/static/uploaded/';
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

  form.parse(req, function (err, _, data) {
    if (err) {
      console.log('ERRROR fd', err);
      return res.sendStatus(403);
    }
    console.log('----- przesłane formularzem pliki ------');

    let files = data.files;
    if (Array.isArray(files) === false) {
      files = [files];
    }
    console.log(JSON.stringify(files));
    files = files.map((file) => ({
      id: id++,
      name: file.name,
      path: file.path,
      size: file.size,
      type: file.type,
      savedate: Date.now().valueOf(),
      icon: `/icons/${getIconName(file.type)}`,
    }));
    uploadedFiles = [...uploadedFiles, ...files];

    res.redirect('/filemanager');
  });
});

app.get('/delete-file/:fileId', (req, res, next) => {
  uploadedFiles = uploadedFiles.filter((file) => file.id != req.params.fileId);
  res.redirect('/filemanager');
});

app.get('/reset', (req, res, next) => {
  uploadedFiles = [];
  res.redirect('/filemanager');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
