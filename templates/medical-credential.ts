import { MEDICAL_INFO } from "../constants";

class MedicalCredential {
    public '@context': string;
    public issuer: string;
    public issuanceDate: string;
    public credentialSubject: {[key: string]: any};
    public typeCredential: Array<string>;

    constructor(did: string, name: string) {
        this['@context'] = 'https://www.w3.org/2018/credentials/v1';
        this['issuer'] = process.env.ISSUER_DID as string;
        this['issuanceDate'] = this.getDateCreated();
        this.credentialSubject = {
            name: name,
            // tokenAccount: {
            //     '@type': "TokenAccount",
            //     // See SLIP 44: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
            //     coinType: '0x8000003c',
            //     // The network identifier for that particular coin type
            //     chainId: '0x13881',
            //     // The address of the smart contract that manages the token
            //     tokenAddress: '0xE097d6B3100777DC31B34dC2c58fB524C2e76921',
            //     // The type of token
            //     type: 'erc20',
            //     // The identifier of the account in the smart contract
            //     identifier: '0x4db0da3fbc929a75d38a1aeae681f2573f605248'
            // },
            organization: {
                legalName: MEDICAL_INFO.legalName
            },
            role: MEDICAL_INFO.role,
            speciality: MEDICAL_INFO.speciality,
            email: 'john.doe@polaris.com',
            birthDate: '1990-10-06',
            address: 'xx',
            '@id': did,
            '@type': 'MedicalCredential'
        };
        this.typeCredential = ['MedicalCredential'];
    }

    getDateCreated() {
        return new Date().toISOString();
    }
}

export default MedicalCredential;