require('dotenv').config();
const supabase = require('./lib/supabase');
const bcrypt = require('bcryptjs');

async function createAdmin(name, email, password) {
  try {
    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role: 'admin'
      });

    if (error) {
      if (error.code === '23505') throw new Error("An account with this email already exists.");
      throw error;
    }

    console.log(`\n🎉 Admin account created successfully!`);
    console.log(`Name:  ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role:  Admin\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Failed to create admin: ${err.message}\n`);
    process.exit(1);
  }
}

// Get arguments from the terminal command
const args = process.argv.slice(2);

if (args.length !== 3) {
  console.log('\n⚠️  Usage Instructions:');
  console.log('Run this command in the terminal to create an admin:');
  console.log('node createAdmin.js "First Last" "email@address.com" "yourPassword123"\n');
  process.exit(1);
}

createAdmin(args[0], args[1], args[2]);
