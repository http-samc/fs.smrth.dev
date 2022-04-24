
import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb';
import nextConnect from "next-connect";

const uri = `mongodb+srv://${process.env.FS_MONGO_USER}:${process.env.FS_MONGO_PASS}@cluster0.eat5o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

const handler = nextConnect({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
        res.status(500).end("Sorry, something broke!");
    },
    onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
        res.status(404).end("Page not found");
    },
})
    .post(async (req: NextApiRequest, res: NextApiResponse) => {
        await client.connect();
        const authLookup = client.db('fs-smrth-dev').collection('auth');
        const tokenLookup = client.db('fs-smrth-dev').collection('tokens');

        if (typeof req.body === 'string') {
            req.body = JSON.parse(req.body);
        }

        const { username, password } = req.body;

        if (!username || !password) {
            res.status(401).end('Missing username or password.');
            await client.close();
            return;
        }

        const user = await authLookup.findOne({ username });

        if (!user) {
            res.status(401).end('User does not exist. Check your username or create an account.');
            await client.close();
            return;
        }
        if (user.password !== password) {
            res.status(401).end('Incorrect password.');
            await client.close();
            return;
        }

        // Generate token
        const token = Math.random().toString(36);
        const expiration = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day

        // Delete any existing tokens for this user
        await tokenLookup.deleteMany({ username });

        // Insert new token, set expiration, and send to user
        await tokenLookup.insertOne({ token, username, expiration });

        res
            .status(200)
            .setHeader('Set-Cookie', `authorization=${token}; path=/; expires=${expiration.toUTCString()}`)
            .json({ token, expiration });

        await client.close();
    })
    .delete(async (req: NextApiRequest, res: NextApiResponse) => {
        await client.connect();
        const tokenLookup = client.db('fs-smrth-dev').collection('tokens');

        if (req.headers.authorization || req.cookies.authorization) {
            // @ts-ignore
            let token = req.headers.authorization.replace('Bearer ', '') || req.cookies.authorization;
            let tokenContract = await tokenLookup.findOne({ token }) || { username: null };
            if (tokenContract.username) {
                await tokenLookup.deleteOne({ token });
                res.status(200).end('Token deleted.');
            } else {
                res.status(401).end('Invalid token.');
            }
        } else {
            res.status(401).end('Missing authorization header.');
        }

        await client.close();
    });

export default handler