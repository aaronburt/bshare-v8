require('dotenv').config();
const { access_key, secret_key, region, bucket, bucket_endpoint } = process.env;
const s3api = require('../s3/s3Api');
const sharp = require('sharp');
const path = require('path');

class Process {

    constructor(file, config = { "thumbnailResize": 200, "cdnDomain": "http://localhost" }){        
        this.file = file;
        this.config = config;
    }

    async router(){
        switch(this.file.mimetype){
            case "image/jpg":
            case "image/png":
            case "image/jpeg":
            case "image/webp":
                return await this.uploadImage();
            default:
                return await this.defaultUpload();
        }
    }

    async defaultUpload(){
        const s3 = new s3api(access_key, secret_key, region, bucket_endpoint, bucket);
        const uploadTimeStamp = (await this.generateUnixTimeStamp()).toString();
        const upload = await s3.upload(
            `${uploadTimeStamp}/${this.file.originalname}`, this.file.buffer, bucket, { "ContentType": this.file.mimetype }
        );

        return { "Location": `${this.config.cdnDomain}/${upload.Key}` };
    }

    async generateImageThumbnail(buffer, resize, quality = 95){
        try {
            return sharp(buffer)
                .resize(resize)
                .webp({ "quality": quality })
                .toBuffer({ "resolveWithObject": true });

        } catch(err){
            console.log(err);
            return false;
        }
    }

    async convertToWebp(buffer, quality){
        try {
            return sharp(buffer)
                .webp({ "quality": quality })
                .toBuffer({ "resolveWithObject": true });

        } catch(err){
            console.log(err);
            return false;
        }
    }

    async generateUnixTimeStamp(){
        return Math.round(Date.now() / 1000);
    }

    async uploadImage(){
        try {

            const uploadTimeStamp = (await this.generateUnixTimeStamp()).toString();
            const s3 = new s3api(access_key, secret_key, region, bucket_endpoint, bucket);

            const convertedWebp = await this.convertToWebp(this.file.buffer, 95);

            const imageUpload = await s3.upload(
                `${uploadTimeStamp}/${path.parse(this.file.originalname).name}.${convertedWebp.info.format}`, 
                convertedWebp.data, 
                bucket, 
                { "ContentType": this.file.mimetype }
            );

            const generatedThumbnail = await this.generateImageThumbnail(this.file.buffer, this.config.thumbnailResize, 70);

            const thumbnailUpload = await s3.upload(
                `${uploadTimeStamp}/${path.parse(this.file.originalname).name}_thumbnail.${generatedThumbnail.info.format}`, 
                generatedThumbnail.data, 
                bucket, 
                { "ContentType": 'image/webp' }
            );

            return { 
                "Location": `${this.config.cdnDomain}/${imageUpload.Key}`, 
                "Thumbnail": `${this.config.cdnDomain}/${thumbnailUpload.Key}` 
            };

        } catch(err){
            console.log(err);
            return false;
        }
    }
}

module.exports = Process;