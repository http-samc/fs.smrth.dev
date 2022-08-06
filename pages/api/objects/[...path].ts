import type { NextApiRequest, NextApiResponse } from 'next'
import nextConnect from "next-connect";
import AWS from "aws-sdk";
import fsAuth, { FSRequest } from '../../../utils/fs-auth';
// @ts-ignore
import { marked } from 'marked';

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
        const { path } = req.query;
        if (!path) {
            res.status(400).end("Missing path");
            return;
        }

        if (path.length < 2) {
            res.status(400).end("Invalid path");
            return;
        }

        if (
            (path[1] === 'private' && (path[0] !== req.authorizedUser || !req.hasValidAuthorization))
            || (path[1] === 'public' && !req.hasValidAuthorization)
        ) {
            res.status(401).end("Unauthorized");
            return;
        }

        AWS.config.update({
            accessKeyId: process.env.FS_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.FS_AWS_SECRET_ACCESS_KEY,
            region: process.env.FS_AWS_REGION
        })


        const s3 = new AWS.S3();

        // Requesting a file in a folder, list contents
        // if (!path[-1].includes('.')) {
        //     const listParams = {
        //         Bucket: process.env.FS_AWS_BUCKET_NAME,
        //         // @ts-ignore
        //         Marker: path.join('/')
        //     }
        //     // @ts-ignore
        //     const dirChildren = await s3.listObjects(listParams).promise();
        //     let json = !dirChildren.Contents ? {} : dirChildren.Contents.map(file => {
        //         if (!file.Key) return
        //         return {
        //             name: file.Key.split('/').pop(),
        //             // @ts-ignore
        //             type: file.Key.split('/').pop().includes('.') ? 'file' : 'folder',
        //             path: file.Key,
        //             size: file.Size,
        //             lastModified: file.LastModified
        //         }
        //     })
        //     res.status(200).json(json);
        // }

        const params = {
            Bucket: process.env.FS_AWS_BUCKET_NAME,
            // @ts-ignore
            Key: path.join('/'),
        };

        // @ts-ignore
        s3.getObject(params, (err, data) => {
            if (err) {
                res.status(500).end(err.message);
                return;
            }
            // @ts-ignore
            if (path.pop().endsWith('.md')) {
                let html = marked(data.Body?.toString());
                html = `
                <head>
                <link rel="stylesheet" href="https://raw.githubusercontent.com/markdowncss/retro/master/css/retro.css">
                </head>
                ${html}`;
                res.status(200).send(html);
                return;
            }
            res.setHeader('Content-Disposition', 'inline');
            res.end(data.Body);
        });
    });


export default handler
export const config = {
    api: {
        bodyParser: false, // Consume as stream
    },
};