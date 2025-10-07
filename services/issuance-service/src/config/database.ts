import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DB_PATH || './data/credentials.db';
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info(`Created data directory: ${dataDir}`);
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error connecting to database:', err);
          reject(err);
        } else {
          logger.info(`Connected to SQLite database at ${this.dbPath}`);
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async initializeTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS credentials (
          id TEXT PRIMARY KEY,
          holder_name TEXT NOT NULL,
          issuer TEXT NOT NULL,
          issued_date TEXT NOT NULL,
          credential_type TEXT NOT NULL,
          expiry_date TEXT NOT NULL,
          signature TEXT NOT NULL,
          worker_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `;

      this.db.run(createTableQuery, (err) => {
        if (err) {
          logger.error('Error creating credentials table:', err);
          reject(err);
        } else {
          logger.info('Credentials table initialized successfully');
          resolve();
        }
      });
    });
  }

  async run(query: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          this.db = null;
          resolve();
        }
      });
    });
  }

  isConnected(): boolean {
    return this.db !== null;
  }
}

export const database = new Database();
