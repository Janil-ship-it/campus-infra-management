// Department-specific features for FIC roles
// Each functional category gets contextual permissions

export interface Feature {
  id: string
  label: string
  description: string
  icon: string
  category: 'CREATE' | 'VIEW' | 'MANAGE' | 'APPROVE'
}

export const CATEGORY_FEATURES: Record<string, Feature[]> = {
  ACADEMIC: [
    { id: 'create_academic_event', label: 'Create Academic Events', description: 'Schedule lectures, exams, workshops', icon: 'Calendar', category: 'CREATE' },
    { id: 'view_academic_calendar', label: 'View Academic Calendar', description: 'Access institute-wide academic schedule', icon: 'Eye', category: 'VIEW' },
    { id: 'manage_course_schedule', label: 'Manage Course Schedule', description: 'Edit class timings and room allocations', icon: 'Clock', category: 'MANAGE' },
    { id: 'approve_leave_requests', label: 'Approve Faculty Leave', description: 'Review and approve leave applications', icon: 'CheckCircle', category: 'APPROVE' },
  ],
  STUDENT_WELFARE: [
    { id: 'create_student_event', label: 'Create Student Events', description: 'Schedule counseling sessions, workshops, sports', icon: 'Calendar', category: 'CREATE' },
    { id: 'view_student_directory', label: 'View Student Directory', description: 'Access student contact information', icon: 'Users', category: 'VIEW' },
    { id: 'manage_wellness_programs', label: 'Manage Wellness Programs', description: 'Organize mental health initiatives', icon: 'Heart', category: 'MANAGE' },
    { id: 'approve_student_requests', label: 'Approve Student Requests', description: 'Review accommodation, leave, grievance requests', icon: 'CheckCircle', category: 'APPROVE' },
    { id: 'generate_welfare_reports', label: 'Generate Welfare Reports', description: 'Export student wellbeing analytics', icon: 'FileText', category: 'VIEW' },
  ],
  INFRASTRUCTURE: [
    { id: 'create_maintenance_request', label: 'Create Maintenance Requests', description: 'Report facility issues and track resolution', icon: 'Wrench', category: 'CREATE' },
    { id: 'book_facilities', label: 'Book Facilities', description: 'Reserve labs, auditoriums, conference rooms', icon: 'Building2', category: 'CREATE' },
    { id: 'view_infrastructure_status', label: 'View Infrastructure Status', description: 'Monitor building conditions and utility usage', icon: 'Eye', category: 'VIEW' },
    { id: 'manage_equipment', label: 'Manage Equipment Inventory', description: 'Track and allocate lab instruments', icon: 'Package', category: 'MANAGE' },
    { id: 'approve_service_requests', label: 'Approve Service Requests', description: 'Authorize maintenance and procurement', icon: 'CheckCircle', category: 'APPROVE' },
    { id: 'manage_room_allocations', label: 'Manage Room Allocations', description: 'Assign offices, labs, and residential spaces', icon: 'Home', category: 'MANAGE' },
  ],
  RESEARCH_ADVANCEMENT: [
    { id: 'create_research_event', label: 'Create Research Events', description: 'Schedule seminars, conferences, grant deadlines', icon: 'Calendar', category: 'CREATE' },
    { id: 'view_grant_opportunities', label: 'View Grant Opportunities', description: 'Access funding calls and deadlines', icon: 'TrendingUp', category: 'VIEW' },
    { id: 'manage_partnerships', label: 'Manage Industry Partnerships', description: 'Track collaborations and MOUs', icon: 'Handshake', category: 'MANAGE' },
    { id: 'approve_research_proposals', label: 'Approve Research Proposals', description: 'Review and authorize research projects', icon: 'CheckCircle', category: 'APPROVE' },
    { id: 'coordinate_alumni_events', label: 'Coordinate Alumni Events', description: 'Organize reunions and networking sessions', icon: 'GraduationCap', category: 'CREATE' },
  ],
}

// Role-based feature modifiers
export const ROLE_FEATURE_MODIFIERS: Record<string, string[]> = {
  SUPER_ADMIN: ['manage_users', 'view_audit_logs', 'configure_system', 'approve_all_requests'],
  DEAN_ADMIN: ['approve_cross_department_events', 'view_institute_analytics', 'manage_budget'],
  HOD: ['manage_department_faculty', 'approve_department_leave', 'allocate_department_budget'],
  COMMITTEE_CHAIR: ['schedule_committee_meetings', 'manage_committee_agendas', 'approve_committee_decisions'],
  FIC_COORDINATOR: ['manage_assigned_facilities', 'approve_related_requests'],
  CO_COORDINATOR: ['assist_primary_coordinator', 'view_reports'],
}

export function getFeaturesForFIC(category: string, role: string): Feature[] {
  const categoryFeatures = CATEGORY_FEATURES[category] || []
  const roleModifiers = ROLE_FEATURE_MODIFIERS[role] || []
  
  // Combine category features with role-specific additions
  const allFeatures = [...categoryFeatures]
  
  // Add role-specific features as generic entries
  roleModifiers.forEach(modifier => {
    allFeatures.push({
      id: modifier,
      label: modifier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `Permission granted by ${role.replace(/_/g, ' ')} role`,
      icon: 'Shield',
      category: 'MANAGE',
    })
  })
  
  return allFeatures
}
