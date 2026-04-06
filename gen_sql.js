const bcrypt = require('bcryptjs')
async function main() {
  const passwordHash = await bcrypt.hash('IFL@Admin2025!', 12)
  console.log('HASH:', passwordHash)
}
main()
