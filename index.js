require('dotenv').config();
const { encrypt, decrypt } = require('./cryptor/crypt');
const multer = require('./upload/multer');
const Workflow = require('./upload/workflow');
const express = require('express');
const app = express();

const { access_key, secret_key, region, bucket, bucket_endpoint } = process.env;
const s3api = require('./s3/s3Api');

app.use(async(req, res, next) => {
    next();
});

app.post('/upload', multer.single('file'), async(req, res, next) => {
    try {
        const workflow = new Workflow(req.file, { 'thumbnailResize': 250, 'cdnDomain': 'https://cdn.streamsave.xyz', 'processDomain': 'http://' + req.header('host') });
        const job = await workflow.router();
        return res.send(job);
    } catch(err){
        console.log(err)
        return res.sendStatus(400);
    }
});

app.get('/deletion/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const decodedBase64 = Buffer.from(id, 'base64').toString('utf-8')
        const decryptedId = decrypt(JSON.parse(decodedBase64));

        if(!req.query.confirm){
            return res.send(`<a href="/deletion/${id}?confirm=true">Please confirm the deletion of ${decryptedId}</a>`);
        }

        const s3 = new s3api(access_key, secret_key, region, bucket_endpoint, bucket);
        const deletion = await s3.delete(decryptedId, bucket);
        res.send(deletion)

    } catch(err){
        console.log(err)
        return res.sendStatus(400);
    }
});

app.listen(80, () => { console.log("Express started") })