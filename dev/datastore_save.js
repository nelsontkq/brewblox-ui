const axios = require('axios');
const { host, databases, fileDir, retry } = require('./utils');
const fs = require('fs');

const datastore = `${host}/datastore`;

async function run() {
  await retry('Waiting for datastore', () => axios.get(datastore));

  for (let db of databases) {
    const resp = await axios.get(`${datastore}/${db}/_all_docs`, {
      params: {
        'include_docs': true,
      },
    });
    const docs = resp.data.rows
      .map(row => row.doc)
      .map(doc => {
        const { _rev, ...persistent } = doc;
        void _rev;
        return persistent;
      });
    const fname = `${fileDir}/${db}.datastore.json`;
    fs.writeFileSync(fname, JSON.stringify(docs, undefined, 2));
    console.log('Database saved', fname);
  }
}

run()
  .then(() => console.log('Script done!', __filename))
  .catch(e => console.log(e));
