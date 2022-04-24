import type { NextApiRequest, NextApiResponse } from 'next'
import nextConnect from "next-connect";
import AWS from "aws-sdk";
import fsAuth, { FSRequest } from '../../utils/fs-auth';

const visibilities = ['private', 'public', 'global'];

const handler = nextConnect({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
        res.status(500).end("Sorry, something broke!");
    },
    onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
        res.status(404).end("Page not found");
    },
})
    .use(fsAuth)
    .get(async (req: FSRequest, res: NextApiResponse) => {
        if (!req.hasValidAuthorization) {
            res.status(401).end("Unauthorized");
            return;
        }

        /**
         * to: <new visibility>/<new path?>/<new filename>.<new extension>
         * from: <old visibility>/<old path?>/<old filename>.<old extension>
         */

        const { to, from } = req.query;
        if (!to || !from) {
            res.status(400).end("Missing movement information");
            return;
        }

        // @ts-ignore
        if (!visibilities.includes(to.split('/')[0])) {
            res.status(400).end("Invalid visibility");
            return;
        }

        AWS.config.update({
            accessKeyId: process.env.FS_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.FS_AWS_SECRET_ACCESS_KEY,
            region: process.env.FS_AWS_REGION
        })


        const s3 = new AWS.S3();

        const copyParams = {
            Bucket: process.env.FS_AWS_BUCKET_NAME,
            CopySource: `${process.env.FS_AWS_BUCKET_NAME}/${req.authorizedUser}/${from}`,
            Key: `${req.authorizedUser}/${to}`,
            ACL: 'private'
        };

        let copyFailed = false;

        // @ts-ignore
        s3.copyObject(copyParams, (err, data) => {
            if (err) {
                res.status(500).end(err.message);
                copyFailed = true;
                return;
            }
        });

        if (copyFailed) return res.send({
            "response_code": 500,
            "response_message": "Failed to copy file",
            "response_data": null
        });

        const deleteParams = {
            Bucket: process.env.FS_AWS_BUCKET_NAME,
            Key: `${req.authorizedUser}/${from}`,
        };

        // @ts-ignore
        s3.deleteObject(deleteParams, function (err: any, data: any) {
            if (err) {
                res.status(500).end(err.message);
                return;
            }
            res.send({
                "response_code": 200,
                "response_message": "Success",
                // "response_data": data
            });
        });
    });


export default handler
export const config = {
    api: {
        bodyParser: false, // Consume as stream
    },
};