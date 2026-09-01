# Documentation Structure & Style Guide

## Table of Contents
1. [Document Structure](#document-structure)
2. [Feature Documentation Template](#feature-documentation-template)
3. [Writing Style Guidelines](#writing-style-guidelines)
4. [Update Mode](#update-mode)

---

## Document Structure

Generate or update `documentation/PROJECT_GUIDE.md` with these sections:

### 1. Project Overview
- Purpose
- Scope
- Key capabilities

### 2. Tech Stack
- Languages
- Frameworks
- Tools

### 3. Architecture Overview
- High-level explanation
- Folder structure summary

### 4. Database Design
- Database type
- Entities
- Relationships

### 5. Feature Documentation

For each feature:

#### Feature Name
**Description:** Short explanation

**Why it exists:** Business or user value

**Key Components:** Files, modules, services

**Flow:** Step-by-step explanation

**Notes for Developers:** Important implementation details

### 6. Development Workflow
- How features interact
- Common patterns used
- Important conventions

### 7. Glossary (Optional)
Define domain terms if detected

---

## Writing Style Guidelines

- Use simple and direct explanations
- Prefer bullet points over long paragraphs
- Avoid jargon without explanation
- Explain "why", not only "what"
- Keep sections scannable
- Assume reader is a new developer

---

## Update Mode

When `documentation/PROJECT_GUIDE.md` already exists:

1. Detect changes in: features, tech stack, structure, database
2. Update only impacted sections
3. Preserve any manual notes
4. Add a short "Last Updated Changes" summary at the top
