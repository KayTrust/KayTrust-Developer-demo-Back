class CustomCredential {
    public '@context': string;
    public issuer: string;
    public issuanceDate: string;
    public credentialSubject: {[key: string]: any};
    public typeCredential: Array<string>;

    constructor(did: string, claims: Record<string, any>) {
        this['@context'] = 'https://www.w3.org/2018/credentials/v1';
        this['issuer'] = process.env.ISSUER_DID as string;
        this['issuanceDate'] = this.getDateCreated();
        this.credentialSubject = {
            '@id': did,
            ...claims
        };
        this.typeCredential = ['VerifiableCredential'];
    }

    getDateCreated() {
        return new Date().toISOString();
    }
}

export default CustomCredential;