import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage_temp";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(8).toString("hex"); // Reduced salt size
  const buf = (await scryptAsync(password, salt, 32)) as Buffer; // Reduced key length
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  
  // Try with new format (32 bytes) first
  try {
    const suppliedBuf = (await scryptAsync(supplied, salt, 32)) as Buffer;
    if (hashedBuf.length === suppliedBuf.length) {
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
  } catch (e) {
    // Fall through to old format
  }
  
  // Try with old format (64 bytes) for compatibility
  try {
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    if (hashedBuf.length === suppliedBuf.length) {
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
  } catch (e) {
    // Fall through
  }
  
  return false;
}

export function setupAuth(app: Express) {
  // Session configuration
  // Using memory store from storage_temp for temporary compatibility
  const sessionStore = storage.sessionStore;

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      httpOnly: false, // Allow client access in Replit
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: 'lax',
      domain: undefined, // Let browser handle domain
    },
    name: 'nutria.session',
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !user.password) {
          return done(null, false, { message: "E-mail ou senha incorretos" });
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "E-mail ou senha incorretos" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Google Strategy (optional)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByGoogleId(profile.id);
            
            if (!user) {
              // Check if user exists with same email
              const existingUser = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
              if (existingUser) {
                // Link Google account to existing user
                user = await storage.linkGoogleAccount(existingUser.id, profile.id);
              } else {
                // Create new user
                user = await storage.createUser({
                  email: profile.emails?.[0]?.value || "",
                  firstName: profile.name?.givenName || "",
                  lastName: profile.name?.familyName || "",
                  profileImageUrl: profile.photos?.[0]?.value || "",
                  googleId: profile.id,
                  authProvider: "google",
                });
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(parseInt(id));
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "E-mail, senha e nome são obrigatórios" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já está em uso" });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: "local",
      });

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          isProfileComplete: user.isProfileComplete,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "E-mail ou senha incorretos" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          isProfileComplete: user.isProfileComplete,
        });
      });
    })(req, res, next);
  });

  // Logout endpoint (POST method for frontend compatibility)
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Erro ao destruir sessão" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  // Google auth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }),
    (req, res) => {
      const user = req.user as any;
      if (user && user.isProfileComplete) {
        res.redirect("/");
      } else {
        res.redirect("/profile");
      }
    }
  );

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = req.user;
    res.json({ 
      id: user.id, 
      email: user.email, 
      firstName: user.firstName, 
      lastName: user.lastName,
      isProfileComplete: user.isProfileComplete,
      weight: user.weight,
      height: user.height,
      age: user.age,
      goal: user.goal,
      activityLevel: user.activityLevel,
      dailyCalories: user.dailyCalories,
      dailyProtein: user.dailyProtein,
      dailyCarbs: user.dailyCarbs,
      dailyFat: user.dailyFat,
    });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}