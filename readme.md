# Flutterwave - Legaltrunk Handshake Trust
## _Introduction 📃_

The way this this works is, flutterwave shares their public key with legaltrunk (api service) and then sends a request to reterieve the payload for handshake, this request requires the email of the user in context. 
  Upon receiving the payoload, flutterwave decrypts that payload using their private key and sends it back to token service to get the token for user session.
  If flutterwave fails to decrypt the payload, this handshake will just fail. 
  
AngularJS-powered HTML5 Markdown editor.

## Process 🔐
1. Flutterwave sends a public key over the email to backend service
2. Flutterwave calls the `api/flutterwave-handshake` with user's email to get the encrypted payload (encrypted with public key from step 1)
3. Flutterwave dcrypts payload from step 2 and sends that decrypted payload to `api/flutterwave-handshake-token` this will give back the session user token that can be used to call all other APIs


## Technical 🖥

### 1. Generate the keys (public and private both)
```
const fs = require('fs');
const crypto = require('crypto');

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
```
> Now please have that public key shipped to us so we can store it on our servers.

### 2. Initiate the handshake
```
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios').default;

const apiUrl = `[BASE_URL_OF_LEGAL_TRUNK_API]/api/auth/flutterwave-handshake`;
const tokenUrl = `[BASE_URL_OF_LEGAL_TRUNK_API]/api/auth/flutterwave-handshake-token`;

const doHandshake = async (email) => {
    axios.post(apiUrl, {
        email: email // pass user email here
    }, ).then((response) => {
        console.log('resss')
        const payload = response.data.data.handshake_payload;
        console.log(payload) // you got the encrypted payload
    });
}
```
Now try to decrypt that payload using step 3

### 3. Decrypt the token
```
const decryptPayload = (payload) => {
    // payload base64 decode to Buffer<>
    const encryptedText = Buffer.from(payload, 'base64');
    console.log(encryptedText)
    const finalRes = crypto.privateDecrypt(
        {
            key: fs.readFileSync('private_key.pem', 'utf8'), // use your private key to decrypt, from step 1
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        encryptedText
    )
    const secretPayload = finalRes.toString('utf8');
    console.log(secretPayload)
   // now use this secretPayload to retereive the token from api service
}
```

### 4. Get the final session token 
```
const getToken = async (sec) => {
    axios.get(tokenUrl, {
        headers: {
            'x-auth-token': `${sec}` // sec (secretPayload) from step 4
        }
    }).then((response) => {
        console.log('resss Token')
        console.log(response.data) // same response that a user would get if he logged in or signed up, 
        // now you can use this token to work with other APIs like before
    }).catch((error) => {
        console.log('error')
        console.log(error);
    });
}

```


# Complete example class:
```
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios').default;

const apiUrl = `http://localhost:5000/api/auth/flutterwave-handshake`;
const tokenUrl = `http://localhost:5000/api/auth/flutterwave-handshake-token`;

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
```

# Dependencies

```
"dependencies": {
    "axios": "^0.21.1",
    "crypto": "^1.0.1",
    "express": "^4.17.1",
    "fs": "^0.0.1-security",
    "uuid": "^8.3.2"
  }
  ```