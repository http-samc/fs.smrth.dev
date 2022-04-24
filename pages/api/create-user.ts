
import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb';
import nextConnect from "next-connect";

const uri = `mongodb+srv://${process.env.FS_MONGO_USER}:${process.env.FS_MONGO_PASS}@cluster0.eat5o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

const handler = nextConnect({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
        console.error(err.stack);
        res.status(500).end("Sorry, something broke!");
    },
    onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
        res.status(404).end("Page not found");
    },
})
    .post(async (req: NextApiRequest, res: NextApiResponse) => {
        // Filesystem not made public yet (closed beta)!
        res.status(400).end('This filesystem is not available for public use yet.');
        return;

        await client.connect();
        const authLookup = client.db('fs-smrth-dev').collection('auth');

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

        if (user) {
            res.status(401).end('User already exists. Try logging in or selecting a different username.');
            await client.close();
            return;
        }
        if (password.length < 8) {
            res.status(401).end('Password must be at least 8 characters long.');
            await client.close();
            return;
        }
        await authLookup.insertOne({ username, password });
        res.status(200).end('User created.');
        await client.close();
    });

export default handler