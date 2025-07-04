CREATE TABLE "daily_nutrition" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"total_calories" integer DEFAULT 0,
	"total_protein" numeric(5, 2) DEFAULT '0',
	"total_carbs" numeric(5, 2) DEFAULT '0',
	"total_fat" numeric(5, 2) DEFAULT '0',
	"goal_calories" integer,
	"goal_protein" integer,
	"goal_carbs" integer,
	"goal_fat" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"date" varchar NOT NULL,
	"diet_completed" boolean DEFAULT false,
	"workout_completed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"usda_fdc_id" integer,
	"name" varchar(255) NOT NULL,
	"brand" varchar(255),
	"category" varchar(255),
	"calories_per_100g" numeric(7, 2) NOT NULL,
	"protein_per_100g" numeric(7, 2) NOT NULL,
	"carbs_per_100g" numeric(7, 2) NOT NULL,
	"fat_per_100g" numeric(7, 2) NOT NULL,
	"fiber_per_100g" numeric(7, 2) DEFAULT '0',
	"sugar_per_100g" numeric(7, 2) DEFAULT '0',
	"sodium_per_100g" numeric(7, 2) DEFAULT '0',
	"is_custom" boolean DEFAULT false,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "foods_usda_fdc_id_unique" UNIQUE("usda_fdc_id")
);
--> statement-breakpoint
CREATE TABLE "meal_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"food_id" integer NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"unit" varchar(20) DEFAULT 'g',
	"calories" numeric(7, 2) NOT NULL,
	"protein" numeric(7, 2) NOT NULL,
	"carbs" numeric(7, 2) NOT NULL,
	"fat" numeric(7, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"meals" jsonb,
	"daily_calories" integer DEFAULT 0,
	"macro_carbs" integer DEFAULT 0,
	"macro_protein" integer DEFAULT 0,
	"macro_fat" integer DEFAULT 0,
	"is_active" boolean DEFAULT false,
	"type" varchar(20) DEFAULT 'nutrition',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meal_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(50),
	"is_default" boolean DEFAULT false,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meal_type_id" integer NOT NULL,
	"date" date NOT NULL,
	"name" varchar(255),
	"total_calories" integer DEFAULT 0,
	"total_protein" numeric(5, 2) DEFAULT '0',
	"total_carbs" numeric(5, 2) DEFAULT '0',
	"total_fat" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"food_id" integer NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"unit" varchar(20) DEFAULT 'g'
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"instructions" text,
	"servings" integer DEFAULT 1,
	"total_calories" integer DEFAULT 0,
	"total_protein" numeric(5, 2) DEFAULT '0',
	"total_carbs" numeric(5, 2) DEFAULT '0',
	"total_fat" numeric(5, 2) DEFAULT '0',
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"type" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"daily_calories" integer,
	"macro_carbs" integer,
	"macro_protein" integer,
	"macro_fat" integer,
	"is_active" boolean DEFAULT false,
	"is_custom" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar NOT NULL,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"google_id" varchar,
	"auth_provider" varchar DEFAULT 'local',
	"weight" numeric(5, 2),
	"height" integer,
	"age" integer,
	"activity_level" varchar DEFAULT 'moderate',
	"goal" varchar DEFAULT 'maintain',
	"daily_calories" integer DEFAULT 2000,
	"daily_protein" integer DEFAULT 120,
	"daily_carbs" integer DEFAULT 225,
	"daily_fat" integer DEFAULT 67,
	"notifications_enabled" boolean DEFAULT true,
	"is_profile_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "daily_nutrition" ADD CONSTRAINT "daily_nutrition_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_plan_id_user_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."user_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_types" ADD CONSTRAINT "meal_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_meal_type_id_meal_types_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");