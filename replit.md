# NutrIA - Nutrition Tracking Application

## Project Overview
A comprehensive nutrition tracking mobile application called "NutrIA" for Brazilian users, featuring enhanced USDA food database integration with Portuguese-to-English translation, manual meal tracking with Brazilian units, automatic nutrient goal calculation, 5AM-5AM nutritional day cycle, React Native mobile functionality for iOS and Android deployment, AI-powered recipe generation capabilities, personalized recipe recommendations based on nutrition goals, and chatbot interface for enhanced user interaction.

## User Preferences
- Language: Portuguese (Brazilian)
- Communication: Direct and solution-focused
- Interface: Mobile-first design with intuitive navigation
- Features: AI-powered nutrition assistance and recipe generation
- Platform: React Native for iOS and Android deployment

## Recent Changes
**2025-07-04 20:10** 
- ✓ Conversão completa da aplicação web para React Native
- ✓ Estrutura completa de telas React Native criada:
  - SplashScreen, LoginScreen, RegisterScreen com autenticação
  - DashboardScreen com resumo nutricional e progresso diário
  - MealsScreen para registro de refeições
  - ProgressScreen com gráficos semanais e estatísticas
  - MyPlanScreen para visualização de planos ativos e histórico
  - AIAssistantScreen com chat personalizado e geração de planos
  - ProfileScreen com configurações e metas do usuário
  - OnboardingScreen com fluxo de configuração inicial
- ✓ Contextos React Native implementados (AuthContext, ThemeContext)
- ✓ Serviço de API adaptado para React Native com fetch
- ✓ Navegação entre telas configurada no App.tsx
- ✓ Design responsivo e tema escuro/claro mantidos
- ✓ Backend Express mantido inalterado para compatibilidade
- ✓ Arquitetura híbrida: React Native frontend + Express backend
**2025-07-04 19:55**
- ✓ Migração completa e bem-sucedida do Replit Agent para ambiente Replit
- ✓ Aplicação NutrIA rodando estável na porta 5000 com Vite + Express
- ✓ Banco de dados SQLite configurado temporariamente para desenvolvimento
- ✓ Sistema de autenticação funcionando com MemoryStore para sessões
- ✓ Todas as dependências instaladas e configuradas corretamente
- ✓ Storage temporário implementado com interface completa para desenvolvimento
- ✓ Frontend conectando corretamente ao backend via API
- ✓ Projeto pronto para desenvolvimento futuro e migração para PostgreSQL

**2025-07-04 19:24**
- ✓ Corrigido problema de logout - agora redireciona corretamente para tela de login
- ✓ Implementado endpoint POST /api/logout com destruição completa de sessão
- ✓ Corrigidos problemas de compatibilidade de hash de senhas (suporte a formatos antigos e novos)
- ✓ Todas as 28 referências de claims.sub corrigidas para usar req.user.id diretamente  
- ✓ Performance otimizada - React Query com staleTime de 5min e gcTime de 10min
- ✓ Sistema de logout funcional em Profile e Sidebar com limpeza de cache
- ✓ Correção dos endpoints de salvamento de perfil no onboarding
- ✓ Aplicação com navegação fluida e carregamentos otimizados

