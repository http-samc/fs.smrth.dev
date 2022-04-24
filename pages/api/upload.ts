import type { NextApiRequest, NextApiResponse } from 'next'
import nextConnect from "next-connect";
// @ts-ignore
import fileUpload from "express-fileupload";
import AWS from "aws-sdk";
import fsAuth, { FSRequest } from '../../utils/fs-auth';

interface UploadRequest extends FSRequest {
    files: {
        file: {
            name: string;
            data: Buffer;
        }
    },
    visibility: 'private' | 'public' | 'global',
    path: string,
}

const handler = nextConnect({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
        console.error(err.stack);
        res.status(500).end("Sorry, something broke!");
    },
    onNoMatch: (req, res) => {
        res.status(404).end("Page not found");
    },
})
    .use(fileUpload())
    .use(fsAuth)
    .post(async (req: UploadRequest, res: NextApiResponse) => {

        if (!req.hasValidAuthorization) {
            res.status(401).end("Unauthorized");
            return;
        }

        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        })


        const s3 = new AWS.S3();

        // Binary data base64
        // @ts-ignore
        const fileContent = Buffer.from(req.files.file.data, 'binary');

        // Setting up S3 upload parameters
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${req.authorizedUser}/${req.body.visibility}/${req.body.path ? req.body.path + '/' : ''}${req.files.file.name}`,
            Body: fileContent,
            MediaMetadata: {
                foo: 'bar'
            }
        };

        // @ts-ignore
        s3.upload(params, function (err: any, data: any) {
            if (err) {
                throw err;
            }
            res.send({
                "response_code": 200,
                "response_message": "Success",
                "response_data": data
            });
        });
    });


export default handler
export const config = {
    api: {
        bodyParser: false, // Consume as stream
    },
};