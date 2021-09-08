db.createUser(
    {
        user: "mongo_itp",
        pwd: "EvuEOlfBZQSoG6vtqCHi",
        roles: [
            {
                role: "readWrite",
                db: "auth"
            }
        ]
    }
);