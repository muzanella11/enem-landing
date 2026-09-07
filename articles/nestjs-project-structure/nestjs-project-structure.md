---
title: "How to Structure a NestJS Project with TypeScript"
slug: "nestjs-project-structure"
excerpt: "A practical guide to organizing a NestJS project by feature module, with a clear controller-service-repository flow, DTOs, and where configuration and shared code should actually live."
metaTitle: "NestJS Project Structure: A Practical TypeScript Guide"
metaDescription: "Learn how to structure a NestJS project with feature modules, controllers, services, repositories, and DTOs, plus common structural mistakes and when to reach for a monorepo."
categories:
  - "Node.js"
tags:
  - "NestJS"
  - "TypeScript"
  - "Backend Architecture"
keywords:
  - "nestjs project structure"
  - "nestjs typescript architecture"
  - "nestjs feature module pattern"
  - "nestjs controller service repository"
  - "nestjs folder structure best practices"
featuredImage: "./images/hero.png"
imageAlt: "Diagram of a NestJS request lifecycle: DTO and pipes validate the request, the controller routes it to a service containing business logic, which calls a repository that queries the database"
status: "draft"
author: "Nurfirliana Muzanella"
date: "2026-09-07"
---

# How to Structure a NestJS Project with TypeScript

A NestJS project that starts as one `AppModule` with everything crammed into a single `AppController` and `AppService` works fine for a demo. It stops working the moment a second developer joins, or the app grows past a handful of endpoints: changes to unrelated features start touching the same files, and it's no longer obvious where a new piece of logic should live. NestJS ships with strong architectural opinions baked into its module system; the problem is usually that projects don't lean into them early enough.

This article covers how to organize a NestJS project by feature, the reasoning behind the controller-service-repository split NestJS nudges you toward, and where things like configuration, guards, and shared utilities should actually live.

## Structure by Feature, Not by Layer

The instinct many developers bring from other frameworks is to organize by technical layer: a top-level `controllers/` folder, a top-level `services/` folder, a top-level `dto/` folder. NestJS's module system is built around the opposite idea: organize by **feature**, with each feature owning its own controller, service, DTOs, and entity, grouped together.

```text
src/
├── app.module.ts
├── main.ts
├── config/
│   └── configuration.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── guards/
│       └── jwt-auth.guard.ts
└── common/
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── logging.interceptor.ts
    └── decorators/
        └── current-user.decorator.ts
```

The payoff of this layout shows up as the project grows: a change to how users are created touches files inside `users/` and rarely anything else. A new developer working on the `auth` feature doesn't need to understand `users/` internals to make progress: only the parts of `UsersModule` it explicitly exports. Layer-first organization tends to erode this boundary over time, because nothing stops a "services" folder from accumulating fifteen unrelated services with no clear ownership.

## The Controller-Service-Repository Flow

Within a feature module, NestJS's conventions map cleanly onto a single responsibility each:

```typescript
// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    return this.usersRepository.create(dto);
  }
}
```

```typescript
// users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  create(dto: CreateUserDto) {
    return this.repo.save(this.repo.create(dto));
  }
}
```

**The controller's only job is translating HTTP into a method call.** It shouldn't contain business rules: no "check if email exists," no conditional logic beyond what's needed to extract and pass along request data. If you find yourself writing an `if` statement in a controller that isn't about the HTTP layer itself (status codes, headers), it usually belongs in the service instead.

**The service holds business logic and orchestration.** This is where "email must be unique," "only an admin can do this," and "send a welcome email after creating a user" live. It doesn't know about HTTP at all (no `@Req()`, no status codes), which is exactly what makes it straightforward to unit test in isolation.

**The repository is the only layer that knows about the database.** Query logic, TypeORM-specific `where` clauses, and join details live here. This separation means swapping an ORM method or restructuring a query touches one file, not every place the data is used, and it makes mocking the data layer in service-level tests trivial.

This split doesn't mean every project needs a dedicated repository class for every entity: for a small feature, calling `@InjectRepository` directly inside the service is a reasonable simplification. It becomes worth the extra layer once queries get complex enough that mixing them into business logic makes the service hard to read, or once you want to unit-test business logic without a database in the loop.

## Validating Input With DTOs and Pipes

DTOs (Data Transfer Objects) define the shape of incoming data, and paired with `class-validator` decorators plus Nest's built-in `ValidationPipe`, they reject malformed requests before a controller method body ever runs:

