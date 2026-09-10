import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
const PDFDocument = require('pdfkit');

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Rohan', 'Karan',
  'Yash', 'Ansh', 'Dev', 'Manish', 'Harsh', 'Aryan', 'Samar', 'Laksh', 'Rudra', 'Nikhil',
  'Siddharth', 'Varun', 'Gautam', 'Kunal', 'Tejas', 'Madhav', 'Chirag', 'Tushar', 'Alok', 'Deepak',
  'Ayush', 'Rishi', 'Abhinav', 'Kartik', 'Saurabh', 'Mayank', 'Tanmay', 'Vedant', 'Shivam', 'Om',
  'Rajat', 'Harshit', 'Naveen', 'Sameer', 'Piyush', 'Lalit', 'Gaurav', 'Tarun', 'Anurag', 'Vikas'
];

const FIRST_NAMES_FEMALE = [
  'Aanya', 'Diya', 'Saanvi', 'Ananya', 'Fatima', 'Isha', 'Aadhya', 'Kavya', 'Avani', 'Sara',
  'Myra', 'Anika', 'Navya', 'Pari', 'Riya', 'Sneha', 'Shreya', 'Tanvi', 'Pooja', 'Neha',
  'Swati', 'Meera', 'Roshni', 'Simran', 'Kritika', 'Khushi', 'Divya', 'Tara', 'Disha', 'Bhavna',
  'Aditi', 'Prisha', 'Siya', 'Nisha', 'Palak', 'Anjali', 'Rashmi', 'Jyoti', 'Shalini', 'Manju',
  'Ritu', 'Sunita', 'Geeta', 'Suman', 'Garima', 'Aparna', 'Monika', 'Komal', 'Deepika', 'Ira',
  'Tanushree', 'Lavanya', 'Prerna', 'Vandana', 'Shruti', 'Meenakshi', 'Archana', 'Nandini', 'Bhumika', 'Chhavi'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Joshi', 'Shah', 'Mehta', 'Nair',
  'Iyer', 'Reddy', 'Banerjee', 'Chatterjee', 'Das', 'Roy', 'Choudhury', 'Mishra', 'Pandey', 'Trivedi',
  'Saxena', 'Kapoor', 'Malhotra', 'Bhatia', 'Chawla', 'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Shinde',
  'Bhattacharya', 'Ghosh', 'Dutta', 'Sengupta', 'Mukherjee', 'Menon', 'Pillai', 'Rao', 'Naidu', 'Gowda',
  'Agarwal', 'Bansal', 'Singhal', 'Kashyap', 'Chopra', 'Dubey', 'Tripathi', 'Goswami', 'Chauhan', 'Rathore'
];

const OCCUPATIONS = [
  'Software Engineer', 'Doctor', 'Chartered Accountant', 'Business Owner', 'Architect',
  'Professor', 'Civil Engineer', 'Bank Manager', 'Government Officer', 'Consultant',
  'Data Scientist', 'Entrepreneur', 'Pharmacist', 'Lawyer', 'Graphic Designer',
  'Financial Analyst', 'Marketing Director', 'Research Scientist', 'HR Executive', 'Supply Chain Lead'
];

const SCHOOLS_DATA = [
  {
    code: 'DIS001',
    name: 'Demo International School',
    city: 'New Delhi',
    email: 'contact@dis-delhi.edu.in',
    phone: '011-28765432',
    address: 'Sector 14, Dwarka, New Delhi - 110075',
    adminEmail: 'admin@demo-school.com',
    adminPhone: '9876543210',
    principalName: 'Dr. Vikram Malhotra',
    principalEmail: 'principal@demo-school.com',
  },
  {
    code: 'SXW002',
    name: "St. Xavier's World School",
    city: 'Mumbai',
    email: 'info@stxaviersmumbai.org',
    phone: '022-26549870',
    address: 'Bandra West, Mumbai, Maharashtra - 400050',
    adminEmail: 'admin@stxaviers.schoolsense.in',
    adminPhone: '9800000002',
    principalName: 'Sr. Margaret D’Souza',
    principalEmail: 'principal@stxaviers.schoolsense.in',
  },
  {
    code: 'GHA003',
    name: 'Greenwood High Academy',
    city: 'Bengaluru',
    email: 'admissions@greenwoodhigh.edu.in',
    phone: '080-45678901',
    address: 'Sarjapur Road, Bengaluru, Karnataka - 560087',
    adminEmail: 'admin@greenwood.schoolsense.in',
    adminPhone: '9800000003',
    principalName: 'Dr. Sundaram Raman',
    principalEmail: 'principal@greenwood.schoolsense.in',
  },
  {
    code: 'NPS004',
    name: 'National Public Model School',
    city: 'Hyderabad',
    email: 'office@npms-hyd.ac.in',
    phone: '040-23456789',
    address: 'Hitec City, Madhapur, Hyderabad, Telangana - 500081',
    adminEmail: 'admin@npms.schoolsense.in',
    adminPhone: '9800000004',
    principalName: 'Mrs. Jayashree Rao',
    principalEmail: 'principal@npms.schoolsense.in',
  },
  {
    code: 'OIS005',
    name: 'Oakridge International School',
    city: 'Kolkata',
    email: 'desk@oakridge-kol.edu.in',
    phone: '033-22894560',
    address: 'Salt Lake Sector V, Kolkata, West Bengal - 700091',
    adminEmail: 'admin@oakridge.schoolsense.in',
    adminPhone: '9800000005',
    principalName: 'Prof. Anirban Mukherjee',
    principalEmail: 'principal@oakridge.schoolsense.in',
  },
];

