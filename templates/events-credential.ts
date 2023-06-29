import { EVENT_INFO } from "../constants";

class EventsCredential {
    public '@context': string; 
    public '@type': Array<string>;
    public issuer: string;
    public issuanceDate: string;
    public credentialSubject: {[key: string]: string};

    constructor(did: string) {
        this['@context'] = 'https://www.w3.org/2018/credentials/v1';
        this['@type'] = ['EventCredential', 'VerifiableCredential'];
        this['issuer'] = process.env.ISSUER_DID as string;
        this['issuanceDate'] = this.getDateCreated();
        this.credentialSubject = {
            organizer: EVENT_INFO.organizer,
            actor: EVENT_INFO.actor,
            location: EVENT_INFO.location,
            eventName: EVENT_INFO.name,
            '@id': did,
            '@type': 'Event'
        };
    }

    getDateCreated() {
        return new Date().toISOString();
    }
}

export default EventsCredential;