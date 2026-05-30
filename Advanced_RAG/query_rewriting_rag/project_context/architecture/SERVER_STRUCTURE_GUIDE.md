# Backend Project Structure Guide

## 1. Objective

This guide defines how to structure a NestJS backend so it is:

- easy to navigate
- safe to scale
- consistent across developers
- production-ready from day one

It follows a **NestJS + Drizzle ORM + Zod** architecture with clear separation of concerns.

---

## 2. Recommended Folder Structure

    server/
    ├── src/
    │   ├── api/
    │   │   └── v1/
    │   │       └── <domain>/
    │   │           ├── dto/
    │   │           │   ├── create-<domain>.dto.ts
    │   │           │   └── update-<domain>.dto.ts
    │   │           ├── <domain>.controller.ts
    │   │           ├── <domain>.module.ts
    │   │           ├── <domain>.repository.ts
    │   │           └── <domain>.service.ts
    │   ├── common/
    │   │   ├── filters/
    │   │   ├── helpers/
    │   │   ├── interceptors/
    │   │   ├── pipes/
    │   │   └── validators/
    │   ├── config/
    │   │   ├── app.config.ts
    │   │   ├── database.config.ts
    │   │   ├── jwt.config.ts
    │   │   └── redis.config.ts
    │   ├── database/
    │   │   ├── migrations/
    │   │   ├── schemas/
    │   │   │   ├── <domain>.schema.ts
    │   │   │   └── index.ts
    │   │   └── seed.ts
    │   ├── guard/
    │   │   ├── auth/
    │   │   └── decorators/
    │   ├── health/
    │   ├── queues/
    │   │   └── <domain>/
    │   │       ├── <domain>.processor.ts
    │   │       └── <domain>.queue.module.ts
    │   ├── services/
    │   │   └── database/
    │   ├── types/
    │   ├── app.controller.ts
    │   ├── app.module.ts
    │   ├── app.service.ts
    │   └── main.ts
    ├── test/
    ├── uploads/
    ├── drizzle.config.ts
    ├── package.json
    └── tsconfig.json

---

## 3. Folder Purpose

### src/api/v1/
- Versioned HTTP API surface — all route handlers live here
- Group by domain (e.g., `auth/`, `users/`, `documents/`)
- Each domain contains: `module`, `controller`, `service`, `repository`, and `dto/`
- Add new API versions as `v2/`, `v3/` without touching existing versions

### src/common/
- Shared backend utilities used across multiple domains — **no domain-specific logic here**
- `filters/` — global exception filters (e.g., `HttpExceptionFilter`)
- `helpers/` — pure utility functions (date formatting, string transforms, etc.)
- `interceptors/` — response transformation, logging, timing
- `pipes/` — validation and request transformation (e.g., `ZodValidationPipe`)
- `validators/` — custom class validators, env validation

### src/config/
- **Never access `process.env` directly in application code** — use typed config services
- One config file per concern: `app.config.ts`, `database.config.ts`, `jwt.config.ts`, `redis.config.ts`
- All environment parsing, type casting, and defaults live here

### src/database/
- `schemas/` — one Drizzle schema file per domain table, aggregated in `index.ts`
- `migrations/` — auto-generated Drizzle migration files (do not edit manually)
- `seed.ts` — database seed script for local development and staging

### src/guard/
- Authentication and authorization logic
- `auth/` — JWT guards, session guards
- `decorators/` — custom decorators like `@Public()`, `@Roles()`, `@CurrentUser()`

### src/health/
- Health check endpoints for infrastructure dependencies
- Examples: database connectivity, Redis ping, external service availability

### src/queues/
- BullMQ queue definitions, processors, and job handlers
- One subfolder per domain queue
- `<domain>.processor.ts` — job handler logic
- `<domain>.queue.module.ts` — queue module registration

### src/services/
- Shared infrastructure services reused across multiple domains
- Examples: `DatabaseService` (Drizzle instance), `RedisService`, `MailService`
- Do **not** put domain-specific business logic here

### src/types/
- Shared TypeScript `interface`, `type`, and `enum` definitions used server-wide
- File naming: `<domain>.types.ts`

### test/
- e2e and integration tests

### uploads/
- User-uploaded files stored by the backend
- Must be added to `.gitignore` and served with proper access control

---

## 4. Layering Rules

Each domain follows a strict 4-layer pattern:

Request → Controller → Service → Repository → Database


- **Controller layer**
  - Receives and validates the HTTP request
  - Calls the service, returns a standardized response
  - No business logic — only routing and input/output shaping
  - Owns Swagger decorators

- **Service layer**
  - Contains all business logic
  - Coordinates operations across repositories and other services
  - Throws typed NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, etc.)
  - No direct database queries

- **Repository layer**
  - All Drizzle ORM queries live here — **no raw SQL or queries in services**
  - Multi-step writes must use `db.transaction()`
  - One repository per domain

- **Common layer**
  - No domain-specific logic
  - Only reusable helpers, pipes, filters, and interceptors

---

## 5. API Response Standard

Every endpoint must return one consistent shape.

**Success:**

    {
      "success": true,
      "message": "Data retrieved successfully",
      "data": []
    }

**Error:**

    {
      "success": false,
      "message": "Validation failed",
      "data": null
    }

**HTTP status code conventions:**

