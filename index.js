const multer = require('./upload/multer');
const process = require('./upload/process');
const express = require('express');
const app = express();

app.use(async(req, res, next) => {
    next();
});

app.post('/upload', multer.single('file'), async(req, res, next) => {
    try {
        console.log(req.file)
        const workflow = new process(req.file, { 'thumbnailResize': 250, 'cdnDomain': 'https://cdn.streamsave.xyz' });
        const job = await workflow.router();
        return res.send(job);
    } catch(err){
        return res.sendStatus(400);
    }
});

app.get('/deletion', async(req, res) => {
    //
});

app.listen(80, () => { console.log("Express started") })