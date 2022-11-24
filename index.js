const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios').default;

const apiUrl = `http://legaltrunck.parallelscoreprojects.com/api/auth/flutterwave-handshake`;
const tokenUrl = `http://legaltrunck.parallelscoreprojects.com/api/auth/flutterwave-handshake-token`;

const generateKeys = async () => {

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    // The standard secure default length for RSA keys is 2048 bits
        modulusLength: 5000,
    })
    const pk = publicKey.export({type:'pkcs1',format:'pem'});
    const rk = privateKey.export({type:'pkcs1',format:'pem'});
    // write a file named key2.pem with the contents of the key
    fs.writeFileSync('public_key.pem', pk);
    fs.writeFileSync('private_key.pem', rk);
}

const decryptPayload = (payload) => {

    // payload base64 decode
    const encryptedText = Buffer.from(payload, 'base64');
    console.log(encryptedText)
    const finalRes = crypto.privateDecrypt(
        {
            key: fs.readFileSync('private_key.pem', 'utf8'),
            // In order to decrypt the data, we need to specify the
            // same hashing function and padding scheme that we used to
            // encrypt the data in the previous step
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        encryptedText
    )
    const secretPayload = finalRes.toString('utf8');
    console.log(secretPayload)

    const token = getToken(secretPayload)
}


const getToken = async (sec) => {


    axios.get(tokenUrl, {
        headers: {
            'x-auth-token': `${sec}`
        }
    }).then((response) => {
        console.log('resss Token')
        console.log(response.data)
    }).catch((error) => {
        console.log('error')
        console.log(error);
    });
    
}

const doHandshake = async (email) => {


    axios.post(apiUrl, {
        email: email
    }, ).then((response) => {
        console.log('resss')
        const payload = response.data.data.handshake_payload;
        console.log(payload)


        decryptPayload(payload)

        return response.data;
    }).catch((error) => {
        console.log('error')
        console.log(error);
    });
    
}
doHandshake('test@gmail.com');
// generateKeys()