const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const users = await mongoose.connection.db.collection('users').find({ role: { $in: ['admin', 'super_admin'] } }).project({ email: 1, role: 1, name: 1 }).toArray();
  console.log('Admin users in DB:', users);
  process.exit(0);
});
