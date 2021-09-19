import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
const CLIENT_ID = process.env.GOOGLE_ID;

const client = new OAuth2Client(CLIENT_ID);

const validarGoogleIdToken = async (token: string) => {
    //console.log(token);
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
        console.log(error);
        return null;
    }
};



export const validateGoogleIdToken = async (token: string): Promise<any> => {

    try {
        let response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        console.log("El codifo de estado es", response.status);
        if (response.status == 200) {
            let payload = await response.json();
            return {
                name: payload["name"],
                picture: payload["picture"],
                email: payload["email"],
            };
        } else {
            return null;
        }

    } catch (error) {
        console.log(error);
        return null;
    }
};

export {
    validarGoogleIdToken,
};