**2025-07-04 18:46**
- ✓ Migração completa do Replit Agent para ambiente Replit
- ✓ Configuração do banco de dados PostgreSQL com todas as tabelas criadas
- ✓ Configuração de credenciais de API (GEMINI_API_KEY, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- ✓ Correção dos endpoints de autenticação - registro manual funcionando corretamente
- ✓ Configuração do Google OAuth com URLs de redirecionamento corretas
- ✓ Aplicação rodando sem erros na porta 5000
- ✓ Testes de autenticação confirmados - registro e login Google funcionais

**2025-07-02 19:23**
- ✓ Fixed workout navigation button to switch fichas directly in dashboard card (A → B → C → A)
- ✓ Removed navigation to MyPlan page - now changes workout display in-place
- ✓ Enhanced "Próxima Refeição" to show complete nutritional values (calories, protein, carbs)
- ✓ Removed generic daily goals from next meal section - now focuses on specific meal data
- ✓ Improved fallback messages for when meal data is unavailable
- ✓ Added state management for current workout index to persist user's selection

**2025-07-02 19:15**
- ✓ Fixed AI responses to stay strictly relevant to the specific question asked
- ✓ Implemented content filtering to remove generic advice unrelated to the topic
- ✓ Enhanced prompt to avoid disconnected information like "observe urine" for water questions
- ✓ Reduced token limit to 200 to prevent tangential or off-topic responses
- ✓ Added intelligent paragraph filtering to skip irrelevant advice sections
- ✓ AI now maintains laser focus on the exact question without adding unrelated tips

**2025-07-02 05:30**
- ✓ Implemented personalized AI chat responses based on user profile characteristics
- ✓ AI now considers weight, height, age, goals, activity level, and nutrition targets in all responses
- ✓ Enhanced system prompt to provide specific advice tailored to individual user profiles
- ✓ Added comprehensive user context to every chat interaction (not just plan generation)
- ✓ AI responses now automatically personalized without requiring user to repeat their information

**2025-07-02 05:29**
- ✓ Enhanced AI chat to provide detailed, informative responses divided into multiple messages
- ✓ Fixed Gemini API JSON structure errors with proper content validation
- ✓ Improved text splitting algorithm - responses now 80-140 characters for better readability
- ✓ Updated AI system prompt to be more educational and comprehensive while avoiding symbols
- ✓ Increased maxOutputTokens to 800 for more complete nutritional guidance
- ✓ Corrected TypeScript errors by adjusting response types to support string arrays

**2025-07-02 05:03**
- ✓ Fixed nutrition cronogram to show proper weekdays (Segunda-feira, Terça-feira, etc.)
- ✓ Expanded fallback nutrition plan to include all 7 days of the week
- ✓ Reorganized nutrition layout - kcal and protein values now appear as badges below
- ✓ Enhanced nutrition prompt with strict requirements for exact macro targets
- ✓ Added time fields to all meal entries (07:00, 12:00, 15:00, 19:00)
- ✓ Corrected meal keys from "snack" to "lanche" throughout the system

**2025-07-02 04:50**
- ✓ Fixed layout alignment in plan cards (nutrition and workout)
- ✓ Reduced button sizes for better proportions (h-8, px-3, text-xs)
- ✓ Corrected icon sizing in export buttons (w-3 h-3)
- ✓ Updated AI nutrition generation with personalized Nutritionist prompt
- ✓ Enhanced nutrition AI with professional dietary expertise and structured format
- ✓ Improved vertical alignment using items-start in card headers

**2025-07-02 04:35**
- ✓ Enhanced workout cronogram UX with horizontal scrolling cards (swipe left/right)
- ✓ Fixed theme compatibility - workout cards now follow app's dark/light mode
- ✓ Restored missing plan history with dedicated "Histórico" tab
- ✓ Added navigation controls for browsing through plan history
- ✓ Implemented activate/export actions for historical plans
- ✓ Updated AI workout generation with personalized Personal Trainer prompt
- ✓ Enhanced prompt to use professional fitness expertise and structured format
- ✓ Improved responsive design for workout cards display

**2025-07-02 04:30**
- ✓ Fixed cronograma de treino display issue in MyPlan page
- ✓ Corrected data access from `activeWorkoutPlan.workouts` to `activeWorkoutPlan.meals`
- ✓ Implemented table-style workout display matching user's reference design
- ✓ Added dark slate theme for workout cards with proper contrast
- ✓ Fixed JSX syntax errors and component structure
- ✓ Enhanced workout visualization with exercise name and sets/reps columns
- ✓ Restored full functionality of workout cronogram with ABC/ABCD/ABCDE structure

**2025-07-02 04:00**
- ✓ Restructured workout plan generation to use ABC/ABCD/ABCDE format
- ✓ Added specific exercise details with sets, reps, rest periods, and techniques
- ✓ Enhanced workout cronogram display with individual exercise cards
- ✓ Improved UX with structured ficha visualization (Treino A, B, C)
- ✓ Fixed workout plan structure to show actual exercises instead of generic descriptions
- ✓ Updated AI service fallback to include detailed exercise specifications
- ✓ Optimized MyPlan.tsx to display workout sessions with proper exercise breakdown

**2025-07-02 03:45**
- ✓ Fixed AI Chat initialization to show all intro messages immediately
- ✓ Removed delayed message sequence that was causing incomplete display
- ✓ Repositioned suggestion buttons to appear after intro messages in chat area
- ✓ Fixed suggested questions disappearing correctly when user interacts
- ✓ Improved AI Chat UX with proper message flow and suggestions placement

**2025-07-02 03:40**
- ✓ Removed floating + button from mobile pages (no longer needed for food addition)
- ✓ Fixed chat input overlapping content in AI Chat page
- ✓ Simplified Dashboard "Hoje no seu Plano" card - removed "Seu plano atual" section
- ✓ Changed "Nutrição de Hoje" to "Dieta do Dia" throughout Dashboard
- ✓ Enhanced workout display to show specific exercises (e.g., "Treino A - Push")
- ✓ Added exercise details with sets/reps (e.g., "Supino reto 4x8-12")
- ✓ Implemented workout navigation showing next session (A > B > C > A)
- ✓ Replaced generic workout descriptions with structured exercise lists

**2025-07-02 03:30**
- ✓ Fixed AI Chat page header to use standard NutrIA layout
- ✓ Removed custom dark header that appeared incorrectly in light mode  
- ✓ Added proper page title "Assistente Nutricional" in desktop header
- ✓ Integrated AI Chat page with standard Layout component
- ✓ Fixed responsive design consistency across all pages
- ✓ Maintained chat functionality while using proper UI patterns

**2025-07-01 23:30**
- ✓ Added meal times to nutrition schedules (07:00, 12:00, 15:00, 19:00)
- ✓ Replaced "snack" with "Lanche" throughout the system
- ✓ Implemented chronological meal ordering by time in schedules
- ✓ Enhanced meal display with time badges showing when to eat
- ✓ Updated AI meal plan generation to include time fields
- ✓ Fixed fallback meal plans to use "lanche" instead of "snack"

**2025-07-01 22:10**
- ✓ Fixed light mode in Progress page (daily progress card now works correctly)
- ✓ Added specific daily chart showing user progress throughout hours
- ✓ Simplified progress page by removing excessive tabs (weekly and monthly)
- ✓ Implemented proper colors for light and dark mode in all elements
- ✓ Replaced complex pie chart with simple goal summary
- ✓ Fixed specific food display in nutrition schedule (e.g., "pão, 2 fatias de mussarela")

**2025-07-01 22:05**
- ✓ Configured AI meal plan generation to match exact user nutritional goals
- ✓ Implemented intelligent goal extraction from user profile (calories, protein, carbs, fat)
- ✓ Enhanced meal plan prompts to respect daily targets (e.g., 2796 kcal, 175g protein)
- ✓ Updated fallback meal plans to use user-specific nutritional requirements
- ✓ Added proportional meal distribution (25% breakfast, 35% lunch, 15% snack, 25% dinner)
- ✓ Ensured both AI-generated and fallback plans maintain nutritional accuracy

**2025-07-01 22:00**
- ✓ Redesigned nutrition cronograma with detailed meal specifications (Monday-Sunday)
- ✓ Added individual nutritional values per meal (calories, protein, carbs, fat)
- ✓ Enhanced workout cronograma with comprehensive exercise details
- ✓ Displayed specific exercise specifications: series count, repetitions, rest periods
- ✓ Structured meal display: meal type header → food description → nutritional values
- ✓ Improved visual hierarchy with color-coded nutritional metrics and exercise parameters

**2025-07-01 21:50**
- ✓ Enhanced nutrition plan details with calories per meal and ingredient lists
- ✓ Improved workout plan display with sets, reps, rest periods, and exercise descriptions
- ✓ Added muscle group tags and technique instructions for workout exercises
- ✓ Created detailed visual layout for both nutrition and workout plan chronograms
- ✓ Fixed MyPlan.tsx runtime error by updating to multiple active plans system
- ✓ Implemented comprehensive plan visualization with expandable sections

**2025-07-01 20:10**
- ✓ Fixed AI chat plan creation logic - now correctly distinguishes workout vs nutrition plans
- ✓ Implemented intelligent keyword detection for automatic plan generation via chat
- ✓ Added auto-generation of workout plans when user mentions exercise/training keywords
- ✓ Fixed issue where workout requests were creating meal plans instead of workout plans
- ✓ Enhanced chat AI with contextual plan creation and user feedback messages
- ✓ Improved regex patterns for detecting plan creation intent in natural conversation

**2025-07-01 19:45**
- ✓ Fixed AI meal plan generation JSON parsing errors with robust error handling
- ✓ Implemented fallback meal plan structure when AI response is malformed
- ✓ Added comprehensive JSON cleaning and brace matching for AI responses
- ✓ Enhanced logging for debugging AI service JSON parsing issues
- ✓ Corrected TypeScript errors in Dashboard component for active plan display
- ✓ Created detailed workout plans with exercises, sets, and repetitions in fallback structure

**2025-07-01 19:35**
- ✓ Implemented proper PDF generation with PDFKit (replaced corrupted PDF issue)
- ✓ Added detailed workout schedules with sets, reps, and exercise descriptions in PDF export
- ✓ Fixed Dashboard "Hoje no seu Plano" to show active plan data dynamically
- ✓ Improved history cards UX with larger size (max-w-2xl instead of max-w-md)
- ✓ Integrated active plan data into Dashboard with nutrition goals display
- ✓ Added fallback state for users without active plans with "Criar Meu Plano" button
- ✓ Enhanced plan information display with creation date and description preview
- ✓ Fixed plan activation queries and navigation between sections

**2025-07-01 19:20**
- ✓ Fixed PDF export endpoint (was failing with "Plan not found" errors)
- ✓ Reordered Dashboard cards: Progresso Diário now appears first, Hoje no seu Plano second
- ✓ Fixed dark mode persistence issue with daily progress card colors
- ✓ Implemented single horizontal plan navigation in history with arrow controls
- ✓ Changed activation endpoint from PATCH to POST method (matching frontend calls)
- ✓ Removed all scrollbars globally from the application (CSS modification)
- ✓ Enhanced plan history with centered card display and navigation counter
- ✓ Fixed duplicate daily progress card display issue
- ✓ Improved responsive design for plan history navigation

**2025-07-01 18:50**
- ✓ Completely restructured "Meu Plano" page with separate cards for nutrition and workout plans
- ✓ Fixed active plan detection logic (was using wrong data source)
- ✓ Added proper activate/reactivate functionality for inactive plans in history
- ✓ Improved plan history layout with better positioning on desktop
- ✓ Added dropdown menus with "Ativar Plano" and "Exportar PDF" options
- ✓ Created expandable sections for plan details (nutrition schedules and workout routines)
- ✓ Added daily progress section to Dashboard showing today's workout and next meal
- ✓ Enhanced plan cards with macro summaries and visual status indicators

**2025-06-30 22:30**
- ✓ Implemented smart plan cards with unified nutrition and workout views
- ✓ Added visual progress indicators with streak tracking and achievement badges
- ✓ Enhanced feedback system with completion percentages and daily goals
- ✓ Created interactive weekly calendars for meal and workout scheduling
- ✓ Fixed Bottom Navigation label error ("Progresso3" → "Progresso")
- ✓ Removed unnecessary force update intervals for improved performance
- ✓ Added visual status indicators (Active/Inactive) with color-coded borders
- ✓ Implemented responsive design for plan cards across all devices

**2025-06-30 21:45**
- ✓ Fixed notification duplicates with per-day per-user scheduling system
- ✓ Optimized React Query caching (5min staleTime, no window refocus)
- ✓ Added loading skeleton states for better UX
- ✓ Enhanced sidebar navigation with active page indicators and hover effects
- ✓ Improved floating action button with scale animations
- ✓ Corrected responsive breakpoints for consistent tablet experience
- ✓ Optimized Progress page queries (removed excessive refetch intervals)
- ✓ Enhanced dark mode contrast for better accessibility
- ✓ Performance improvements across all major components

**2025-06-30 06:40**
- ✓ Made app fully responsive for tablet screens (640px-1023px)
- ✓ Tablets now use desktop layout with sidebar instead of mobile layout
- ✓ Created specific input positioning for tablets in AI Chat
- ✓ Adjusted breakpoints: mobile (<640px), tablet (640px-1023px), desktop (≥1024px)
- ✓ Headers and spacing optimized for all screen sizes

**2025-06-30 06:19**
- ✓ Resolved Babel parser syntax error causing app startup failure
- ✓ Fixed server startup issues - application now running successfully on port 5000
- ✓ All API endpoints responding correctly with proper authentication
- ✓ Database connections stable and daily notifications working

**Previous Updates**
- ✓ Fixed React child rendering error in workout plans (object with keys {name, reps, rest, sets})
- ✓ Implemented proper type checking for exercise objects vs strings in workout display
- ✓ Corrected desktop sidebar to fill full vertical height with proper flex layout structure
- ✓ Enhanced full-height layout with container flex structure and tab content optimization
- ✓ Added exercise details display (reps, sets, duration) for comprehensive workout info
- ✓ Fixed "Meu Plano" page errors with proper authentication handling and error boundaries
- ✓ Replaced half-donut chart with green circular progress ring matching user's reference image
- ✓ Implemented exact Dashboard macronutrient visualization (7840 kcal display style)
- ✓ Added dark theme card background with white text for nutrition progress
- ✓ Enhanced horizontal progress bars for protein, carbohydrates, and fat with proper colors
- ✓ Completely redesigned "Meu Plano" page with professional UX design for desktop and mobile
- ✓ Implemented responsive 3-column grid layout (XL screens) with sidebar progress tracking

## Recent Debug Fixes
**2025-06-28 02:45**
- ✓ Fixed duplicate notification scheduling (was triggering multiple times per session)
- ✓ Optimized React Query caching to reduce unnecessary API calls
- ✓ Added session-based notification scheduling to prevent duplicates
- ✓ Implemented proper staleTime and refetch controls for auth queries
- ✓ Corrected TypeScript errors in Dashboard component
- ✓ Aggressive cache clearing implementation

**Current Status**:
- ✓ Server running correctly on port 5000
- ✓ API calls optimized with proper caching
- ✓ Notification scheduling fixed (single execution per session)
- ✓ Navigation fully functional with robot icon
- ✓ All TypeScript errors resolved
- ✓ AI Chat greeting responses fixed (no more medical disclaimers for "boa tarde")
- ✓ Gemini API integration implemented (replaced automatic responses with real AI)
- ✓ Fixed model endpoint to use gemini-1.5-flash (working model)
- ✓ Corrected chat message duplication issue (single message display)
- ✓ Implemented chat memory system to maintain conversation context
- ✓ Added user-specific chat history storage (last 20 messages)
- ✓ Restructured bot introduction into 6 separate sequential messages
- ✓ Implemented exact message flow: intro → common questions header → 3 questions → call to action