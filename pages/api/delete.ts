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
        if (!req.hasValidAuthorization) {
            res.status(401).end("Unauthorized");
            return;
        }

        const { id } = req.query;
        if (!id) {
            res.status(400).end("Missing id");
            return;
        }

        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        })


        const s3 = new AWS.S3();

        console.log(`${req.authorizedUser}/${id}`)
        // Setting up S3 upload parameters
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${req.authorizedUser}/${id}`,
        };


        // @ts-ignore
        s3.deleteObject(params, function (err: any, data: any) {
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