| Code | When to use |
|---|---|
| 200 | Successful read, update, or delete |
| 201 | Successful create |
| 400 | Malformed request format |
| 401 | Unauthenticated (missing or invalid token) |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate email) |
| 422 | Validation failure (e.g., missing required field) |
| 500 | Unhandled server error |

---

## 6. Example Files

### Example A: Module file
Path: `src/api/v1/auth/auth.module.ts`

    import { Module } from "@nestjs/common";
    import { AuthController } from "./auth.controller";
    import { AuthService } from "./auth.service";
    import { AuthRepository } from "./auth.repository";

    @Module({
      controllers: [AuthController],
      providers: [AuthService, AuthRepository],
      exports: [AuthService],
    })
    export class AuthModule {}

### Example B: DTO schema with Zod
Path: `src/api/v1/auth/dto/login.dto.ts`

    import { z } from "zod";

    export const loginSchema = z.object({
      email: z.email(),
      password: z.string().min(8),
    });

    export type LoginDto = z.infer<typeof loginSchema>;

### Example C: Controller with Swagger
Path: `src/api/v1/auth/auth.controller.ts`

    import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
    import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
    import { AuthService } from "./auth.service";
    import { loginSchema, LoginDto } from "./dto/login.dto";
    import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
    import { Public } from "../../../guard/decorators/public.decorator";

    @ApiTags("Auth")
    @Controller({ path: "auth", version: "1" })
    export class AuthController {
      constructor(private readonly authService: AuthService) {}

      @Public()
      @Post("login")
      @HttpCode(HttpStatus.OK)
      @ApiOperation({ summary: "Authenticate a user and return a JWT" })
      @ApiResponse({ status: 200, description: "Login successful" })
      @ApiResponse({ status: 401, description: "Invalid credentials" })
      @ApiResponse({ status: 422, description: "Validation error" })
      async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
        const data = await this.authService.login(dto);
        return { success: true, message: "Login successful", data };
      }
    }

### Example D: Service file
Path: `src/api/v1/auth/auth.service.ts`

    import { Injectable, UnauthorizedException } from "@nestjs/common";
    import { AuthRepository } from "./auth.repository";
    import type { LoginDto } from "./dto/login.dto";

    @Injectable()
    export class AuthService {
      constructor(private readonly authRepository: AuthRepository) {}

      async login(dto: LoginDto) {
        const user = await this.authRepository.findByEmail(dto.email);
        if (!user) {
          throw new UnauthorizedException("Invalid credentials");
        }

        const passwordMatch = await this.verifyPassword(dto.password, user.passwordHash);
        if (!passwordMatch) {
          throw new UnauthorizedException("Invalid credentials");
        }

        return { token: this.generateToken(user), user: { id: user.id, email: user.email } };
      }

      private async verifyPassword(plain: string, hash: string): Promise<boolean> {
        // use bcrypt in production
        return plain.length > 0 && hash.length > 0;
      }

      private generateToken(user: { id: string }): string {
        // use JwtService in production
        return `token-for-${user.id}`;
      }
    }

### Example E: Repository file
Path: `src/api/v1/auth/auth.repository.ts`

    import { Injectable } from "@nestjs/common";
    import { DatabaseService } from "../../../services/database/database.service";
    import { users } from "../../../database/schemas";
    import { eq } from "drizzle-orm";

    @Injectable()
    export class AuthRepository {
      constructor(private readonly db: DatabaseService) {}

      async findByEmail(email: string) {
        const result = await this.db.instance.select().from(users).where(eq(users.email, email));
        return result[0] ?? null;
      }
    }

### Example F: Transaction pattern for multi-step writes

    await db.instance.transaction(async (tx) => {
      const [conversation] = await tx.insert(conversations).values(newConversation).returning();
      await tx.insert(messages).values({ ...userMessage, conversationId: conversation.id });
      await tx.insert(messages).values({ ...assistantMessage, conversationId: conversation.id });
    });

### Example G: Database schema
Path: `src/database/schemas/users.schema.ts`

    import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

    export const users = pgTable("users", {
      id: uuid("id").primaryKey().defaultRandom(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      passwordHash: varchar("password_hash", { length: 255 }).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
    });

---

## 7. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Module | `<domain>.module.ts` | `auth.module.ts` |
| Controller | `<domain>.controller.ts` | `auth.controller.ts` |
| Service | `<domain>.service.ts` | `auth.service.ts` |
| Repository | `<domain>.repository.ts` | `auth.repository.ts` |
| DTO | `<action>-<domain>.dto.ts` | `create-user.dto.ts` |
| Schema | `<domain>.schema.ts` | `users.schema.ts` |
| Types | `<domain>.types.ts` | `auth.types.ts` |
| Config | `<concern>.config.ts` | `jwt.config.ts` |
| Queue processor | `<domain>.processor.ts` | `email.processor.ts` |

---

## 8. Checklist for New Features

Before marking a feature done, verify:

- [ ] Domain folder created under `api/v1/` with module, controller, service, repository, and dto files
- [ ] Zod validation schema defined for every input
- [ ] Standardized `{ success, message, data }` response shape returned from all endpoints
- [ ] All endpoints documented with `@ApiTags`, `@ApiOperation`, and `@ApiResponse` for every possible status code
- [ ] Authentication/authorization guard applied where needed
- [ ] `db.transaction()` used for any multi-step write operation
- [ ] Logger used instead of `console.log` for all logging
- [ ] No `process.env` access outside of `src/config/`
- [ ] New database table schema added to `src/database/schemas/` and exported from `index.ts`

---
