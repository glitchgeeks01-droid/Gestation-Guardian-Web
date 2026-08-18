const calculateMAP = (bpSys, bpDia) => {
    return (bpSys + 2 * bpDia) / 3;
};

const detectAnomaly = (historicalVitals, currentVitals) => {
    if (!historicalVitals || historicalVitals.length < 2) {
        return false; // Not enough history to calculate standard deviation reliably
    }

    const maps = historicalVitals.map(v => calculateMAP(v.bpSys, v.bpDia));
    const n = maps.length;
    
    // Calculate moving average (mean)
    const sum = maps.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    // Calculate standard deviation
    const variance = maps.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const currentMAP = calculateMAP(currentVitals.bpSys, currentVitals.bpDia);

    // Baseline + 1.5 standard deviations
    const threshold = mean + (1.5 * stdDev);

    return currentMAP > threshold;
};

const generateRiskAssessmentFHIR = (patientId, currentVitals) => {
    const timestamp = new Date().toISOString();
    return {
        resourceType: "RiskAssessment",
        status: "final",
        subject: {
            reference: `Patient/${patientId}`
        },
        occurrenceDateTime: timestamp,
        prediction: [
            {
                outcome: {
                    coding: [
                        {
                            system: "http://snomed.info/sct",
                            code: "48194001",
                            display: "Pregnancy complication"
                        }
                    ],
                    text: "Impending Gestosis risk"
                },
                qualitativeRisk: {
                    coding: [
                        {
                            system: "http://terminology.hl7.org/CodeSystem/risk-probability",
                            code: "high",
                            display: "High probability"
                        }
                    ]
                }
            }
        ],
        basis: [
            {
                reference: `Observation/MAP-${timestamp}`,
                display: `Mean Arterial Pressure: Sys ${currentVitals.bpSys}, Dia ${currentVitals.bpDia}`
            }
        ]
    };
};

module.exports = {
    calculateMAP,
    detectAnomaly,
    generateRiskAssessmentFHIR
};
