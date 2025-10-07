// src/db/db.ts
import SQLite from 'react-native-sqlite-storage';

// 성능/로그 설정(원하면 끄기 가능)
SQLite.enablePromise(true);

export async function getDB() {
  const db = await SQLite.openDatabase({ name: 'app.db', location: 'default' });
  await init(db);
  return db;
}

async function init(db: SQLite.SQLiteDatabase) {
  await db.executeSql('PRAGMA foreign_keys = ON;');

  // 피드 테이블
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  // 이미지 테이블
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS feed_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      ord INTEGER DEFAULT 0,
      FOREIGN KEY(feed_id) REFERENCES feeds(id) ON DELETE CASCADE
    );
  `);
}
