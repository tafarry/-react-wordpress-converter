#!/usr/bin/env node

//import Config from "./config";

console.log("Hello World");

const inquirer = require('inquirer');
const fs = require('fs-extra');
const replace = require('replace-in-file');

let Config = require('./config');
Config = Config.Config;

let folderName = Config.name;//'folderName';
let pathToReactBuild = Config.reactPath;
let jsFilesArray = [1,2,3];

main();

async function main(){
  await createThemeFolder();
  console.log("copying react files ...");
  await copyReactFiles();
  console.log("creating wordpress files ...");
  await createWordpressFiles();
  console.log("configuring react files ...");
  await editReactFiles();

  await themeBasicInfo();
  console.log();
  console.log("REMINDER!!:");
  console.log("edit style.css with accurate Information.");
  console.log("add a screenshot.png file.");
  console.log("add theme update information.");
}

async function createThemeFolder(){
  /*var questions = [{
    type: 'input',
    name: 'folderName',
    message: "Enter a name for the theme folder?",
  }]

  answers = await inquirer.prompt(questions);
  if(answers['folderName']) {
    folderName2 = answers['folderName'];
    folderName2 = folderName2.replace(/\s/g, '');
    if(folderName2) folderName = folderName2;
  }*/
  const dir = './'+folderName;

  if (fs.existsSync(dir)){
    fs.removeSync(dir);
  }
  fs.mkdirSync(dir);

  console.log(`Hi ${folderName}!`);
}

async function themeBasicInfo(){
  console.log('creating style.css ......');
  const info = `/*
      Theme Name: ${folderName}
      Theme URI: ${Config.themeUri}
      Author: ${Config.author}
      Author URI: ${Config.authorUri}
      Description: ${Config.description}
      Text Domain:
      Version: ${Config.version}
      License:
      */`;

  fs.writeFileSync('./'+folderName+'/style.css', info);
  console.log('completed.');
}

function copyReactFiles(){
  fs.copySync(pathToReactBuild, './'+folderName+'/includes/');
  fs.copySync('./'+folderName+'/includes/index.html', './'+folderName+'/index.php');
  fs.copySync('./'+folderName+'/includes/index.html', './'+folderName+'/header.php');
  fs.copySync('./'+folderName+'/includes/index.html', './'+folderName+'/footer.php');
}

async function createWordpressFiles(){
  await createWordpressIndexFile();
  await createWordpressHeaderFile();
  await createWordpressFooterFile();
  await createWordpressFunctionsFile();

  /*fs.appendFile(folderName+'/index.php', 'Hello content!', function (err) {
    if (err) console.error(err);
    console.log('index.php created.');
  });*/
}
  async function createWordpressIndexFile(){
  console.log('creating index.php ......');
  const str1 = '\<(.*?)\<body>';
  const regex1 = new RegExp(str1, 'i');
  const str2 = '\<script(.*?)\</html>';
  const regex2 = new RegExp(str2, 'i');
  const options = {
    files: './'+folderName+'/index.php',
    from: [regex1,regex2],
    to: ['<?php get_header(); ?>',' <?php get_footer(); ?>'],
  };
  try {
    const results = await replace(options)
    console.log('Replacement results:', results);
  }
  catch (error) {
    console.error('Error occurred:', error);
  }
  console.log('completed.');
}
  async function createWordpressHeaderFile(){
  console.log('creating header.php ......');
  const str1 = '\<body>(.*?)\</html>';
  const regex1 = new RegExp(str1, 'i');
  const str2 = /href="/g;
  const regex2 = new RegExp(str2, 'i');
  const options = {
    files: './'+folderName+'/header.php',
    from: [regex1,str2],
    to: ['<body>','href="<?php bloginfo(\'template_url\'); ?>/includes'],
  };
  try {
    const results = await replace(options)
    console.log('Replacement results:', results);
  }
  catch (error) {
    console.error('Error occurred:', error);
  }
  console.log('completed.');
}
  async function createWordpressFooterFile(){
  console.log('creating footer.php ......');
  const str1 = '\<(.*?)\</body>';
  const regex1 = new RegExp(str1, 'i');
  const options = {
    files: './'+folderName+'/footer.php',
    from: regex1,
    to: '<?php wp_footer(); ?> </body>',
  };
  try {
    const results = await replace(options)
    console.log('Replacement results:', results);
  }
  catch (error) {
    console.error('Error occurred:', error);
  }
  console.log('completed.');
}
  async function createWordpressFunctionsFile(){
    console.log('coping updater code ......');
    fs.copySync('./plugin-update-checker', './'+folderName+'/plugin-update-checker/');
    console.log('copy complete.');
    console.log('creating functions.php ......');

  const folder = './'+folderName+'/includes/static/js/';
  let files = fs.readdirSync(folder);
  files.forEach(file => {
    let name = file.split(".");
    if(name[ (name.length-1) ] != "js" ) return;
    if( name.includes("runtime~app") ) {jsFilesArray[0] = file;return;}
    if( name.includes("app") ) {jsFilesArray[2] = file;return;}
    if( name.includes("chunk") ) {jsFilesArray[1] = file;return;}
  });

  let fileData = `<?php
    function react_js_scripts() {
      wp_enqueue_script( 'react_runtime', get_template_directory_uri() . '/includes/static/js/`+jsFilesArray[0]+`');
      wp_enqueue_script( 'react_chunk', get_template_directory_uri() . '/includes/static/js/`+jsFilesArray[1]+`');
      wp_enqueue_script( 'react_app', get_template_directory_uri() . '/includes/static/js/`+jsFilesArray[2]+`');
    }
    add_action( 'wp_footer', 'react_js_scripts' );
  `;

  if(Config.includeUpdater) {
    fileData += `
        require 'plugin-update-checker/plugin-update-checker.php';
    $myUpdateChecker = Puc_v4_Factory::buildUpdateChecker(
      '`+Config.gitLabRepoUrl+`',
      __FILE__,
      '`+Config.name+`'
    );
    $myUpdateChecker->setAuthentication('`+Config.updaterKey+`');
    $myUpdateChecker->setBranch('`+Config.gitLabBranchToWatch+`');
    `;
  }

  fs.writeFileSync('./'+folderName+'/functions.php', fileData);
  console.log('completed.');
}

