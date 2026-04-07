const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'contacts.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Contacts table — migrate if schema is outdated
const contactCols = db.prepare('PRAGMA table_info(contacts)').all();
const colNames = contactCols.map(c => c.name);
const hasUserId = colNames.includes('user_id');
const hasFirstName = colNames.includes('first_name');

if (!hasUserId || !hasFirstName) {
  db.exec('DROP TABLE IF EXISTS contacts');
  db.exec(`
    CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      company TEXT,
      role TEXT,
      where_met TEXT,
      met_date TEXT,
      contact_method TEXT NOT NULL,
      contact_value TEXT NOT NULL,
      contact_method_2 TEXT,
      contact_value_2 TEXT,
      categories TEXT DEFAULT '[]',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
} else {
  if (!colNames.includes('contact_method_2')) db.exec(`ALTER TABLE contacts ADD COLUMN contact_method_2 TEXT`);
  if (!colNames.includes('contact_value_2'))  db.exec(`ALTER TABLE contacts ADD COLUMN contact_value_2 TEXT`);
  if (!colNames.includes('categories')) {
    db.exec(`ALTER TABLE contacts ADD COLUMN categories TEXT DEFAULT '[]'`);
    const rows = db.prepare(`SELECT id, category FROM contacts WHERE category IS NOT NULL AND category != ''`).all();
    const update = db.prepare(`UPDATE contacts SET categories = ? WHERE id = ?`);
    for (const row of rows) update.run(JSON.stringify([row.category]), row.id);
  }
}

// Touchpoints table
db.exec(`
  CREATE TABLE IF NOT EXISTS touchpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note TEXT,
    touched_at TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

module.exports = db;
