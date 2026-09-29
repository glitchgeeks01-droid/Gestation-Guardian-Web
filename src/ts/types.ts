/**
 * Core Data Contracts for Gestation Guardian
 * This file enforces Type-Safety across the Frontend, Backend, and Firebase payload definitions.
 */

export interface TelemetryData {
    maternalHR?: number;
    bpSys?: number;
    bpDia?: number;
    weight?: number;
    weightVelocity?: number;
    kicks?: number;
    kicksStatus?: string;
    sleep?: number;
    sleepQuality?: string;
    protein?: string;
    glucose?: number;
}

export interface MedicalHistory {
    conditions?: string;
    medications?: string;
    symptoms?: string[];
}

export interface PatientRecord {
    /** 
     * The cryptographically secure Firebase Auth UID. 
     * Used exclusively as the Document ID in Firestore.
     */
    uid: string;
    
    /** 
     * The public 4-character PIN (e.g., 'GG-XXXX') used for initial pairing.
     * MUST NOT be used for direct document references.
     */
    pairingPin: string;
    
    name: string;
    email?: string;
    weeks: number;
    status: 'Stable' | 'Warning' | 'Amber' | 'High' | 'Critical' | 'Red';
    photo?: string;
    image?: string;
    
    gestosisScore?: number;
    vitals?: TelemetryData;
    medicalHistory?: MedicalHistory;
    
    createdAt?: string | Date | any; // Any allows for Firebase FieldValue.serverTimestamp()
}

// Ensure the global firebaseService window object is fully typed
declare global {
    interface Window {
        firebaseConfig: any;
        firebaseService: {
            getIsFirebaseEnabled(): boolean;
            getPatients(): Promise<PatientRecord[]>;
            getPatientById(identifier: string): Promise<PatientRecord>;
            login(): Promise<{success: boolean, user?: any, error?: string}>;
            bindPatient(pairingPin: string): Promise<boolean | void>;
            calculateGestosisScore(patient: PatientRecord): number;
            getGestosisRiskInfo(score: number): {
                band: string;
                color: string;
                textColor: string;
                bgColor: string;
                borderClass: string;
                action: string;
            };
        };
    }
}
