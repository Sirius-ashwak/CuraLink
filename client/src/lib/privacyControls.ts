/**
 * Healthcare Privacy Controls & Access Management
 * Ensures HIPAA compliance and patient data protection
 */

export interface AccessLevel {
  canViewMedicalHistory: boolean;
  canViewContactInfo: boolean;
  canViewEmergencyInfo: boolean;
  canModifyRecords: boolean;
  canPrescribe: boolean;
  canScheduleAppointments: boolean;
}

export interface PatientConsent {
  id: string;
  patientId: number;
  doctorId: number;
  consentType: 'full_access' | 'emergency_only' | 'consultation_only';
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: number;
  userRole: 'doctor' | 'patient' | 'emergency_staff';
  action: 'view' | 'modify' | 'create' | 'delete';
  resourceType: 'patient_record' | 'appointment' | 'emergency_transport';
  resourceId: number;
  timestamp: Date;
  ipAddress?: string;
  justification?: string;
}

export class PrivacyController {
  /**
   * Check if a doctor has proper access to patient data
   */
  static async validateDoctorAccess(
    doctorId: number, 
    patientId: number, 
    accessType: keyof AccessLevel
  ): Promise<boolean> {
    try {
      // Check if doctor has active appointment with patient
      const hasAppointment = await this.hasActiveAppointmentRelation(doctorId, patientId);
      
      // Check patient consent
      const hasConsent = await this.hasPatientConsent(doctorId, patientId, accessType);
      
      // Emergency access override (with logging)
      const isEmergencyAccess = await this.isEmergencyAccess(patientId);
      
      if (isEmergencyAccess) {
        await this.logAccess(doctorId, 'doctor', 'view', 'patient_record', patientId, 'Emergency access');
        return true;
      }
      
      return hasAppointment && hasConsent;
    } catch (error) {
      console.error('Privacy validation error:', error);
      return false;
    }
  }

  /**
   * Check if doctor has active treatment relationship with patient
   */
  private static async hasActiveAppointmentRelation(doctorId: number, patientId: number): Promise<boolean> {
    const response = await fetch(`/api/privacy/doctor-patient-relation/${doctorId}/${patientId}`);
    const data = await response.json();
    return data.hasActiveRelation;
  }

  /**
   * Check patient consent for data access
   */
  private static async hasPatientConsent(
    doctorId: number, 
    patientId: number, 
    accessType: keyof AccessLevel
  ): Promise<boolean> {
    const response = await fetch(`/api/privacy/consent/${patientId}/${doctorId}`);
    const consent = await response.json();
    
    if (!consent || !consent.isActive) return false;
    
    // Map consent types to access levels
    const accessMatrix = {
      'full_access': {
        canViewMedicalHistory: true,
        canViewContactInfo: true,
        canViewEmergencyInfo: true,
        canModifyRecords: true,
        canPrescribe: true,
        canScheduleAppointments: true
      },
      'consultation_only': {
        canViewMedicalHistory: true,
        canViewContactInfo: false,
        canViewEmergencyInfo: false,
        canModifyRecords: true,
        canPrescribe: true,
        canScheduleAppointments: true
      },
      'emergency_only': {
        canViewMedicalHistory: false,
        canViewContactInfo: false,
        canViewEmergencyInfo: true,
        canModifyRecords: false,
        canPrescribe: false,
        canScheduleAppointments: false
      }
    };
    
    return accessMatrix[consent.consentType][accessType] || false;
  }

  /**
   * Check if this is emergency access scenario
   */
  private static async isEmergencyAccess(patientId: number): Promise<boolean> {
    const response = await fetch(`/api/emergency-transport/active/${patientId}`);
    const data = await response.json();
    return data.hasActiveEmergency;
  }

  /**
   * Log all access attempts for audit trail
   */
  static async logAccess(
    userId: number,
    userRole: 'doctor' | 'patient' | 'emergency_staff',
    action: 'view' | 'modify' | 'create' | 'delete',
    resourceType: 'patient_record' | 'appointment' | 'emergency_transport',
    resourceId: number,
    justification?: string
  ): Promise<void> {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userRole,
          action,
          resourceType,
          resourceId,
          timestamp: new Date().toISOString(),
          justification
        })
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Sanitize patient data based on access level
   */
  static sanitizePatientData(patientData: any, accessLevel: AccessLevel): any {
    const sanitized = { ...patientData };
    
    if (!accessLevel.canViewContactInfo) {
      delete sanitized.email;
      delete sanitized.phone;
      delete sanitized.address;
    }
    
    if (!accessLevel.canViewMedicalHistory) {
      delete sanitized.medicalHistory;
      delete sanitized.allergies;
      delete sanitized.medications;
    }
    
    if (!accessLevel.canViewEmergencyInfo) {
      delete sanitized.emergencyContact;
    }
    
    // Always remove sensitive financial data
    delete sanitized.insurance;
    delete sanitized.paymentInfo;
    
    return sanitized;
  }

  /**
   * Check if user can access specific feature
   */
  static async canAccessFeature(
    userId: number,
    userRole: string,
    feature: string,
    resourceId?: number
  ): Promise<boolean> {
    const rolePermissions = {
      'doctor': [
        'view_patient_records',
        'schedule_appointments', 
        'prescribe_medication',
        'emergency_access'
      ],
      'patient': [
        'view_own_records',
        'schedule_appointments',
        'emergency_request'
      ],
      'emergency_staff': [
        'emergency_access',
        'transport_management'
      ]
    };
    
    return rolePermissions[userRole]?.includes(feature) || false;
  }
}

/**
 * React Hook for Privacy-Aware Data Fetching
 */
export function usePrivacyAwareQuery<T>(
  queryKey: string[],
  userId: number,
  userRole: string,
  requiredAccess: keyof AccessLevel
): { data: T | null; isLoading: boolean; hasAccess: boolean } {
  // Implementation would integrate with React Query
  // and automatically apply privacy filters
  return {
    data: null,
    isLoading: false,
    hasAccess: false
  };
}