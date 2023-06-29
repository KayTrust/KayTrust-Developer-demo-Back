import { Issuer } from "openid-client";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

const load = async () => {
  const ktProviderIssuer = await Issuer.discover(
    "https://auth.kaytrust.id/auth/realms/demo-innovation-labs"
  );
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("username", "");
  params.append("password", "");
  params.append("client_id", "alobestia");
  params.append("client_secret", "xFKVWjyCDi4BxEBnlPRTxs7FpinuK8Mu");
  const response = await axios.post(
    ktProviderIssuer.metadata.token_endpoint as string,
    params
  );
  const access_token = response.data.access_token;
  console.log(access_token);
  const userId = '691fe734-a652-462e-b02c-d13ca765fc97'
  const issuerDID = 'did:ev:cwMLHWAzm4cvZNjUCQF5Uv6mR48wuexGvKhbm';
  const subjectDID = 'did:ev:cwML9d59cTRMLar2Q2DdMnyczbf626pfB13jS'; //DID JJM KW Demo Japan
  const handle = uuidv4();
  const issuanceDate = new Date().toISOString();
  const randomINT = (max: number) => Math.floor(Math.random() * Math.floor(max));
  const aleatorio = randomINT(100000000000);
  const vc = {
      credentials: [{
        "credentialSubject": {
          "@id": subjectDID,
          "name": "Suzuki JJ64 " + aleatorio,
          "account": "129-9884-1345-3245-00410",
        },
        "issuanceDate":issuanceDate,
        "issuer":issuerDID,
        "type": ["VerifiableCredential", "AccountCredential"],
      }]
  };
  const msCredentials = 'http://52.226.193.175/credential'; // 'https://provider-back.kaytrust.id/ms-credential/credential'
  const resultCredentials = await axios.post(msCredentials, vc, {
      headers: {
          'Authorization': 'Bearer ' + access_token,
          'user-id': userId
      }
  });
  const credential = JSON.parse(resultCredentials.data.credentials[0].credential);
  console.log(credential); // return;
  const vp = {
      '@context': 'https://w3.org/2018/credentials/v1',
      '@id': uuidv4(),
      '@type': 'VerifiablePresentation',
      '@holder': issuerDID,
      verifiableCredential: [credential]
  }
  const resultHub = await axios.post('https://provider-back.kaytrust.id/ms-hub/presentation/' + subjectDID + '/' + handle, vp, {
      headers: {
          'Authorization': 'Bearer ' + access_token
      }
  }).catch((err) => {
      console.log(err)
  });
  console.log(resultHub);
}
load();
