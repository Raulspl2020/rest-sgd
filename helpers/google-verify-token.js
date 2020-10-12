const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID = process.env.GOOGLE_ID;

const client = new OAuth2Client(CLIENT_ID);

const validarGoogleIdToken = async(token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: [
                CLIENT_ID,
                "260451210233-jrmse9v47d2b44lfk48qvbou3fgkut3t.apps.googleusercontent.com",
            ],
        });
        const payload = ticket.getPayload();

        console.log("=============PAYLOAD====================");
        console.log(payload);

        const userid = payload["sub"];

        console.log(payload);

        return {
            name: payload["name"],
            picture: payload["picture"],
            email: payload["email"],
        };
    } catch (error) {
        return null;
    }
};

module.exports = {
    validarGoogleIdToken,
};