const bcrypt = require('bcryptjs');

const passwords = [
    { user: 'CIT2022001', pass: 'student123' },
    { user: 'FAC001', pass: 'teacher123' },
    { user: 'MNT001', pass: 'mentor123' },
    { user: 'HOD001', pass: 'hod123' },
    { user: 'PRN001', pass: 'principal123' },
    { user: 'CHR001', pass: 'chairman123' },
];

passwords.forEach(async ({ user, pass }) => {
    const hash = await bcrypt.hash(pass, 10);
    console.log(`${user}: "${hash}"`);
});