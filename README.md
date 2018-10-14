# WIP

# graphql-to-sql

Treat your SQL schema as a subset of your GraphQL Schema. Use GraphQL SDL as the lingua franca to define your data requirements.

Given a GraphQL schema defined in SDL, this function will output a `.sql` file which, when ran on your database, will create all the tables in your database.

## Example

`node generate-sql.js`
```
// generate-sql.js
import {makeSqlSchemaScript, getSchemaDirectives} from 'graphql-to-sql'

const typeDefs = `
  type User @sql(options: "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci") {
    userId: String @sql(type: "BINARY(16)", primary: true)
    databaseOnlyField: Int @sql(hide: true)
    graphqlOnlyField: String
    uniqueColumn: Int @sql(unique: true)
    posts: [Post]
  }

  type Post @sql(unicode: true) {
    postId: Int @sql(primary: true, auto: true)
    userId: String @sql(type: "BINARY(16)", index: true)
    content: String @sql(length: 240, unicode: true, nullable: true)
    likes: Int @sql
    dateCreated: Date @sql(default: CURRENT_TIMESTAMP)
  }
`

makeSqlSchemaScript({
  typeDefs,
  schemaDirectives: {
    ...getSchemaDirectives({directiveName: 'sql'})
  },
  outputFilepath: 'createTablesScript.sql'
})
```
Also see [main-test.ts](__tests__/main-test.ts) for a working example.

## Arguments for `@sql()`:
ON OBJECT:
* options
* unicode

ON FIELD_DEFINITION:
* auto
* default
* hide
* index
* length
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
- [x] Table Options (see [table_options](https://dev.mysql.com/doc/refman/8.0/en/create-table.html))
- [x] Unicode
- [x] Unique
- [ ] Check
- [ ] Constraints
- [ ] Foreign Key
- [ ] Generated Columns

<sup>1</sup>Only MySQL is supported at the moment.