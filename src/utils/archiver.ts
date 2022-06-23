/* eslint-disable @typescript-eslint/no-floating-promises */
import fs from 'fs';
import Archiver from 'archiver'; // https://www.archiverjs.com/docs/quickstart
import { logger } from '.';

const staging_directory = ``;
/*
    export start-block-to-end-block-btc_blocks_transactions-index-split.zip
*/
export const export_data_from_mongo = () => {
  return true;
};

export const archive_file = () => {
  return true;
};
export const split_archive_file = () => {
  return true;
};
export const unarchive_file = () => {
  return true;
};

async () => {
  const files_to_zip = [`file1.txt`, `file2.txt`];

  const timestamp = Date.now();
  const datatype = ['blocks', 'transactions', 'blocks-transactions', 'market-data', 'other'];
  const version = ['update', 'monthly-update', 'pre-processed'];
  const archive_filename = `${timestamp}-${datatype[0]}-${version}.zip`;

  const output = fs.createWriteStream(`./${archive_filename}`);
  const archive = Archiver('zip', {
    gzip: true,
    zlib: { level: 9 }, // Sets the compression level.
  });

  archive.on('error', function (err: any) {
    logger.error(err);
    throw err;
  });

  // pipe archive data to the output file
  archive.pipe(output);

  /*

    // See documentation https://www.archiverjs.com/docs/quickstart for splitting files on 4GB
    archive.file('/path/to/file0.txt', { name: 'file0-or-change-this-whatever.txt' });
    archive.file('/path/to/README.md', { name: 'foobar.md' });
    
    */

  archive.finalize();
};
