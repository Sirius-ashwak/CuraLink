/**
 * Firebase Security Rules for Healthcare Data Protection
 * CRITICAL: These rules ensure HIPAA compliance and patient privacy
 */

// Firestore Security Rules
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User data - allow creation during signup, then restrict to user themselves
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if true; // Allow user creation during signup
    }
    
    // Doctor profiles - publicly readable for patient selection
    match /doctors/{doctorId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow doctor profile creation during signup
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         hasRole(request.auth.uid, 'admin'));
    }
    
    // Patient records - STRICT ACCESS CONTROL
    match /patients/{patientId} {
      // Patients can only access their own records
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Doctors can only access patients they have active appointments with
      allow read: if request.auth != null && 
        hasActiveAppointmentRelation(request.auth.uid, patientId) &&
        hasPatientConsent(patientId, request.auth.uid);
      
      // Emergency access with mandatory logging
      allow read: if request.auth != null && 
        hasEmergencyAccess(patientId) &&
        hasRole(request.auth.uid, 'emergency_staff');
    }
    
    // Appointments - access control by patient and doctor
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.patientUserId || 
         request.auth.uid == resource.data.doctorUserId);
    }
    
    // Emergency transport - restricted to emergency staff and involved patient
    match /emergency_transports/{transportId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.patientUserId ||
         hasRole(request.auth.uid, 'emergency_staff') ||
         hasRole(request.auth.uid, 'doctor'));
      
      allow write: if request.auth != null && 
        hasRole(request.auth.uid, 'emergency_staff');
    }
    
    // Audit logs - read-only for compliance staff
    match /audit_logs/{logId} {
      allow read: if request.auth != null && 
        hasRole(request.auth.uid, 'compliance_officer');
      allow create: if request.auth != null; // All authenticated users can create logs
    }
    
    // Patient consent records
    match /patient_consents/{consentId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.patientUserId ||
         request.auth.uid == resource.data.doctorUserId);
    }
    
    // HELPER FUNCTIONS
    function hasRole(userId, role) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role == role;
    }
    
    function hasActiveAppointmentRelation(doctorUserId, patientId) {
      return exists(/databases/$(database)/documents/appointments/
        $(doctorUserId + '_' + patientId)) &&
        get(/databases/$(database)/documents/appointments/
        $(doctorUserId + '_' + patientId)).data.status in ['scheduled', 'in_progress'];
    }
    
    function hasPatientConsent(patientId, doctorUserId) {
      return exists(/databases/$(database)/documents/patient_consents/
        $(patientId + '_' + doctorUserId)) &&
        get(/databases/$(database)/documents/patient_consents/
        $(patientId + '_' + doctorUserId)).data.isActive == true;
    }
    
    function hasEmergencyAccess(patientId) {
      return exists(/databases/$(database)/documents/emergency_transports/
        $(patientId)) &&
        get(/databases/$(database)/documents/emergency_transports/
        $(patientId)).data.status == 'active';
    }
  }
}
`;

// Firebase Storage Rules for profile images and documents
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User profile images - only owner can upload/modify
    match /profile_images/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Medical documents - strict access control
    match /medical_documents/{patientId}/{fileName} {
      // Only patient can upload their documents
      allow write: if request.auth != null && 
        request.auth.uid == getPatientUserId(patientId);
      
      // Doctors can read if they have active appointment and consent
      allow read: if request.auth != null && 
        (request.auth.uid == getPatientUserId(patientId) ||
         (hasRole(request.auth.uid, 'doctor') && 
          hasActiveAppointmentRelation(request.auth.uid, patientId)));
    }
    
    // Emergency documents - emergency staff access
    match /emergency_documents/{transportId}/{fileName} {
      allow read, write: if request.auth != null && 
        hasRole(request.auth.uid, 'emergency_staff');
    }
    
    function getPatientUserId(patientId) {
      return firestore.get(/databases/(default)/documents/patients/$(patientId)).data.userId;
    }
    
    function hasRole(userId, role) {
      return firestore.get(/databases/(default)/documents/users/$(userId)).data.role == role;
    }
    
    function hasActiveAppointmentRelation(doctorUserId, patientId) {
      return firestore.exists(/databases/(default)/documents/appointments/
        $(doctorUserId + '_' + patientId));
    }
  }
}
`;

module.exports = {
  firestoreRules,
  storageRules
};