const STANDARD_CLASSES = [
  { code: 'NURSERY', name: 'Nursery', order: 1 },
  { code: 'LKG', name: 'LKG', order: 2 },
  { code: 'UKG', name: 'UKG', order: 3 },
  { code: 'CLASS_1', name: 'Class 1', order: 4 },
  { code: 'CLASS_2', name: 'Class 2', order: 5 },
  { code: 'CLASS_3', name: 'Class 3', order: 6 },
  { code: 'CLASS_4', name: 'Class 4', order: 7 },
  { code: 'CLASS_5', name: 'Class 5', order: 8 },
  { code: 'CLASS_6', name: 'Class 6', order: 9 },
  { code: 'CLASS_7', name: 'Class 7', order: 10 },
  { code: 'CLASS_8', name: 'Class 8', order: 11 },
  { code: 'CLASS_9', name: 'Class 9', order: 12 },
  { code: 'CLASS_10', name: 'Class 10', order: 13 },
  { code: 'CLASS_11', name: 'Class 11', order: 14 },
  { code: 'CLASS_12', name: 'Class 12', order: 15 },
];

const STANDARD_SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', type: 'ACADEMIC', order: 1 },
  { code: 'SCI', name: 'Science', type: 'ACADEMIC', order: 2 },
  { code: 'ENG', name: 'English Literature & Grammar', type: 'LANGUAGE', order: 3 },
  { code: 'HIN', name: 'Hindi Core', type: 'LANGUAGE', order: 4 },
  { code: 'SST', name: 'Social Studies', type: 'ACADEMIC', order: 5 },
  { code: 'CS', name: 'Computer Science & AI', type: 'ELECTIVE', order: 6 },
  { code: 'PHY', name: 'Physics', type: 'ACADEMIC', order: 7 },
  { code: 'CHEM', name: 'Chemistry', type: 'ACADEMIC', order: 8 },
  { code: 'BIO', name: 'Biology', type: 'ACADEMIC', order: 9 },
  { code: 'PE', name: 'Physical Education & Sports', type: 'ACTIVITY', order: 10 },
  { code: 'ART', name: 'Visual Arts & Craft', type: 'ACTIVITY', order: 11 },
  { code: 'HIST', name: 'History & Civics', type: 'ACADEMIC', order: 12 },
  { code: 'GEO', name: 'Geography & Environment', type: 'ACADEMIC', order: 13 },
  { code: 'ECON', name: 'Economics & Commerce', type: 'ACADEMIC', order: 14 },
  { code: 'MUSIC', name: 'Music & Performing Arts', type: 'ACTIVITY', order: 15 },
];

const TEACHER_PROFILES = [
  { first: 'Rahul', last: 'Sharma', sub: 'MATH', cls: 'CLASS_8', sec: 'A', isClassTeacher: true },
  { first: 'Priyanka', last: 'Verma', sub: 'SCI', cls: 'CLASS_8', sec: 'B', isClassTeacher: true },
  { first: 'Amit', last: 'Gupta', sub: 'ENG', cls: 'CLASS_7', sec: 'A', isClassTeacher: true },
  { first: 'Sunita', last: 'Patel', sub: 'HIN', cls: 'CLASS_6', sec: 'A', isClassTeacher: true },
  { first: 'Rakesh', last: 'Nair', sub: 'SST', cls: 'CLASS_9', sec: 'A', isClassTeacher: true },
  { first: 'Anjali', last: 'Iyer', sub: 'CS', cls: 'CLASS_10', sec: 'A', isClassTeacher: true },
  { first: 'Suresh', last: 'Reddy', sub: 'PHY', cls: 'CLASS_11', sec: 'A', isClassTeacher: true },
  { first: 'Kavita', last: 'Banerjee', sub: 'CHEM', cls: 'CLASS_11', sec: 'B', isClassTeacher: true },
  { first: 'Manish', last: 'Mishra', sub: 'BIO', cls: 'CLASS_12', sec: 'A', isClassTeacher: true },
  { first: 'Deepak', last: 'Kapoor', sub: 'PE', cls: 'CLASS_12', sec: 'B', isClassTeacher: true },
  { first: 'Meenakshi', last: 'Sundaram', sub: 'MATH', cls: 'CLASS_10', sec: 'B', isClassTeacher: true },
  { first: 'Vikram', last: 'Chauhan', sub: 'SCI', cls: 'CLASS_9', sec: 'B', isClassTeacher: true },
  { first: 'Neha', last: 'Malhotra', sub: 'ENG', cls: 'CLASS_5', sec: 'A', isClassTeacher: true },
  { first: 'Pooja', last: 'Bhatia', sub: 'HIN', cls: 'CLASS_4', sec: 'A', isClassTeacher: true },
  { first: 'Arun', last: 'Saxena', sub: 'SST', cls: 'CLASS_3', sec: 'A', isClassTeacher: true },
  { first: 'Garima', last: 'Joshi', sub: 'MATH', cls: 'CLASS_2', sec: 'A', isClassTeacher: true },
  { first: 'Tarun', last: 'Shinde', sub: 'ENG', cls: 'CLASS_1', sec: 'A', isClassTeacher: true },
  { first: 'Shalini', last: 'Deshmukh', sub: 'ART', cls: 'UKG', sec: 'A', isClassTeacher: true },
  { first: 'Ritu', last: 'Kulkarni', sub: 'MUSIC', cls: 'LKG', sec: 'A', isClassTeacher: true },
  { first: 'Bhavna', last: 'Agarwal', sub: 'ENG', cls: 'NURSERY', sec: 'A', isClassTeacher: true },
];

