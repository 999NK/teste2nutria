import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema_sqlite";

// Create SQLite database for development
const sqlite = new Database(':memory:');
export const db = drizzle({ client: sqlite, schema });

// Initialize database tables
console.log('✅ Using SQLite in-memory database for development');

// Create tables
const createTables = () => {
  try {
    // Create tables manually since drizzle push won't work with in-memory
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        google_id TEXT UNIQUE,
        auth_provider TEXT DEFAULT 'local',
        weight REAL,
        height INTEGER,
        age INTEGER,
        activity_level TEXT DEFAULT 'moderate',
        goal TEXT DEFAULT 'maintain',
        daily_calories INTEGER DEFAULT 2000,
        daily_protein INTEGER DEFAULT 120,
        daily_carbs INTEGER DEFAULT 225,
        daily_fat INTEGER DEFAULT 67,
        notifications_enabled INTEGER DEFAULT 1,
        is_profile_complete INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usda_fdc_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        calories_per_100g REAL NOT NULL,
        protein_per_100g REAL NOT NULL,
        carbs_per_100g REAL NOT NULL,
        fat_per_100g REAL NOT NULL,
        fiber_per_100g REAL DEFAULT 0,
        sugar_per_100g REAL DEFAULT 0,
        sodium_per_100g REAL DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id),
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS meal_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        is_default INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        meal_type_id INTEGER NOT NULL REFERENCES meal_types(id),
        date TEXT NOT NULL,
        name TEXT,
        total_calories INTEGER DEFAULT 0,
        total_protein REAL DEFAULT 0,
        total_carbs REAL DEFAULT 0,
        total_fat REAL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS meal_foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id INTEGER NOT NULL REFERENCES meals(id),
        food_id INTEGER NOT NULL REFERENCES foods(id),
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'g',
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        servings INTEGER DEFAULT 1,
        total_calories INTEGER DEFAULT 0,
        total_protein REAL DEFAULT 0,
        total_carbs REAL DEFAULT 0,
        total_fat REAL DEFAULT 0,
        is_favorite INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id),
        food_id INTEGER NOT NULL REFERENCES foods(id),
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'g'
      );
      
      CREATE TABLE IF NOT EXISTS daily_nutrition (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        total_calories INTEGER DEFAULT 0,
        total_protein REAL DEFAULT 0,
        total_carbs REAL DEFAULT 0,
        total_fat REAL DEFAULT 0,
        goal_calories INTEGER,
        goal_protein INTEGER,
        goal_carbs INTEGER,
        goal_fat INTEGER,
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS user_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        daily_calories INTEGER,
        macro_carbs INTEGER,
        macro_protein INTEGER,
        macro_fat INTEGER,
        is_active INTEGER DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS daily_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES user_plans(id),
        date TEXT NOT NULL,
        diet_completed INTEGER DEFAULT 0,
        workout_completed INTEGER DEFAULT 0,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE TABLE IF NOT EXISTS meal_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        meals TEXT,
        daily_calories INTEGER DEFAULT 0,
        macro_carbs INTEGER DEFAULT 0,
        macro_protein INTEGER DEFAULT 0,
        macro_fat INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 0,
        type TEXT DEFAULT 'nutrition',
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);
    
    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
};

createTables();