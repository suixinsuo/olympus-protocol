/**
 * This file makes and automatic conversion from the documentation in md to an html file
 * which is save in docs/build folder.
 *
 * We use cloudConvert API, which is pay service with some free minutes. In order to optimize
 * we first select a key with enough minutes available, then we check which files need to update,
 * calling finally the API.
 *
 */

const fs = require("fs");
const cloudConfig = require('../conf/cloud_converter');
const server = require('../libs/server');
const Promise = require("bluebird");
const path = require('path');
const crypto = require('crypto');

const MIN_TIME = 8 // Minimum free minutes of conversion that account needs to execute the script
const folders = ["", "B2B/", "B2C/"];

const selectAPIKey = async () => {
  const keysTimes = await Promise.all(cloudConfig.api_keys.map(async (key) => {
    try {
      const json = await server.get(cloudConfig.user_api, null, `Bearer ${key}`);
      return json.minutes | 0;
    } catch (e) {
      console.error(`Cant get the information of the key ${key} `, e);
      return 0;
    }
  }));

  const index = keysTimes.findIndex((time) => time > MIN_TIME);
  if (index < 0) { throw new Error('We run out of free minutes for html conversion') };

  return cloudConfig.api_keys[index];
}


const parseMarkdown = async (key) => {

  // Make sure folder structure exists
  folders.forEach((folder) => {
    if (!fs.existsSync(`./docs/build/${folder}`)) { fs.mkdirSync(`./docs/build/${folder}`) };
    if (!fs.existsSync(`./docs/latest/${folder}`)) { fs.mkdirSync(`./docs/latest/${folder}`) };
  })


  let counter = 0; // Of conversion

  for (const folder of folders) {
    const files = filterFiles(folder, fs.readdirSync(`./docs/${folder}`));

    for (const file of files) {
      const success = await convertFile(key, folder, file.slice(0, -3));
      if (success) { counter++; }
    }


  };
  return counter;
}

const filterFiles = (folder, files) => {

  return files.filter((file) => {
    if (path.extname(file) !== '.md') { return false; }

    const name = file.slice(0, -3); // remove extension
    const latestPath = `./docs/latest/${folder}${name}.md`;
    const originPath = `./docs/${folder}${name}.md`;

    // Not exists
    if (!fs.existsSync(latestPath)) {
      fs.copyFileSync(originPath, latestPath);
      return true;
    }
    // Compare the hashes to find if there is any difference
    const originHash = crypto.createHash('md5').update(fs.readFileSync(originPath)).digest('hex');
    const latestHash = crypto.createHash('md5').update(fs.readFileSync(latestPath)).digest('hex');
    fs.copyFileSync(originPath, latestPath); // Updated the latest
    return originHash !== latestHash; // The original has changed
  });


};

const convertFile = async (key, folder, name) => {
  const cloudconvert = new (require('cloudconvert'))(key);
  console.log('Converting File', folder, name);

  return new Promise((resolve, _reject) => fs.createReadStream(`./docs/${folder}${name}.md`)
    .pipe(cloudconvert.convert({
      inputformat: "md",
      outputformat: "html",
      input: "upload"
    }))
    .pipe(fs.createWriteStream(`./docs/build/${folder}${name}.html`, { flags: 'w' }))
    .on('finish', function (error) {
      console.log('Finished', folder, name);
      resolve(true);
    })
    .on('error', function (error) {
      handleError(`Error while converting ${folder}${name}`, error)
      resolve(false);
    }));
}

const handleError = (stage, err) => {

  switch (err.code) {
    case 400:
      console.error(stage, 'Something with your request is wrong: ' + err);
      break;
    case 422:
      console.error(stage, 'Conversion failed, maybe because of a broken input file: ' + err);
      break;
    case 503:
      console.error(stage, 'API temporary unavailable: ' + err);
      console.error(stage, 'We should retry the conversion in ' + err.retryAfter + ' seconds');
      break;
    default:
      // network problems, etc..
      console.error(stage, 'Something else went wrong: ' + err);
      break;
  }
}


// RUN
const run = async () => {
  try {
    const api_key = await selectAPIKey();
    console.log(`Using KEY  ${api_key} for conversion`);

    const counter = await parseMarkdown(api_key);
    console.log(`Conversion finished with ${counter} documents converted`);

  } catch (e) {
    console.error('Error on conversion:', e);
    process.exit(-1);
  };
}


run();
