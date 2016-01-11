# ensemblejs-event-capture

Used for logging events from services.

```shell
npm start
```

This runs the server listening on port 3000.

We capture events POSTed to `/event` into a json file. The body of the POST is the document.

```shell
WS_DEFAULT_PROFILE=your-profile npm run sync
```

This runs the AWS S3 command that uploads to our S3 bucket. You need to have awscli installed and configured with the proper credentials.