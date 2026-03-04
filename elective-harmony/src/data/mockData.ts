export interface Elective {
  id: string;
  code: string;
  name: string;
  faculty: string;
  department: string;
  totalSeats: number;
  remainingSeats: number;
  description: string;
  semester: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  semester: number;
  cgpa: number;
  preferences: string[];
  allocatedElective?: string;
}

export const electives: Elective[] = [
  { id: "1", code: "CS401", name: "Machine Learning", faculty: "Dr. Priya Sharma", department: "Computer Science", totalSeats: 70, remainingSeats: 12, description: "Introduction to supervised and unsupervised learning algorithms.", semester: "3-1" },
  { id: "2", code: "CS402", name: "Cyber Security", faculty: "Dr. Rajeev Kumar", department: "Computer Science", totalSeats: 70, remainingSeats: 8, description: "Fundamentals of network security and ethical hacking.", semester: "3-1" },
  { id: "3", code: "EC401", name: "IoT Systems", faculty: "Dr. Anita Desai", department: "Electronics", totalSeats: 70, remainingSeats: 30, description: "Design and implementation of Internet of Things systems.", semester: "3-2" },
  { id: "4", code: "CS403", name: "Cloud Computing", faculty: "Prof. Vikram Patel", department: "Computer Science", totalSeats: 70, remainingSeats: 5, description: "Cloud infrastructure, services, and deployment models.", semester: "3-2" },
  { id: "5", code: "ME401", name: "Robotics", faculty: "Dr. Suresh Nair", department: "Mechanical", totalSeats: 70, remainingSeats: 25, description: "Fundamentals of robot kinematics and control systems.", semester: "4-1" },
  { id: "6", code: "CS404", name: "Blockchain Technology", faculty: "Dr. Meena Iyer", department: "Computer Science", totalSeats: 70, remainingSeats: 32, description: "Distributed ledger technology and smart contracts.", semester: "4-1" },
  { id: "7", code: "CS405", name: "Natural Language Processing", faculty: "Dr. Arjun Reddy", department: "Computer Science", totalSeats: 70, remainingSeats: 10, description: "Text processing, sentiment analysis, and language models.", semester: "4-1" },
  { id: "8", code: "EC402", name: "VLSI Design", faculty: "Prof. Kavitha Rao", department: "Electronics", totalSeats: 70, remainingSeats: 28, description: "Very Large Scale Integration design and verification.", semester: "3-2" },
];

export const students: Student[] = [
  { id: "1", name: "Aarav Mehta", rollNumber: "20CS101", department: "Computer Science", semester: 6, cgpa: 9.2, preferences: ["1", "2", "4"], allocatedElective: "1" },
  { id: "2", name: "Diya Patel", rollNumber: "20CS102", department: "Computer Science", semester: 6, cgpa: 8.8, preferences: ["2", "1", "3"], allocatedElective: "2" },
  { id: "3", name: "Rohan Singh", rollNumber: "20EC101", department: "Electronics", semester: 6, cgpa: 8.5, preferences: ["3", "5", "6"], allocatedElective: "3" },
  { id: "4", name: "Sneha Gupta", rollNumber: "20CS103", department: "Computer Science", semester: 6, cgpa: 9.5, preferences: ["4", "1", "7"], allocatedElective: "4" },
  { id: "5", name: "Karthik Nair", rollNumber: "20ME101", department: "Mechanical", semester: 6, cgpa: 7.8, preferences: ["5", "3", "8"], allocatedElective: "5" },
  { id: "6", name: "Priya Iyer", rollNumber: "20CS104", department: "Computer Science", semester: 6, cgpa: 8.1, preferences: ["1", "7", "6"], allocatedElective: "1" },
  { id: "7", name: "Amit Sharma", rollNumber: "20CS105", department: "Computer Science", semester: 6, cgpa: 7.2, preferences: ["7", "2", "4"], allocatedElective: "7" },
  { id: "8", name: "Nisha Desai", rollNumber: "20EC102", department: "Electronics", semester: 6, cgpa: 8.9, preferences: ["8", "3", "6"], allocatedElective: "8" },
  { id: "9", name: "Rahul Verma", rollNumber: "20CS106", department: "Computer Science", semester: 6, cgpa: 6.5, preferences: ["6", "1", "2"], allocatedElective: "6" },
  { id: "10", name: "Ananya Reddy", rollNumber: "20CS107", department: "Computer Science", semester: 6, cgpa: 7.9, preferences: ["2", "4", "1"] },
];

export const electivePopularity = electives.map(e => ({
  name: e.code,
  fullName: e.name,
  requests: e.totalSeats - e.remainingSeats + Math.floor(Math.random() * 20),
}));

export const seatUtilization = electives.map(e => ({
  name: e.code,
  fullName: e.name,
  filled: e.totalSeats - e.remainingSeats,
  total: e.totalSeats,
  percentage: Math.round(((e.totalSeats - e.remainingSeats) / e.totalSeats) * 100),
}));

// Allocation round simulation data
export const allocationRounds = [
  { round: 1, allocated: 4, unallocated: 6, topElective: "Machine Learning", description: "CGPA 9.0+ students matched first" },
  { round: 2, allocated: 7, unallocated: 3, topElective: "Cloud Computing", description: "CGPA 8.0-9.0 students processed" },
  { round: 3, allocated: 9, unallocated: 1, topElective: "Cyber Security", description: "CGPA 7.0-8.0 students assigned" },
  { round: 4, allocated: 9, unallocated: 1, topElective: "NLP", description: "Remaining students with tie-breaking" },
  { round: 5, allocated: 9, unallocated: 1, topElective: "—", description: "Final round - 1 student unallocated (no seats)" },
];

// Fairness analytics by CGPA range
export const fairnessData = [
  { range: "9.0-10.0", students: 2, gotFirst: 2, gotSecond: 0, gotThird: 0, unallocated: 0, satisfaction: 100 },
  { range: "8.0-8.9", students: 4, gotFirst: 3, gotSecond: 1, gotThird: 0, unallocated: 0, satisfaction: 92 },
  { range: "7.0-7.9", students: 3, gotFirst: 1, gotSecond: 1, gotThird: 1, unallocated: 0, satisfaction: 78 },
  { range: "6.0-6.9", students: 1, gotFirst: 0, gotSecond: 0, gotThird: 0, unallocated: 1, satisfaction: 0 },
];
