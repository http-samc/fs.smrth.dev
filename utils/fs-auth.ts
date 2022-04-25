import { MongoClient } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

const uri = `mongodb+srv://${process.env.FS_MONGO_USER}:${process.env.FS_MONGO_PASS}@cluster0.eat5o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

export interface FSRequest extends NextApiRequest {
    authorizedUser: any;
    hasValidAuthorization: boolean;
}

const fsAuth = async (req: FSRequest, res: NextApiResponse, next: CallableFunction) => {
    await client.connect();
    const tokenLookup = client.db('fs-smrth-dev').collection('tokens');

    let token;

    if (req.headers.authorization)
        token = req.headers.authorization.replace('Bearer ', '')
    else
        token = req.cookies.authorization;

    let tokenContract = await tokenLookup.findOne({ token }) || { username: null, expiration: null };

    req.authorizedUser = tokenContract.username;
    req.hasValidAuthorization = new Date(tokenContract.expiration) <= new Date() ? false : true;

    if (token && !req.hasValidAuthorization) {
        await tokenLookup.deleteOne({ token });
    }

    await client.close();

    next();
}


export default fsAuth;