import { Router } from "express";

const router = Router();

// In-memory audit log storage (for demo purposes)
// In production, this would be stored in a secure database
let auditLogs: any[] = [];

/**
 * Log user access for compliance and security
 */
router.post("/log", async (req, res) => {
  try {
    const {
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      timestamp,
      justification
    } = req.body;

    const auditEntry = {
      id: `audit-${Date.now()}-${userId}`,
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      timestamp: new Date(timestamp),
      ipAddress: req.ip || req.connection.remoteAddress,
      justification,
      sessionId: req.sessionID
    };

    auditLogs.push(auditEntry);

    // In production, you would also:
    // 1. Store in secure database
    // 2. Send to compliance monitoring system
    // 3. Trigger alerts for suspicious activity

    console.log(`AUDIT LOG: ${userRole} ${userId} performed ${action} on ${resourceType} ${resourceId}`);
    
    res.json({ success: true, auditId: auditEntry.id });
  } catch (error) {
    console.error("Audit logging failed:", error);
    res.status(500).json({ error: "Failed to log audit entry" });
  }
});

/**
 * Get audit logs for compliance reporting
 */
router.get("/logs", async (req, res) => {
  try {
    const { userId, resourceType, startDate, endDate } = req.query;

    let filteredLogs = auditLogs;

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === parseInt(userId as string));
    }

    if (resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === resourceType);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(startDate as string)
      );
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(endDate as string)
      );
    }

    res.json(filteredLogs);
  } catch (error) {
    console.error("Error retrieving audit logs:", error);
    res.status(500).json({ error: "Failed to retrieve audit logs" });
  }
});

export default router;