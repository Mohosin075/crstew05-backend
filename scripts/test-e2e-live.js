const axios = require('axios');

async function testFullFlow() {
  const base = 'http://localhost:5004/api/v1';
  let adminToken = '';
  let orgToken = '';
  let coachToken = '';
  let coachId = '';
  let recruiterId = '';
  let oppId = '';
  let candId = '';
  let shortlistId = '';
  let chatId = '';
  let verifId = '';

  console.log('--- RUNNING FULL E2E AUTOMATION TEST ---');

  // Step 1: Admin Login
  const adminRes = await axios.post(`${base}/auth/admin-login`, {
    email: 'admin@thecoachprofile.com',
    password: 'adminpassword123'
  });
  adminToken = adminRes.data.data.accessToken;
  console.log('✅ Step 1 Admin Login OK');

  // Step 2: Org Login
  const orgRes = await axios.post(`${base}/auth/login`, {
    email: 'recruiter@texasathletics.edu',
    password: 'Password123!'
  });
  orgToken = orgRes.data.data.accessToken;
  recruiterId = orgRes.data.data.user._id;
  console.log('✅ Step 2 Org Login OK');

  // Step 3: Coach Login
  const coachRes = await axios.post(`${base}/auth/login`, {
    email: 'marcus.vance@tcpcoach.com',
    password: 'Password123!'
  });
  coachToken = coachRes.data.data.accessToken;
  coachId = coachRes.data.data.user._id;
  console.log('✅ Step 3 Coach Login OK');

  // Step 4: Org Creates Opportunity
  const oppRes = await axios.post(`${base}/opportunities`, {
    title: `Offensive Coordinator - Run Test ${Date.now()}`,
    position: 'Offensive Coordinator',
    level: 'FBS',
    type: 'full_time',
    location: 'Austin, TX',
    isRemote: false,
    description: 'Championship offensive coordinator opening.',
    requirements: ['5+ years college experience'],
    status: 'active'
  }, { headers: { Authorization: `Bearer ${orgToken}` } });
  oppId = oppRes.data.data._id || oppRes.data.data.id;
  console.log('✅ Step 4 Org Creates Opportunity OK, oppId =', oppId);

  // Step 5: Coach Expresses Interest
  const expRes = await axios.post(`${base}/candidates/express-interest`, {
    opportunityId: oppId,
    sharedFields: { shareContactInfo: true },
    message: 'I am ready to lead the team!'
  }, { headers: { Authorization: `Bearer ${coachToken}` } });
  candId = expRes.data.data.candidateId || expRes.data.data._id;
  console.log('✅ Step 5 Coach Expresses Interest OK, candId =', candId);

  // Step 6: Org Views Pipeline Board
  const pipeRes = await axios.get(`${base}/candidates/pipeline?opportunityId=${oppId}`, {
    headers: { Authorization: `Bearer ${orgToken}` }
  });
  console.log('✅ Step 6 Pipeline Board OK');

  // Step 7: Org Moves Candidate to 'interview'
  const stageRes = await axios.patch(`${base}/candidates/${candId}/stage`, {
    stage: 'interview'
  }, { headers: { Authorization: `Bearer ${orgToken}` } });
  console.log('✅ Step 7 Candidate Stage Updated OK');

  // Step 8: Org Rates Candidate (5 Stars)
  const rateRes = await axios.patch(`${base}/candidates/${candId}/rating`, {
    rating: 5
  }, { headers: { Authorization: `Bearer ${orgToken}` } });
  console.log('✅ Step 8 Candidate Rated OK');

  // Step 9: Org Adds Candidate Note
  const noteRes = await axios.post(`${base}/candidates/${candId}/notes`, {
    content: 'Interview completed with flying colors.'
  }, { headers: { Authorization: `Bearer ${orgToken}` } });
  console.log('✅ Step 9 Note Added OK');

  // Step 10: Org Creates Shortlist
  const slRes = await axios.post(`${base}/shortlists`, {
    name: `Shortlist ${Date.now()}`
  }, { headers: { Authorization: `Bearer ${orgToken}` } });
  shortlistId = slRes.data.data._id || slRes.data.data.id;
  console.log('✅ Step 10 Shortlist Created OK, shortlistId =', shortlistId);

  // Step 11: Add Coach to Shortlist
  const addCoachRes = await axios.post(`${base}/shortlists/${shortlistId}/coaches/${coachId}`, {}, {
    headers: { Authorization: `Bearer ${orgToken}` }
  });
  console.log('✅ Step 11 Coach Added to Shortlist OK');

  // Step 12: Org Opens Chat with Coach
  const chatRes = await axios.post(`${base}/chat/${coachId}`, {}, {
    headers: { Authorization: `Bearer ${orgToken}` }
  });
  chatId = chatRes.data.data._id;
  console.log('✅ Step 12 Chat Created OK, chatId =', chatId);

  // Step 13: Org Sends Direct Message
  const msgRes = await axios.post(`${base}/message`, {
    chatId: chatId,
    message: 'Welcome to the team!'
  }, { headers: { Authorization: `Bearer ${orgToken}` } });
  console.log('✅ Step 13 Message Sent OK');

  // Step 14: Coach Submits Identity Verification
  const verifRes = await axios.post(`${base}/verifications/submit`, {
    entityId: coachId,
    entityType: 'coach_identity',
    entityName: 'Marcus Vance',
    documents: [{ name: 'ID.pdf', url: 'https://tcp.com/id.pdf', mimeType: 'application/pdf' }]
  }, { headers: { Authorization: `Bearer ${coachToken}` } });
  verifId = verifRes.data.data._id || verifRes.data.data.id;
  console.log('✅ Step 14 Verification Submitted OK (Status 201), verifId =', verifId);

  // Step 15: Admin Approves Verification
  const appRes = await axios.patch(`${base}/verifications/${verifId}/approve`, {
    note: 'Approved'
  }, { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log('✅ Step 15 Verification Approved OK');

  console.log('\n🎉 ALL 15 STEPS OF THE FLOW PASSED 100%!');
}

testFullFlow().catch(e => {
  console.error('Flow failed at:', e.config ? `${e.config.method.toUpperCase()} ${e.config.url}` : e.message);
  console.error(e.response ? e.response.data : e);
});
