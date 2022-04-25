import type { NextApiRequest, NextApiResponse } from 'next'
import nextConnect from "next-connect";
// @ts-ignore
import fileUpload from "express-fileupload";
import AWS from "aws-sdk";
import fsAuth, { FSRequest } from '../../utils/fs-auth';

interface File {
    name: string;
    data: Buffer;
}

interface UploadRequest extends FSRequest {
    files: File[],
    body: {
        visibility: 'private' | 'public' | 'global',
        paths: string,
    }
}

const handler = nextConnect({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
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
            accessKeyId: process.env.FS_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.FS_AWS_SECRET_ACCESS_KEY,
            region: process.env.FS_AWS_REGION
        })


        const s3 = new AWS.S3();

        let error = false;

        let paths = JSON.parse(req.body.paths);

        for (const [ref, file] of Object.entries(req.files)) {
            // @ts-ignore
            const fileContent = Buffer.from(file.data, 'binary');
            // Setting up S3 upload parameters
            const params = {
                Bucket: process.env.FS_AWS_BUCKET_NAME,
                Key: `${req.authorizedUser}/${req.body.visibility}/${paths[ref] ? paths[ref] + '/' : ''}${file.name}`,
                Body: fileContent
            };

            // @ts-ignore
            s3.upload(params, function (err: any, data: any) {
                if (err) {
                    error = true;
                }
            });
        }
        if (error) {
            res.status(500).end("Upload failed.");
            return;
        }

        res.send({
            "response_code": 200,
            "response_message": "Success",
        });
    });


export default handler
export const config = {
    api: {
        bodyParser: false, // Consume as stream
    },
};