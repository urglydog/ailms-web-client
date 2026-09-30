const http = require('http');
const req = http.request('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'}
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).accessToken;
    // Now request study-plan
    const req2 = http.request('http://localhost:8080/api/v1/student/courses/9/study-plan/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log("Status:", res2.statusCode);
        console.log("Response:", data2);
      });
    });
    req2.write(JSON.stringify({ targetDate: "2026-10-23", hoursPerWeek: 14 }));
    req2.end();
  });
});
req.write(JSON.stringify({email: 'student@example.com', password: 'password'}));
req.end();
