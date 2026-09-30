window.AuditLogger = {
    log: function(action, details) {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.auth) {
                return;
            }
            
            const authUser = firebase.auth().currentUser;
            const userId = authUser ? authUser.uid : 'anonymous';
            const userEmail = authUser ? authUser.email : null;
            
            const logEntry = {
                timestamp: new Date().toISOString(),
                action: action,
                userId: userId,
                userEmail: userEmail,
                details: details || {},
                ipAddress: 'client-side',
                userAgent: navigator.userAgent
            };
            
            firebase.firestore().collection('audit_logs').add(logEntry).catch(e => {});
        } catch (e) {
            // Fail silently
        }
    }
};
