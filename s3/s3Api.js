const AWS = require('aws-sdk');

class s3 {
    constructor(accessKeyId, secretAccessKey, region, endpoint, bucket){
        this.config = {
            "bucket": bucket, 
            "endpoint": endpoint,
            "connection": new AWS.S3({ 'accessKeyId': accessKeyId, 'secretAccessKey': secretAccessKey, 'endpoint': endpoint, 'region': region })
        }
    }

    async listObjects(){
        try {
            return await this.config.connection.listObjects({ "Bucket": this.config.bucket }).promise();
        } catch(err){
            return err;
        }
    }

    async getSignedUrl(key, expire){
        try {
            return await this.config.connection.getSignedUrlPromise('getObject', { "Bucket": this.config.bucket, "Key": key, "Expires": expire })
        } catch(err){
            return err;
        }
    }

    async exists(key){
        try {
            return await this.config.connection.headObject({ "Bucket": this.config.bucket, "Key": key }).promise();
        } catch(err){
            return false;
        }
    }

    async upload(fileName, fileBuffer, bucket = this.config.bucket, optional = {}){
        try {
            const uploadParams = { Bucket: bucket, Key: fileName, Body: fileBuffer, ...optional }
            return await this.config.connection.upload(uploadParams).promise();
        } catch(err){
            console.log(err)
            return false;
        }
    }

    async delete(key, bucket = this.config.bucket){
        try { 
            return await this.config.connection.deleteObject({ "Bucket": bucket, "Key": key }).promise()
        } catch(err){
            return false;
        }
    }
}

module.exports = s3;