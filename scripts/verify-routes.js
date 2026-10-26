const fs = require('fs');
const path = require('path');

const routeFiles = [
  { prefix: '/auth', file: 'src/app/modules/auth/auth.route.ts' },
  { prefix: '/users', file: 'src/app/modules/user/user.route.ts' },
  { prefix: '/organizations', file: 'src/app/modules/organization/organization.route.ts' },
  { prefix: '/opportunities', file: 'src/app/modules/opportunity/opportunity.route.ts' },
  { prefix: '/candidates', file: 'src/app/modules/candidate/candidate.route.ts' },
  { prefix: '/shortlists', file: 'src/app/modules/shortlist/shortlist.route.ts' },
  { prefix: '/verifications', file: 'src/app/modules/verification/verification.route.ts' },
  { prefix: '/analytics', file: 'src/app/modules/analytics/analytics.route.ts' },
  { prefix: '/subscriptions', file: 'src/app/modules/subscription/subscription.route.ts' },
  { prefix: '/message', file: 'src/app/modules/message/message.routes.ts' },
  { prefix: '/chat', file: 'src/app/modules/chat/chat.routes.ts' },
  { prefix: '/support', file: 'src/app/modules/support/support.route.ts' },
  { prefix: '/location', file: 'src/app/modules/location/location.route.ts' },
  { prefix: '/public', file: 'src/app/modules/public/public.route.ts' }
];

const extracted = [];
routeFiles.forEach(rf => {
  let content = fs.readFileSync(rf.file, 'utf8');
  // Strip block comments and line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  content = content.replace(/\/\/.*/g, '');

  // Match router.get/post/patch/delete/put('path' or "\path"
  const regex = /router\s*\.\s*(get|post|patch|delete|put)\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const subPath = m[2];
    const full = (rf.prefix + (subPath === '/' ? '' : (subPath.startsWith('/') ? subPath : '/' + subPath))).replace(/\/+/g, '/');
    extracted.push({ method, path: full, file: rf.file });
  }

  // Also match router.route('path').get(...).delete(...)...
  const routeRegex = /router\s*\.\s*route\s*\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?=router\s*\.|\n\s*export|\Z)/g;
  let r;
  while ((r = routeRegex.exec(content)) !== null) {
    const subPath = r[1];
    const block = r[2];
    const methods = ['get', 'post', 'patch', 'delete', 'put'];
    methods.forEach(method => {
      const re = new RegExp('\\.\\s*' + method + '\\s*\\(', 'g');
      if (re.test(block)) {
        const full = (rf.prefix + (subPath === '/' ? '' : (subPath.startsWith('/') ? subPath : '/' + subPath))).replace(/\/+/g, '/');
        extracted.push({ method: method.toUpperCase(), path: full, file: rf.file });
      }
    });
  }
});

console.log('Total routes found across all 14 route files:', extracted.length);

// Read postman collection
const coll = JSON.parse(fs.readFileSync('The_Coach_Profile_API.postman_collection.json', 'utf8'));
const postmanEndpoints = [];
function walk(items) {
  items.forEach(it => {
    if (it.request) {
      let raw = it.request.url.raw;
      raw = raw.replace('{{base_url}}/api/v1', '').split('?')[0];
      postmanEndpoints.push({ method: it.request.method, path: raw, name: it.name });
    }
    if (it.item) walk(it.item);
  });
}
walk(coll.item);

console.log('Total Postman requests:', postmanEndpoints.length);

// Compare
const missing = [];
extracted.forEach(ex => {
  const normEx = ex.path.replace(/:[a-zA-Z0-9_]+/g, ':param');
  const found = postmanEndpoints.some(pe => {
    const normPe = pe.path.replace(/:[a-zA-Z0-9_]+/g, ':param');
    return pe.method === ex.method && normPe === normEx;
  });
  if (!found) {
    missing.push(ex);
  }
});

console.log('\n--- Missing Routes Check ---');
if (missing.length === 0) {
  console.log('🎉 100% Coverage! All routes exist in Postman collection.');
} else {
  console.log(`Found ${missing.length} missing route(s):`);
  missing.forEach(m => console.log(`- ${m.method} ${m.path} (${m.file})`));
}
