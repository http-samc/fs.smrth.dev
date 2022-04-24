import type { NextApiRequest, NextApiResponse } from 'next'
import nextConnect from "next-connect";
import AWS from "aws-sdk";
import fsAuth, { FSRequest } from '../../utils/fs-auth';

const handler = nextConnect({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
        console.error(err.stack);
        res.status(500).end("Sorry, something broke!");
    },
    onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
        res.status(404).end("Page not found");
    },
})
    .use(fsAuth)
    .get(async (req: FSRequest, res: NextApiResponse) => {

        if (!req.authorizedUser || !req.hasValidAuthorization) {
            res.status(401).end("Unauthorized");
            return;
        }

        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        })


        const s3 = new AWS.S3();

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Marker: req.authorizedUser
        };

        // @ts-ignore
        const listedObjs = await s3.listObjects(params).promise() as any;
        let tree = listedObjs.Contents;

        for (let i = 0; i < tree.length; i++) {
            tree[i] = {
                document: tree[i].Key.split('/').slice(2).join('/'),
                modified: tree[i].LastModified,
                visibility: tree[i].Key.split('/')[1],
                size: tree[i].Size, // in bytes..
            }
        }

        res.json(tree);
    });


export default handler