async function editReactFiles(){
  await editChunkjsFile();
  await editChunkAppjsFile();
  await editServiceWorkerFile();
  await editPrecacheFile();
  await editManifestFile();
  await editAssestsManifestFile();
}
  async function editChunkjsFile(){
    console.log('configuring chunk1 ......');

    const files = './'+folderName+'/includes/static/js/'+jsFilesArray[1];
    const str1 = /\/fonts\//g;
    const regex1 = new RegExp(str1, 'i');
    const replace1 = '/wp-content/themes/'+folderName+'/includes/fonts/';
    const options = {
      files: files,
      from: str1,
      to: replace1,
    };
    try {
      const results = await replace(options)
      console.log('Replacement results:', results);
    }
    catch (error) {
      console.error('Error occurred:', error);
    }

    console.log('completed.')
  }
  async function editChunkAppjsFile(){
    console.log('configuring chunk2 (with app) ......');

    const files = './'+folderName+'/includes/static/js/'+jsFilesArray[2];
    const str1 = /static\/media\//g;
    const regex1 = new RegExp(str1, 'i');
    const replace1 = './wp-content/themes/'+folderName+'/includes/static/media/';

    const str2 = /expo-service-worker/g;
    const regex2 = new RegExp(str2, 'i');
    const replace2 = '/wp-content/themes/'+folderName+'/includes/expo-service-worker';

    const str3 = /scope:"/g;
    const regex3 = new RegExp(str3, 'i');
    const replace3 = 'scope:"/wp-content/themes/'+folderName+'/includes';

    const options = {
      files: files,
      from: [str1,str2,str3],
      to: [replace1,replace2,replace3],
    };
    try {
      const results = await replace(options)
      console.log('Replacement results:', results);
    }
    catch (error) {
      console.error('Error occurred:', error);
    }

    console.log('completed.')
  }
  async function editServiceWorkerFile(){
    console.log('configuring service-worker ......');

    const files = './'+folderName+'/includes/service-worker.js';
    const str1 = /precache-manifest/g;
    const regex1 = new RegExp(str1, 'i');
    const replace1 = 'wp-content/themes/'+folderName+'/includes/precache-manifest';
    const options = {
      files: files,
      from: str1,
      to: replace1,
    };
    try {
      const results = await replace(options)
      console.log('Replacement results:', results);
    }
    catch (error) {
      console.error('Error occurred:', error);
    }

    console.log('completed.')
  }
  async function editPrecacheFile(){
    console.log('configuring precache- ......');

    const files = './'+folderName+'/includes/precache-manifest.*.js';
    const str1 = /": "\//g;
    const regex1 = new RegExp(str1, 'i');
    const replace1 = '": "/wp-content/themes/'+folderName+'/includes/';
    const options = {
      files: files,
      from: str1,
      to: replace1,
    };
    try {
      const results = await replace(options)
      console.log('Replacement results:', results);
    }
    catch (error) {
      console.error('Error occurred:', error);
    }

    console.log('completed.')
  }
  async function editManifestFile(){
    console.log('configuring manifest.json ......');

    const files = './'+folderName+'/includes/manifest.json';
    const str1 = /": "\//g;
    const regex1 = new RegExp(str1, 'i');
    const replace1 = '": "/wp-content/themes/'+folderName+'/includes/';
    const options = {
      files: files,
      from: str1,
      to: replace1,
    };
    try {
      const results = await replace(options)
      console.log('Replacement results:', results);
    }
    catch (error) {
      console.error('Error occurred:', error);
    }

    console.log('completed.')
  }
  async function editAssestsManifestFile(){
    console.log('configuring assets-manifest ......');

    const files = './'+folderName+'/includes/asset-manifest.json';
    const str1 = /": "\//g;
    const regex1 = new RegExp(str1, 'i');
    const replace1 = '": "/wp-content/themes/'+folderName+'/includes/';
    const options = {
      files: files,
      from: str1,
      to: replace1,
    };
    try {
      const results = await replace(options)
      console.log('Replacement results:', results);
    }
    catch (error) {
      console.error('Error occurred:', error);
    }

    console.log('completed.')
  }
