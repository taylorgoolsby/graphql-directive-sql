# graphql-directive-sql

Unify your SQL schema and your GraphQL Schema. Use GraphQL SDL as the lingua franca to define your data requirements.

Given a GraphQL schema defined in SDL, this function will output a schema script which, when ran on your database, will create all the tables in your database.

## Example

`node generate-sql.js`
```
// generate-sql.js
import gql from 'graphql-tag'
import {
  makeSqlSchema,
  getSchemaDirectives
} from 'graphql-to-sql'

const typeDefs = gql`
  directive @sql (
    unicode: Boolean
    constraints: String
    auto: Boolean
    default: String
    index: Boolean
    nullable: Boolean
    primary: Boolean
    type: String
    unique: Boolean
  ) on OBJECT | FIELD_DEFINITION

  # See graphql-directive-private
  directive @private on OBJECT | FIELD_DEFINITION

  type User @sql(unicode: true) {
    userId: String @sql(type: "BINARY(16)", primary: true)
    uniqueColumn: Int @sql(unique: true)
    databaseOnlyField: Int @sql @private
    
    graphqlOnlyField: String
    posts: [Post]
  }

  type Post {
    postId: Int @sql(primary: true, auto: true)
    userId: String @sql(type: "BINARY(16)", index: true)
    content: String @sql(type: "VARCHAR(300)", unicode: true, nullable: true)
    likes: Int @sql
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
  
  type UserPair @sql(constraints: "UNIQUE(parentUserId, childUserId),\\n  FOREIGN KEY (parentUserId) REFERENCES User(userId)") {
    userPairId: String @sql(type: "BINARY(16)", primary: true)
    parentUserId: String @sql(type: "BINARY(16)", index: true)
    childUserId: String @sql(type: "BINARY(16)", index: true)
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
CREATE TABLE `dbname`.`test_User` (
  `userId` BINARY(16) NOT NULL,
  `uniqueColumn` INT NOT NULL UNIQUE,
  `databaseOnlyField` INT NOT NULL,
  PRIMARY KEY (`userId`)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dbname`.`test_Post` (
  `postId` INT NOT NULL AUTO_INCREMENT,
  `userId` BINARY(16) NOT NULL,
  `content` VARCHAR(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `likes` INT NOT NULL,
  `dateCreated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`postId`),
  INDEX `USERIDINDEX` (`userId` ASC)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dbname`.`test_UserPair` (
  `userPairId` BINARY(16) NOT NULL,
  `parentUserId` BINARY(16) NOT NULL,
  `childUserId` BINARY(16) NOT NULL,
  PRIMARY KEY (`userPairId`),
  INDEX `PARENTUSERIDINDEX` (`parentUserId` ASC),
  INDEX `CHILDUSERIDINDEX` (`childUserId` ASC),
  UNIQUE(parentUserId, childUserId),
  FOREIGN KEY (parentUserId) REFERENCES User(userId)
);
```

Also see [main-test.ts](__tests__/main-test.ts) for a working example.

## MySQL Syntax
For reference:
```
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name
    (create_definition,...)
    [table_options]
    [partition_options]
```

## Arguments for `@sql()`:
ON OBJECT:
* unicode
  * Adds `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` as *table_option*.
* constraints
  * Any text written in here will be appended "as is" to the *create_definition*.  

ON FIELD_DEFINITION:
* auto
  * Marks a column as being AUTO_INCREMENT.
  * Column with "auto" must have INT or SERIAL type.
  * "default" is not allowed with "auto".
  * "unicode" is not allowed with "auto".
* default
  * Sets the DEFAULT clause.
* index
  * Creates an index for the column.
* nullable
  * Marks the column with NULL. By default, all columns are NOT NULL.
* primary
  * Creates a PRIMARY KEY clause for the column.
  * At least one column needs to be marked as "primary".
  * "primary" is not allowed with "nullable".
* type
  * Specify the column type.
  * If type is not specified, the MySQL type will be inferred from the GraphQL type.
  * GraphQLString types must be explicitly defined using "type".
* unicode
  * If any column is marked with "unicode", then the table will have `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`.
* unique
  * Marks a column with the UNIQUE keyword.

## SQL Features Supported<sup>1</sup>:
- [x] Auto Increment
- [x] Default
- [x] Index
- [x] Not Null
- [x] Primary Key
- [x] Unicode
- [x] Unique
- [ ] Check
- [X] Constraints
- [X] Foreign Key (via @constraints)
- [ ] Generated Columns

<sup>1</sup>Only MySQL is supported at the moment.
