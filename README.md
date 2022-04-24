# fs.smrth.dev
A functional, straightforward open-source fileserver with user authentication and an easy-to-use dashboard.

## How does it work?
A MongoDB instance handles the storage of user accounts and api token management. Users' files are stored in the root directory of an AWS S3 bucket, under a folder named after their username.

Inside a user's folder, there are 3 directories where they can store files: `<username>/private` (for files accessible only to this user), `<username>/public` (for files accessible to any **authenticated** user), and `<username>/global` (for files accessible to anyone, with no authentication required). Keep in mind that the above is only for **read** permissions, **write** permissions are only available to the original user (`<username>`).

## Extras
API documentation and Dashboard documentation coming soon (Summer '22)!