async function upsertUser(
  client: Client,
  data: { email: string; phone: string; passwordHash: string; firstName: string; lastName: string }
): Promise<string> {
  const existing = await client.query(
    'SELECT id FROM identity.users WHERE email = $1 OR (phone IS NOT NULL AND phone = $2) LIMIT 1',
    [data.email, data.phone]
  );
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.query(
      'UPDATE identity.users SET email = $1, phone = $2, password_hash = $3, first_name = $4, last_name = $5, status = $6, deleted_at = NULL WHERE id = $7',
      [data.email, data.phone, data.passwordHash, data.firstName, data.lastName, 'ACTIVE', id]
    );
    return id;
  }
  const insertRes = await client.query(
    'INSERT INTO identity.users (email, phone, password_hash, first_name, last_name, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [data.email, data.phone, data.passwordHash, data.firstName, data.lastName, 'ACTIVE']
  );
  return insertRes.rows[0].id;
}

async function seedLargeDataset() {
  const client = new Client({
    connectionString: 'postgresql://mohdrazakhan@localhost:5432/school_management',
  });

  await client.connect();
  console.log('Connected to PostgreSQL: school_management');

  // Shared demo password hash
  const sharedPasswordHash = await bcrypt.hash('password123', 6);

  // Fetch role IDs
  const rolesRes = await client.query('SELECT id, code FROM identity.roles');
  const roleMap = new Map<string, string>();
  rolesRes.rows.forEach((r: any) => roleMap.set(r.code, r.id));

  const allRecordsForPdf: Array<{
    schoolName: string;
    schoolCode: string;
    city: string;
    principalName: string;
    students: Array<{
      admissionNumber: string;
      rollNumber: number;
      name: string;
      className: string;
      sectionName: string;
      parentName: string;
      parentPhone: string;
      parentEmail: string;
      status: string;
    }>;
    teachers: Array<{
      name: string;
      email: string;
      phone: string;
      assignedSubject: string;
      assignedClass: string;
      isClassTeacher: boolean;
    }>;
    metrics: {
      studentCount: number;
      teacherCount: number;
      classesCount: number;
    };
  }> = [];

  let totalStudentsInserted = 0;
  let totalUsersInserted = 0;

  for (let sIdx = 0; sIdx < SCHOOLS_DATA.length; sIdx++) {
    const sData = SCHOOLS_DATA[sIdx];
    const schoolIndex = sIdx + 1; // 1 to 5
    console.log(`\n========================================`);
    console.log(`Processing School [${schoolIndex}/5]: ${sData.name} (${sData.code})`);
    console.log(`========================================`);

    // 1. Create / Upsert School
    const schoolRes = await client.query(
      `INSERT INTO school.schools (name, code, email, phone, address_line1, city, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, address_line1 = EXCLUDED.address_line1, city = EXCLUDED.city
       RETURNING id;`,
      [sData.name, sData.code, sData.email, sData.phone, sData.address, sData.city]
    );
    const schoolId = schoolRes.rows[0].id;

    // 2. Create Branch
    const branchRes = await client.query(
      `INSERT INTO school.school_branches (school_id, name, code, address_line1, city, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [schoolId, `${sData.city} Main Campus`, 'MAIN', sData.address, sData.city]
    );
    const branchId = branchRes.rows[0].id;

    // 3. Create Academic Year 2026-27
    const ayRes = await client.query(
      `INSERT INTO school.academic_years (school_id, name, start_date, end_date, is_current, status)
       VALUES ($1, '2026-27', '2026-04-01', '2027-03-31', true, 'ACTIVE')
       ON CONFLICT (school_id, name) DO UPDATE SET is_current = true
       RETURNING id;`,
      [schoolId]
    );
    const academicYearId = ayRes.rows[0].id;

    // 4. Create Classes & Sections
    const classMap = new Map<string, { classId: string; sectionAId: string; sectionBId: string }>();

    for (const c of STANDARD_CLASSES) {
      const cRes = await client.query(
        `INSERT INTO school.classes (school_id, name, code, display_order, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order
         RETURNING id;`,
        [schoolId, c.name, c.code, c.order]
      );
      const classId = cRes.rows[0].id;

      // Section A
      const secARes = await client.query(
        `INSERT INTO school.sections (school_id, academic_year_id, branch_id, class_id, name, code, capacity, display_order, status)
         VALUES ($1, $2, $3, $4, 'Section A', 'A', 40, 1, 'ACTIVE')
         ON CONFLICT (branch_id, academic_year_id, class_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [schoolId, academicYearId, branchId, classId]
      );

      // Section B
      const secBRes = await client.query(
        `INSERT INTO school.sections (school_id, academic_year_id, branch_id, class_id, name, code, capacity, display_order, status)
         VALUES ($1, $2, $3, $4, 'Section B', 'B', 40, 2, 'ACTIVE')
         ON CONFLICT (branch_id, academic_year_id, class_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [schoolId, academicYearId, branchId, classId]
      );

      classMap.set(c.code, {
        classId,
        sectionAId: secARes.rows[0].id,
        sectionBId: secBRes.rows[0].id,
      });
    }

    // 5. Create Subjects & Class-Subject Mappings
    const subjectMap = new Map<string, string>();
    for (const sub of STANDARD_SUBJECTS) {
      const subRes = await client.query(
        `INSERT INTO school.subjects (school_id, name, code, subject_type, display_order, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [schoolId, sub.name, sub.code, sub.type, sub.order]
      );
      subjectMap.set(sub.code, subRes.rows[0].id);
    }

    // Map subjects to all classes
    const classSubjectMap = new Map<string, string>();
    for (const [cCode, cInfo] of classMap.entries()) {
      for (const [subCode, subId] of subjectMap.entries()) {
        const csRes = await client.query(
          `INSERT INTO school.class_subjects (academic_year_id, class_id, subject_id, is_optional, display_order, status)
           VALUES ($1, $2, $3, false, 1, 'ACTIVE')
           ON CONFLICT (academic_year_id, class_id, subject_id) DO UPDATE SET status = 'ACTIVE'
           RETURNING id;`,
          [academicYearId, cInfo.classId, subId]
        );
        classSubjectMap.set(`${cCode}_${subCode}`, csRes.rows[0].id);
      }
    }

    // 6. Create Staff: Admin, Principal, Registrar, Fee Manager
    const staffAccounts = [
      { email: sData.adminEmail, name: 'Admin', role: 'SCHOOL_ADMIN', phone: sData.adminPhone },
      { email: sData.principalEmail, name: sData.principalName, role: 'PRINCIPAL', phone: `981100000${schoolIndex}` },
      { email: `registrar@${sData.code.toLowerCase()}.schoolsense.in`, name: 'Registrar Office', role: 'ADMISSION_MANAGER', phone: `982200000${schoolIndex}` },
      { email: `fees@${sData.code.toLowerCase()}.schoolsense.in`, name: 'Fee Desk', role: 'FEE_MANAGER', phone: `983300000${schoolIndex}` },
    ];

    for (const st of staffAccounts) {
      const uId = await upsertUser(client, {
        email: st.email,
        phone: st.phone,
        passwordHash: sharedPasswordHash,
        firstName: st.name,
        lastName: '',
      });
      totalUsersInserted++;

      const roleId = roleMap.get(st.role);
      if (roleId) {
        await client.query(
          `INSERT INTO identity.user_school_roles (user_id, school_id, role_id, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (user_id, school_id, role_id) DO NOTHING;`,
          [uId, schoolId, roleId]
        );
      }
    }

    // 7. Create 20 Teachers per school with Subject & Section Assignments
    const schoolTeachers: Array<{ name: string; email: string; phone: string; assignedSubject: string; assignedClass: string; isClassTeacher: boolean; userId: string }> = [];

    for (let tIdx = 0; tIdx < TEACHER_PROFILES.length; tIdx++) {
      const t = TEACHER_PROFILES[tIdx];
      const tEmail = `teacher_${sData.code.toLowerCase()}_${tIdx + 1}@schoolsense.in`;
      const tPhone = `98440${schoolIndex}00${String(tIdx + 1).padStart(2, '0')}`;

      const tUserId = await upsertUser(client, {
        email: tEmail,
        phone: tPhone,
        passwordHash: sharedPasswordHash,
        firstName: t.first,
        lastName: t.last,
      });
      totalUsersInserted++;

      // Assign TEACHER role
      const tRoleId = roleMap.get('TEACHER');
      if (tRoleId) {
        await client.query(
          `INSERT INTO identity.user_school_roles (user_id, school_id, role_id, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (user_id, school_id, role_id) DO NOTHING;`,
          [tUserId, schoolId, tRoleId]
        );
      }

      // Assign Class Teacher and Subject Teacher
      const classInfo = classMap.get(t.cls);
      const csId = classSubjectMap.get(`${t.cls}_${t.sub}`);
      const secId = t.sec === 'A' ? classInfo?.sectionAId : classInfo?.sectionBId;

      if (secId && csId) {
        await client.query(
          `INSERT INTO school.section_subject_teacher_assignments (
             school_id, academic_year_id, section_id, class_subject_id, user_id, status
           ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
           ON CONFLICT DO NOTHING;`,
          [schoolId, academicYearId, secId, csId, tUserId]
        );

        if (t.isClassTeacher) {
          await client.query(
            `INSERT INTO school.section_teacher_assignments (
               school_id, academic_year_id, section_id, user_id, status
             ) VALUES ($1, $2, $3, $4, 'ACTIVE')
             ON CONFLICT DO NOTHING;`,
            [schoolId, academicYearId, secId, tUserId]
          );
        }
      }

      schoolTeachers.push({
        name: `${t.first} ${t.last}`,
        email: tEmail,
        phone: tPhone,
        assignedSubject: STANDARD_SUBJECTS.find((s) => s.code === t.sub)?.name || t.sub,
        assignedClass: `${STANDARD_CLASSES.find((c) => c.code === t.cls)?.name || t.cls} - Sec ${t.sec}`,
        isClassTeacher: t.isClassTeacher,
        userId: tUserId,
      });
    }

    // 8. Generate 300 Students (20 per class across all 15 classes: Nursery to Class 12)
    // 10 students in Section A, 10 students in Section B per class
    const schoolStudents: Array<{
      id: string;
      admissionNumber: string;
      rollNumber: number;
      name: string;
      className: string;
      sectionName: string;
      parentName: string;
      parentPhone: string;
      parentEmail: string;
      status: string;
    }> = [];

    let studentCounter = 1;

    for (let cIdx = 0; cIdx < STANDARD_CLASSES.length; cIdx++) {
      const cls = STANDARD_CLASSES[cIdx];
      const classInfo = classMap.get(cls.code);
      if (!classInfo) continue;

      const studentsInThisClass = 20; // 10 in Sec A, 10 in Sec B

      for (let sIdx = 1; sIdx <= studentsInThisClass; sIdx++) {
        const isMale = (sIdx + cIdx) % 2 === 0;
        const firstName = isMale
          ? FIRST_NAMES_MALE[(studentCounter * 7) % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[(studentCounter * 11) % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(studentCounter * 13) % LAST_NAMES.length];
        const studentFullName = `${firstName} ${lastName}`;

        const parentFirst = FIRST_NAMES_MALE[(studentCounter * 5) % FIRST_NAMES_MALE.length];
        const parentFullName = `${parentFirst} ${lastName}`;
        const parentEmail = `parent.${sData.code.toLowerCase()}.${studentCounter}@schoolsense.in`;
        const parentPhone = `985${schoolIndex}00${String(studentCounter).padStart(4, '0')}`;

        const admNo = `${sData.code}-2026-${String(studentCounter).padStart(4, '0')}`;
        const isSecA = sIdx <= 10;
        const rollNo = isSecA ? sIdx : sIdx - 10;
        const targetSecId = isSecA ? classInfo.sectionAId : classInfo.sectionBId;
        const targetSecName = isSecA ? 'Section A' : 'Section B';

        // Insert Student
        const stRes = await client.query(
          `INSERT INTO school.students (school_id, admission_number, first_name, last_name, gender, blood_group, status)
           VALUES ($1, $2, $3, $4, $5, 'B+', 'ACTIVE')
           ON CONFLICT (school_id, admission_number) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING id;`,
          [schoolId, admNo, firstName, lastName, isMale ? 'MALE' : 'FEMALE']
        );
        const studentId = stRes.rows[0].id;
        totalStudentsInserted++;

        // Insert Enrollment
        await client.query(
          `INSERT INTO school.student_enrollments (academic_year_id, student_id, section_id, roll_number, status)
           VALUES ($1, $2, $3, $4, 'ACTIVE')
           ON CONFLICT (academic_year_id, student_id) DO UPDATE SET section_id = EXCLUDED.section_id, roll_number = EXCLUDED.roll_number;`,
          [academicYearId, studentId, targetSecId, rollNo]
        );

        // Insert Parent User
        const parentUserId = await upsertUser(client, {
          email: parentEmail,
          phone: parentPhone,
          passwordHash: sharedPasswordHash,
          firstName: parentFirst,
          lastName,
        });
        totalUsersInserted++;

        // Map Parent to school with GUARDIAN role
        const guardianRoleId = roleMap.get('GUARDIAN');
        if (guardianRoleId && parentUserId) {
          await client.query(
            `INSERT INTO identity.user_school_roles (user_id, school_id, role_id, status)
             VALUES ($1, $2, $3, 'ACTIVE')
             ON CONFLICT (user_id, school_id, role_id) DO NOTHING;`,
            [parentUserId, schoolId, guardianRoleId]
          );
        }

        // Create Guardian Record
        const occupation = OCCUPATIONS[studentCounter % OCCUPATIONS.length];
        const gRes = await client.query(
          `INSERT INTO school.guardians (school_id, user_id, first_name, last_name, phone, email, occupation, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
           RETURNING id;`,
          [schoolId, parentUserId, parentFirst, lastName, parentPhone, parentEmail, occupation]
        );
        const guardianId = gRes.rows[0].id;

        // Link Student & Guardian
        await client.query(
          `INSERT INTO school.student_guardians (school_id, student_id, guardian_id, relationship_type, is_primary_contact, is_emergency_contact, can_pickup, status)
           VALUES ($1, $2, $3, 'FATHER', true, true, true, 'ACTIVE')
           ON CONFLICT DO NOTHING;`,
          [schoolId, studentId, guardianId]
        );

        // Insert Past 5-day Attendance
        const attStatuses = ['PRESENT', 'PRESENT', 'PRESENT', studentCounter % 9 === 0 ? 'ABSENT' : studentCounter % 7 === 0 ? 'LATE' : 'PRESENT', 'PRESENT'];
        for (let d = 0; d < 5; d++) {
          await client.query(
            `INSERT INTO school.attendance (school_id, academic_year_id, student_id, section_id, date, status, marked_by)
             VALUES ($1, $2, $3, $4, CURRENT_DATE - ($5 || ' days')::interval, $6, (SELECT id FROM identity.users WHERE email = $7 LIMIT 1))
             ON CONFLICT (student_id, academic_year_id, date) WHERE class_subject_id IS NULL AND deleted_at IS NULL DO UPDATE SET status = EXCLUDED.status;`,
            [schoolId, academicYearId, studentId, targetSecId, d, attStatuses[d], sData.adminEmail]
          );
        }

        schoolStudents.push({
          id: studentId,
          admissionNumber: admNo,
          rollNumber: rollNo,
          name: studentFullName,
          className: cls.name,
          sectionName: targetSecName,
          parentName: parentFullName,
          parentPhone,
          parentEmail,
          status: 'ACTIVE',
        });

        studentCounter++;
      }
    }

    // 9. Create Homework
    for (const t of schoolTeachers.slice(0, 10)) {
      const classCode = t.assignedClass.split(' - ')[0].replace(' ', '_').toUpperCase();
      const isSecA = t.assignedClass.includes('Sec A');
      const classInfo = classMap.get(classCode.startsWith('CLASS') || classCode === 'NURSERY' || classCode === 'LKG' || classCode === 'UKG' ? classCode : `CLASS_${classCode.replace('CLASS_', '')}`);
      const secId = isSecA ? classInfo?.sectionAId : classInfo?.sectionBId;
      const subCode = STANDARD_SUBJECTS.find(s => s.name === t.assignedSubject)?.code || 'MATH';
      const csId = classSubjectMap.get(`${classCode}_${subCode}`);

      if (secId && csId) {
        await client.query(
          `INSERT INTO school.homework (school_id, academic_year_id, section_id, class_subject_id, teacher_id, title, description, assigned_date, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE - 1, CURRENT_DATE + 3, 'PUBLISHED')
           ON CONFLICT DO NOTHING;`,
          [
            schoolId,
            academicYearId,
            secId,
            csId,
            t.userId,
            `${t.assignedSubject}: Chapter Review & Exercises`,
            `Complete exercise sets from Chapter 3 & 4. Submit neat handwritten summaries before the due date.`,
          ]
        );
      }
    }

    // 10. Create Exams, Exam Subjects & Marks
    const examRes = await client.query(
      `INSERT INTO school.exams (school_id, academic_year_id, name, code, start_date, end_date, status)
       VALUES ($1, $2, 'Mid-Term Periodic Assessment 2026', 'MIDTERM_2026', CURRENT_DATE - 20, CURRENT_DATE - 10, 'COMPLETED')
       ON CONFLICT DO NOTHING
       RETURNING id;`,
      [schoolId, academicYearId]
    );
    const examId = examRes.rows[0]?.id || (await client.query('SELECT id FROM school.exams WHERE school_id = $1 AND code = $2', [schoolId, 'MIDTERM_2026'])).rows[0]?.id;

    if (examId) {
      // Add exam subjects for Class 8 Math & Science
      const csMath8 = classSubjectMap.get('CLASS_8_MATH');
      const csSci8 = classSubjectMap.get('CLASS_8_SCI');

      for (const csId of [csMath8, csSci8]) {
        if (!csId) continue;
        const esRes = await client.query(
          `INSERT INTO school.exam_subjects (exam_id, class_subject_id, exam_date, max_marks, passing_marks, status)
           VALUES ($1, $2, CURRENT_DATE - 15, 100, 33, 'ACTIVE')
           ON CONFLICT (exam_id, class_subject_id) DO NOTHING
           RETURNING id;`,
          [examId, csId]
        );
        const examSubjectId = esRes.rows[0]?.id || (await client.query('SELECT id FROM school.exam_subjects WHERE exam_id = $1 AND class_subject_id = $2', [examId, csId])).rows[0]?.id;

        if (examSubjectId) {
          // Grade Class 8 students
          const class8Students = schoolStudents.filter(s => s.className === 'Class 8');
          for (let stIdx = 0; stIdx < class8Students.length; stIdx++) {
            const st = class8Students[stIdx];
            const marks = 65 + ((stIdx * 7) % 32);
            const grade = marks >= 90 ? 'A+' : marks >= 75 ? 'A' : marks >= 60 ? 'B' : 'C';
            await client.query(
              `INSERT INTO school.student_marks (school_id, exam_subject_id, student_id, marks_obtained, is_absent, grade, remarks, entered_by)
               VALUES ($1, $2, $3, $4, false, $5, 'Good consistent performance', (SELECT id FROM identity.users WHERE email = $6 LIMIT 1))
               ON CONFLICT (exam_subject_id, student_id) DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained;`,
              [schoolId, examSubjectId, st.id, marks, grade, sData.adminEmail]
            );
          }
        }
      }
    }

    // 11. Create Notices
    const noticeDefs = [
      {
        title: 'Term 1 Parent-Teacher Meeting (PTM)',
        content: 'Dear Parents & Guardians, the Term 1 PTM is scheduled for this upcoming Saturday from 9:00 AM to 1:30 PM. Please consult your ward’s class teacher schedule.',
        audience: 'ALL',
      },
      {
        title: 'Annual Sports & Athletic Meet 2026',
        content: 'Annual sports tryouts for sprint, relay, football, and badminton will commence next Monday. Students should register with the Physical Education department.',
        audience: 'STUDENTS',
      },
      {
        title: 'National Science & Robotics Olympiad Registrations',
        content: 'Registration is open for Class 4 to Class 12 for the Inter-School Robotics and Science Exhibition.',
        audience: 'ALL',
      },
      {
        title: 'Faculty Workshop on Modern Pedagogical Innovations',
        content: 'All faculty members are invited for a 2-hour interactive training session on interactive digital whiteboards and personalized AI learning.',
        audience: 'TEACHERS',
      },
      {
        title: 'Fee Payment Reminder for Quarter 2',
        content: 'Quarter 2 academic tuition fees can be paid online via the parent portal or at the school fee desk by the 15th of the month.',
        audience: 'PARENTS',
      },
    ];

    for (const n of noticeDefs) {
      await client.query(
        `INSERT INTO school.notices (school_id, academic_year_id, title, content, published_by, target_audience, status)
         VALUES ($1, $2, $3, $4, (SELECT id FROM identity.users WHERE email = $5 LIMIT 1), $6, 'PUBLISHED')
         ON CONFLICT DO NOTHING;`,
        [schoolId, academicYearId, n.title, n.content, sData.adminEmail, n.audience]
      );
    }

    // 12. Create School Events
    await client.query(
      `INSERT INTO school.events (school_id, academic_year_id, title, description, start_time, end_time, location, is_holiday, target_audience, created_by)
       VALUES 
       ($1, $2, 'Independence Day Celebration', 'Flag hoisting ceremony followed by cultural performances.', NOW() + interval '5 days', NOW() + interval '5 days 4 hours', 'Main Auditorium', true, 'ALL', (SELECT id FROM identity.users WHERE email = $3 LIMIT 1)),
       ($1, $2, 'Inter-School Science Fair', 'Exhibition of STEM innovations and science models.', NOW() + interval '12 days', NOW() + interval '12 days 6 hours', 'Science Complex', false, 'ALL', (SELECT id FROM identity.users WHERE email = $3 LIMIT 1))
       ON CONFLICT DO NOTHING;`,
      [schoolId, academicYearId, sData.adminEmail]
    );

    allRecordsForPdf.push({
      schoolName: sData.name,
      schoolCode: sData.code,
      city: sData.city,
      principalName: sData.principalName,
      students: schoolStudents,
      teachers: schoolTeachers,
      metrics: {
        studentCount: schoolStudents.length,
        teacherCount: schoolTeachers.length,
        classesCount: 15,
      },
    });
  }

  await client.end();

  console.log(`\n============================================================`);
  console.log(`DATABASE SEEDING COMPLETE!`);
  console.log(`Total Students Enrolled: ${totalStudentsInserted} (300 per school across 5 schools)`);
  console.log(`Total System Users Created: ${totalUsersInserted}`);
  console.log(`Total Faculty Configured: 100 Teachers (20 per school)`);
  console.log(`Total Schools Configured: ${SCHOOLS_DATA.length}`);
  console.log(`============================================================`);

  // Generate PDF Document
  console.log('\nGenerating Master PDF Testing Dataset Report...');
  const pdfPath = path.join('/Users/mohdrazakhan/Projects/ScholScence', 'SchoolSense_Comprehensive_Testing_Dataset_Report.pdf');
  await generatePdfReport(allRecordsForPdf, pdfPath);
}

function generatePdfReport(schools: any[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const PRIMARY_COLOR = '#1e1b4b';
    const ACCENT_COLOR = '#4338ca';
    const TEXT_DARK = '#0f172a';
    const TEXT_MUTED = '#475569';
    const TABLE_BORDER = '#cbd5e1';

    // Title & Header
    doc.rect(40, 40, 515, 60).fill(PRIMARY_COLOR);
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('SchoolSense™ Enterprise Testing Dataset', 55, 52);
    doc.fontSize(10).font('Helvetica').text('Master Multi-Tenant Database & Student Records Report (5 Schools • 1,500 Students • 100 Faculty)', 55, 76);

    doc.moveDown(4);

    // Executive Summary Box
    doc.rect(40, 115, 515, 70).fill('#f8fafc').stroke(TABLE_BORDER);
    doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold').text('Master Dataset Executive Summary', 55, 125);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED).text(
      `• Total Schools: 5 Institutional Tenants (DIS001, SXW002, GHA003, NPS004, OIS005)\n• Total Active Students: 1,500 Enrolled Pupils (300 per school across all 15 classes)\n• Total Faculty & Staff: 120 Verified Accounts (20 Teachers + Admins per school)\n• Universal Demo Password for all accounts: password123\n• Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`,
      55,
      142
    );

    // Schools Summary Table
    doc.fillColor(TEXT_DARK).fontSize(13).font('Helvetica-Bold').text('1. Multi-Tenant Institutional Directory', 40, 205);

    let y = 225;
    doc.rect(40, y, 515, 20).fill('#e0e7ff');
    doc.fillColor(ACCENT_COLOR).fontSize(9).font('Helvetica-Bold');
    doc.text('Code', 45, y + 5);
    doc.text('School Name', 95, y + 5);
    doc.text('City', 260, y + 5);
    doc.text('Principal', 330, y + 5);
    doc.text('Students', 450, y + 5);
    doc.text('Teachers', 490, y + 5);
    y += 20;

    schools.forEach((s) => {
      doc.rect(40, y, 515, 20).fill(y % 40 === 0 ? '#ffffff' : '#f8fafc').stroke(TABLE_BORDER);
      doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica');
      doc.text(s.schoolCode, 45, y + 5);
      doc.text(s.schoolName, 95, y + 5);
      doc.text(s.city, 260, y + 5);
      doc.text(s.principalName, 330, y + 5);
      doc.text(String(s.metrics.studentCount), 455, y + 5);
      doc.text(String(s.metrics.teacherCount), 495, y + 5);
      y += 20;
    });

    // School-by-school Details
    schools.forEach((s, sIdx) => {
      doc.addPage();

      // School Header Banner
      doc.rect(40, 40, 515, 35).fill(ACCENT_COLOR);
      doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text(`${sIdx + 1}. ${s.schoolName} (${s.schoolCode})`, 50, 48);
      doc.fontSize(9).font('Helvetica').text(`City: ${s.city} | Principal: ${s.principalName} | Enrolled: ${s.students.length} Students | Faculty: ${s.teachers.length}`, 50, 62);

      // Faculty Section
      doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica-Bold').text('Faculty & Teaching Assignments', 40, 85);
      let tY = 100;
      doc.rect(40, tY, 515, 16).fill('#e2e8f0');
      doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold');
      doc.text('Teacher Name', 45, tY + 4);
      doc.text('Email', 150, tY + 4);
      doc.text('Phone', 290, tY + 4);
      doc.text('Subject', 365, tY + 4);
      doc.text('Assigned Class', 455, tY + 4);
      tY += 16;

      s.teachers.forEach((t: any) => {
        if (tY > 760) {
          doc.addPage();
          tY = 40;
          doc.rect(40, tY, 515, 16).fill('#e2e8f0');
          doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold');
          doc.text('Teacher Name', 45, tY + 4);
          doc.text('Email', 150, tY + 4);
          doc.text('Phone', 290, tY + 4);
          doc.text('Subject', 365, tY + 4);
          doc.text('Assigned Class', 455, tY + 4);
          tY += 16;
        }

        doc.rect(40, tY, 515, 15).fill(tY % 30 === 0 ? '#ffffff' : '#f8fafc').stroke(TABLE_BORDER);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');
        doc.text(t.name, 45, tY + 4);
        doc.text(t.email, 150, tY + 4);
        doc.text(t.phone, 290, tY + 4);
        doc.text(t.assignedSubject, 365, tY + 4);
        doc.text(t.assignedClass, 455, tY + 4);
        tY += 15;
      });

      // Student Roster
      tY += 15;
      if (tY > 720) {
        doc.addPage();
        tY = 40;
      }
      doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica-Bold').text(`Student Roster & Parent Contacts (Total ${s.students.length} Pupils)`, 40, tY);
      tY += 15;

      doc.rect(40, tY, 515, 16).fill('#1e1b4b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('Adm No', 45, tY + 4);
      doc.text('Roll', 120, tY + 4);
      doc.text('Student Name', 145, tY + 4);
      doc.text('Class', 240, tY + 4);
      doc.text('Parent Name', 300, tY + 4);
      doc.text('Parent Phone', 395, tY + 4);
      doc.text('Status', 475, tY + 4);
      tY += 16;

      s.students.forEach((st: any, idx: number) => {
        if (tY > 760) {
          doc.addPage();
          tY = 40;
          doc.rect(40, tY, 515, 16).fill('#1e1b4b');
          doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
          doc.text('Adm No', 45, tY + 4);
          doc.text('Roll', 120, tY + 4);
          doc.text('Student Name', 145, tY + 4);
          doc.text('Class', 240, tY + 4);
          doc.text('Parent Name', 300, tY + 4);
          doc.text('Parent Phone', 395, tY + 4);
          doc.text('Status', 475, tY + 4);
          tY += 16;
        }

        doc.rect(40, tY, 515, 14).fill(idx % 2 === 0 ? '#ffffff' : '#f8fafc').stroke(TABLE_BORDER);
        doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica');
        doc.text(st.admissionNumber, 45, tY + 3.5);
        doc.text(String(st.rollNumber), 120, tY + 3.5);
        doc.text(st.name, 145, tY + 3.5);
        doc.text(`${st.className} (${st.sectionName.replace('Section ', '')})`, 240, tY + 3.5);
        doc.text(st.parentName, 300, tY + 3.5);
        doc.text(st.parentPhone, 395, tY + 3.5);
        doc.fillColor('#059669').text(st.status, 475, tY + 3.5);
        tY += 14;
      });
    });

    doc.end();
    stream.on('finish', () => {
      console.log(`✅ PDF successfully generated at: ${outputPath}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

seedLargeDataset().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

