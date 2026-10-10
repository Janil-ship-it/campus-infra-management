export interface IITGNModule {
  id: string
  name: string
  description: string
  color: string
}

export const IITGN_MODULES: IITGNModule[] = [
  { id: 'ACADEMIC_AFFAIRS', name: 'Academic Affairs', description: 'Classes, Exams, Senate, Curriculum', color: 'bg-blue-100 text-blue-800' },
  { id: 'STUDENT_WELFARE', name: 'Student Welfare', description: 'Hostel, Sports, Counseling, CDS, Clubs', color: 'bg-purple-100 text-purple-800' },
  { id: 'INFRASTRUCTURE', name: 'Infrastructure & Estates', description: 'Maintenance, Room Bookings, Safety', color: 'bg-orange-100 text-orange-800' },
  { id: 'RESEARCH_ADVANCEMENT', name: 'Research & Advancement', description: 'Seminars, Grants, Alumni, Industry', color: 'bg-green-100 text-green-800' },
  { id: 'FACULTY_AFFAIRS', name: 'Faculty Affairs', description: 'Recruitment, Reviews, Faculty Meetings', color: 'bg-teal-100 text-teal-800' },
  { id: 'INSTITUTE_EVENTS', name: 'Institute Events', description: 'Convocation, Foundation Day, Holidays', color: 'bg-red-100 text-red-800' },
  { id: 'GLOBAL', name: 'Global / System Admin', description: 'Cross-departmental system access', color: 'bg-gray-100 text-gray-800' },
]