```typescript
// dto/create-user.dto.ts
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
```

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // strip properties not defined in the DTO
    forbidNonWhitelisted: true, // reject requests containing extra properties
    transform: true,        // convert plain objects into DTO class instances
  }),
);
```

`whitelist: true` matters more than it looks: without it, a request body can carry extra fields straight through into whatever the controller does next, including fields an attacker might add to try to influence internal logic that wasn't meant to be client-controlled (a classic case being an unexpected `role` or `isAdmin` field slipping into a create-user payload).

## Where Configuration and Shared Code Belong

A `config/` module handles environment-driven settings, validated once at startup rather than read ad hoc across the codebase: see [Node.js Environment Variables](../nodejs-environment-variables/nodejs-environment-variables.md) for the validation approach this pairs with. A `common/` directory holds genuinely cross-cutting code: exception filters, interceptors, decorators, and guards used by more than one feature module. The distinction to hold onto is that `common/` is for things with no feature-specific meaning: a logging interceptor doesn't care whether it's wrapping `UsersController` or `OrdersController`. The moment something starts accumulating feature-specific conditionals to be "reusable," it's a sign it should move back into the feature module it actually belongs to.

## Common Mistakes

**Putting business logic in the controller.** It's a subtle trap because Nest's decorators make controllers feel like the natural place to write "just a little logic", but that logic becomes untestable without spinning up HTTP, and it can't be reused if another part of the app needs the same operation.

**One giant `AppModule` instead of feature modules.** This is the most common structural issue in projects that grew from a starter template without revisiting structure. Every new feature added to `AppModule` directly makes the whole application harder to reason about and prevents Nest's module boundaries (and later, lazy loading or micro-service splitting) from doing anything useful.

**Circular dependencies between feature modules.** If `UsersModule` imports `OrdersModule` and `OrdersModule` imports `UsersModule`, Nest can resolve it with `forwardRef()`, but it's usually a sign the two modules are sharing something that should be extracted into a third, shared module instead of depending on each other directly.

**Skipping DTOs for "simple" endpoints.** An endpoint that accepts a raw untyped object today is the one that silently accepts an unexpected field tomorrow. DTOs are cheap to write and are the main enforcement point for what a request is actually allowed to contain.

## Best Practices Checklist

- Organize by feature module, not by technical layer.
- Keep controllers thin: HTTP translation only, no business rules.
- Push business logic into services; push query logic into repositories once queries get non-trivial.
- Validate every request body with a DTO and `class-validator`, with `whitelist: true` enabled globally.
- Reserve `common/` for code with no feature-specific meaning.
- Resolve circular module dependencies by extracting shared logic, not by defaulting to `forwardRef()`.

## FAQ

**Do I need a repository class for every entity?**
No: it's a judgment call based on query complexity, not a rule to apply uniformly. Simple CRUD with straightforward queries can call `@InjectRepository` directly in the service; a repository class earns its place once query logic grows complex enough to want its own tests, or once you want the service layer testable without touching the database.

**Should DTOs and entities ever be the same class?**
No. An entity describes what's stored in the database; a DTO describes what a specific request is allowed to contain. Conflating them tends to leak internal fields (like a password hash or internal flags) into responses, or lets clients set fields they shouldn't be able to touch.

**When does a NestJS project need a monorepo instead of one app?**
Once you have genuinely independent deployables that share code (a public API and an internal admin API, for instance) sharing libraries through a monorepo tool avoids duplicating DTOs and utilities across repositories. For a single deployable service, a well-organized feature-module structure inside one app is usually enough, and reaching for a monorepo earlier than that mostly adds tooling overhead without a matching benefit.

## Conclusion

NestJS's opinions about modules, controllers, and providers aren't decoration: they're the mechanism that keeps a growing codebase navigable. Organizing by feature instead of by layer, keeping the controller-service-repository responsibilities distinct, and validating input at the boundary with DTOs covers most of what makes a NestJS project pleasant to work in six months after it was started, not just on day one.

## References

- [NestJS documentation: Modules](https://docs.nestjs.com/modules)
- [NestJS documentation: Providers](https://docs.nestjs.com/providers)
- [NestJS documentation: Validation](https://docs.nestjs.com/techniques/validation)
- [TypeORM documentation: Working with repository](https://typeorm.io/working-with-repository)
