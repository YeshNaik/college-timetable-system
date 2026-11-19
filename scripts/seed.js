#!/usr/bin/env node
// Seed script for College Timetable System
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function extractStatements(fileSql) {
  if (fileSql.includes('DELIMITER')) {
    const stmts = [];
    const lines = fileSql.split('\n');
    let currentDelimiter = ';';
    let currentStmt = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('--') && currentStmt.trim().length === 0) continue;

      if (/^DELIMITER\s+/i.test(trimmed)) {
        currentDelimiter = trimmed.replace(/^DELIMITER\s+/i, '').trim();
        continue;
      }

      currentStmt += line + '\n';
      if (currentDelimiter !== ';' && trimmed.endsWith(currentDelimiter)) {
        const clean = currentStmt.trim().slice(0, -currentDelimiter.length).trim();
        if (clean) stmts.push(clean);
        currentStmt = '';
      } else if (currentDelimiter === ';' && trimmed.endsWith(';')) {
        const clean = currentStmt.trim().slice(0, -1).trim();
        if (clean) stmts.push(clean);
        currentStmt = '';
      }
    }
    if (currentStmt.trim()) {
      stmts.push(currentStmt.trim());
    }
    return stmts;
  } else {
    return fileSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
  }
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_timetable_db',
    multipleStatements: true
  });

  try {
    console.log('Connected to database');
    
    // Execute SQL files in order
    const sqlFiles = [
      '01_create_database.sql',
      '02_sample_data.sql',
      '03_more_sample_data.sql',
      '04_timetable_leaves_subs.sql',
      '05_views.sql',
      '06_procedures.sql',
      '07_more_procedures.sql',
      '08_triggers.sql',
      '09_events.sql',
      '10_auto_generation.sql',
      '11_auto_generation_part2.sql',
      '12_auto_generation_sample_data.sql',
      '13_auto_generation_sample_data2.sql'
    ];
    
    for (const fileName of sqlFiles) {
      const filePath = path.join(__dirname, '../database', fileName);
      if (fs.existsSync(filePath)) {
        const fileSql = fs.readFileSync(filePath, 'utf8');
        console.log(`Executing ${fileName}...`);
        
        const statements = extractStatements(fileSql);
        for (const stmt of statements) {
          if (stmt) {
            await connection.query(stmt);
          }
        }
      }
    }
    
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
