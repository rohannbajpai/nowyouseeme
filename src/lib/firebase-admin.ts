import * as admin from 'firebase-admin';

function formatPrivateKey(key: string) {
    return key.replace(/\\n/g, '\n');
}

export function createFirebaseAdminApp(params: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}) {
    const privateKey = formatPrivateKey(params.privateKey);

    if (admin.apps.length > 0) {
        return admin.app();
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId: params.projectId,
            clientEmail: params.clientEmail,
            privateKey,
        }),
    });
}

const init = () => {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        // Only throw if we are trying to initialize and lack credentials.
        // If an app already exists, we might be fine (though unlikely in this context).
        if (admin.apps.length > 0) return;

        const missing = [];
        if (!projectId) missing.push("FIREBASE_PROJECT_ID");
        if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
        if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

        throw new Error(
            `Missing Firebase Admin credentials in .env file: ${missing.join(", ")}. ` +
            `Please check your .env file and ensure these variables are set.`
        );
    }

    createFirebaseAdminApp({ projectId, clientEmail, privateKey });
}

init();

export const db = admin.firestore();
export const auth = admin.auth();
