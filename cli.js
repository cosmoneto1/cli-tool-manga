#!/usr/bin/env node
import enquirer from 'enquirer';
import jetpack from 'fs-jetpack';
import chalk from 'chalk';
import path from 'path';
import axios from 'axios';
const { Input } = enquirer;
const log = console.log;
let dirManga;

axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0';

const promptInput = new Input({
  message: 'Digite a url do mangá para fazer o download?',
  initial: 'https://muitomanga.com/ler/one-piece/capitulo-1058',
});

promptInput
  .run()
  .then((url) => {
    dirManga = path.basename(url);
    jetpack.dir(`manga/${dirManga}`);
    getUrl(url);
  })
  .catch(console.error);

const getUrl = async (url) => {
  try {
    log(chalk.blueBright('\n Consultando a url do mangá...'));
    const { data, status } = await axios.get(url);

    if (status == 200) {
      log(chalk.white('\n Verificando lista de páginas do mangá...'));
      const list = clearStringToArray(data);
      downloadImages(list);
    }
  } catch (error) {
    log(error);
  }
};

const clearStringToArray = (html) => {
  let scriptArray = html.match(/(var imagens_cap = \[(.*?)\];)/g)[0];
  scriptArray = scriptArray.replace(/(var imagens_cap = \[|\];|"|\\)/g, '');
  return scriptArray.split(',');
};

const downloadImages = async (listUrls) => {
  let count = 0;

  for await (let url of listUrls) {
    log(chalk.yellow(`>> ${url}`));
    const { data } = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    });
    data.pipe(jetpack.createWriteStream(`./manga/${dirManga}/${count}.jpg`));
    count++;
  }

  log(chalk.green(`\n Legal, bora ler o mangá... => cd manga/${dirManga}/ \n`));
};
