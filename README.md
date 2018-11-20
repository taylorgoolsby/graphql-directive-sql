# graphql-directive-sql

Unify your SQL schema and your GraphQL Schema. Use GraphQL SDL as the lingua franca to define your data requirements.

Given a GraphQL schema defined in SDL, this function will output a schema script which, when ran on your database, will create all the tables in your database.

Some advantages to using GraphQL SDL to unify your data structures:
* Commit the SDL to your repo to track schema changes in one place to aid in migrations.
* Keep your GraphQL types synchronized with your database tables for less cognitive load.
* Generate static typing so your frontend can stay synced with schema for quicker refactoring. (WIP)
* Use with [jest-environment-mysql](https://github.com/taylorgoolsby/jest-environment-mysql) to keep your tests synced with schema for peace of mind. (Example is WIP)

## Example

`node generate-sql.js`
```
// generate-sql.js
import {
  makeSqlSchema,
  getSchemaDirectives,
  directiveDeclaration
} from 'graphql-to-sql'

const typeDefs = `
  ${directiveDeclaration}

  type User @sql(unicode: true) {
    userId: String @sql(type: "BINARY(16)", primary: true)
    databaseOnlyField: Int @sql(hide: true)
    graphqlOnlyField: String
    uniqueColumn: Int @sql(unique: true)
    posts: [Post]
  }

  type Post @sql(unicode: true) {
    postId: Int @sql(primary: true, auto: true)
    userId: String @sql(type: "BINARY(16)", index: true)
    content: String @sql(type: "VARCHAR(300)", unicode: true, nullable: true)
    likes: Int @sql
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`

const outputFilepath = 'schemaScript.sql'
const directives = getSchemaDirectives()
makeSqlSchema({
  typeDefs,
  schemaDirectives: directives,
  outputFilepath,
  databaseName: 'dbname',
  tablePrefix: 'test_',
})
```
The script above will produce this file:
```
-- schemaScript.sql
CREATE TABLE `dbname`.test_User (
  `userId` BINARY(16) NOT NULL,
  `uniqueColumn` INT NOT NULL UNIQUE,
  PRIMARY KEY (`userId`)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dbname`.test_Post (
  `postId` INT NOT NULL AUTO_INCREMENT,
  `userId` BINARY(16) NOT NULL,
  `content` VARCHAR(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `likes` INT NOT NULL,
  `dateCreated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`postId`),
  INDEX `USERIDINDEX` (`userId` ASC)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Also see [main-test.ts](__tests__/main-test.ts) for a working example.

## Arguments for `@sql()`:
ON OBJECT:
* unicode

ON FIELD_DEFINITION:
* auto
* default
* ~~hide~~ (todo)
* index
* nullable
* primary
* type
* unicode
* unique

## SQL Features Supported<sup>1</sup>:
- [x] Auto Increment
- [x] Default
- [x] Index
- [x] Not Null
- [x] Primary Key
- [x] Unicode
- [x] Unique
- [ ] Check
- [ ] Constraints
- [ ] Foreign Key
- [ ] Generated Columns

<sup>1</sup>Only MySQL is supported at the moment.