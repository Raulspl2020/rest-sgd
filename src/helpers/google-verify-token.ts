import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_ID;

const client = new OAuth2Client(CLIENT_ID);

const validarGoogleIdToken = async(token:string) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: [
                CLIENT_ID,
                process.env.GOOGLE_CLIENT_MOVIL_ID,
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

export {
    validarGoogleIdToken,
};